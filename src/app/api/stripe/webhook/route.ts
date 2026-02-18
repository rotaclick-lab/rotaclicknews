import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.payment_failed',
])

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function registerEventIdempotency(event: Stripe.Event, rawPayload: string) {
  const admin = createAdminClient()

  const { error } = await admin.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    payload: rawPayload,
  })

  if (!error) {
    return { shouldProcess: true as const }
  }

  if ((error as { code?: string }).code === '23505') {
    return { shouldProcess: false as const }
  }

  throw error
}

type PaymentSnapshot = {
  payment_status: 'paid' | 'failed' | 'expired'
  stripe_last_event_id: string
  stripe_last_event_type: Stripe.Event.Type
  stripe_checkout_session_id?: string
  stripe_payment_intent_id?: string
  stripe_updated_at: string
}

async function updateFreightPaymentSnapshot(freightId: string, snapshot: PaymentSnapshot) {
  if (!isUuid(freightId)) {
    return
  }

  const admin = createAdminClient()

  const { data: freight, error: fetchError } = await admin
    .from('freights')
    .select('id, metadata')
    .eq('id', freightId)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (!freight?.id) {
    return
  }

  const currentMetadata =
    freight.metadata && typeof freight.metadata === 'object' && !Array.isArray(freight.metadata)
      ? freight.metadata
      : {}

  const currentPaymentMetadata =
    (currentMetadata as { payment?: Record<string, unknown> }).payment ?? {}

  const metadata = {
    ...currentMetadata,
    payment: {
      ...currentPaymentMetadata,
      ...snapshot,
    },
  }

  const { error: updateError } = await admin
    .from('freights')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', freightId)

  if (updateError) {
    throw updateError
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!webhookSecret || !stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 })
  }

  const signature = (await headers()).get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura Stripe ausente' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('Falha ao validar assinatura do webhook Stripe:', error)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true })
  }

  try {
    const idempotency = await registerEventIdempotency(event, rawBody)
    if (!idempotency.shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const freightId = session.metadata?.offer_id
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null

        if (freightId) {
          await updateFreightPaymentSnapshot(freightId, {
            payment_status: 'paid',
            stripe_last_event_id: event.id,
            stripe_last_event_type: event.type,
            stripe_checkout_session_id: session.id,
            ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
            stripe_updated_at: new Date().toISOString(),
          })
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const freightId = session.metadata?.offer_id
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null

        if (freightId) {
          await updateFreightPaymentSnapshot(freightId, {
            payment_status: 'expired',
            stripe_last_event_id: event.id,
            stripe_last_event_type: event.type,
            stripe_checkout_session_id: session.id,
            ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
            stripe_updated_at: new Date().toISOString(),
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const freightId = paymentIntent.metadata?.offer_id

        if (freightId) {
          await updateFreightPaymentSnapshot(freightId, {
            payment_status: 'failed',
            stripe_last_event_id: event.id,
            stripe_last_event_type: event.type,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_updated_at: new Date().toISOString(),
          })
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
