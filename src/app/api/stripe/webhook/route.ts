import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertFreightFromCheckout } from '@/app/actions/quotes-actions'
import { notifyEmbarcadorFretePago, notifyTransportadoraNovoFrete } from '@/lib/zapi'
import { emailEmbarcadorFretePago, emailTransportadoraNovoFrete } from '@/lib/email'

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
        const offerId = session.metadata?.offer_id ?? ''
        const userId = session.metadata?.user_id ?? ''
        const carrierName = session.metadata?.carrier_name ?? 'Transportadora'
        const carrierId = session.metadata?.carrier_id ?? undefined
        const originZip = session.metadata?.origin_zip ?? ''
        const destZip = session.metadata?.dest_zip ?? ''
        const deadlineDays = session.metadata?.deadline_days ? Number(session.metadata.deadline_days) : null
        const taxableWeight = session.metadata?.taxable_weight ? Number(session.metadata.taxable_weight) : null
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : undefined
        const price = (session.amount_total ?? 0) / 100

        if (offerId && userId) {
          await upsertFreightFromCheckout({
            sessionId: session.id,
            offerId,
            userId,
            carrierName,
            ...(carrierId ? { carrierId } : {}),
            routeId: offerId,
            price,
            paymentStatus: 'paid',
            ...(paymentIntentId ? { paymentIntentId } : {}),
          })
        }

        if (offerId) {
          await updateFreightPaymentSnapshot(offerId, {
            payment_status: 'paid',
            stripe_last_event_id: event.id,
            stripe_last_event_type: event.type,
            stripe_checkout_session_id: session.id,
            ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
            stripe_updated_at: new Date().toISOString(),
          })
        }

        // Notificações WhatsApp Z-API (fire-and-forget)
        if (userId) {
          const admin = createAdminClient()

          // Embarcador
          const { data: embarcadorProfile } = await admin
            .from('profiles')
            .select('phone')
            .eq('id', userId)
            .maybeSingle()

          const embarcadorPhone = embarcadorProfile?.phone?.replace(/\D/g, '')
          if (embarcadorPhone && embarcadorPhone.length >= 10) {
            void notifyEmbarcadorFretePago({
              phone: embarcadorPhone,
              carrierName,
              originZip,
              destZip,
              deadlineDays,
              price,
            })
          }

          // Email para embarcador
          const { data: embarcadorFull } = await admin
            .from('profiles')
            .select('full_name, name, email')
            .eq('id', userId)
            .maybeSingle()
          if (embarcadorFull?.email) {
            void emailEmbarcadorFretePago({
              to: embarcadorFull.email,
              name: embarcadorFull.full_name || embarcadorFull.name || 'Cliente',
              carrierName,
              originZip,
              destZip,
              price,
              deadlineDays,
            })
          }

          // Transportadora (busca pelo carrierId)
          if (carrierId) {
            const { data: carrierProfile } = await admin
              .from('profiles')
              .select('phone, full_name, name, email')
              .eq('id', carrierId)
              .maybeSingle()

            const carrierPhone = carrierProfile?.phone?.replace(/\D/g, '')
            if (carrierPhone && carrierPhone.length >= 10) {
              void notifyTransportadoraNovoFrete({
                phone: carrierPhone,
                originZip,
                destZip,
                price,
                deadlineDays,
                taxableWeight,
              })
            }
            if (carrierProfile?.email) {
              void emailTransportadoraNovoFrete({
                to: carrierProfile.email,
                name: carrierProfile.full_name || carrierProfile.name || 'Transportadora',
                originZip,
                destZip,
                price,
                deadlineDays,
                taxableWeight,
              })
            }
          }
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const offerId = session.metadata?.offer_id ?? ''
        const userId = session.metadata?.user_id ?? ''
        const carrierName = session.metadata?.carrier_name ?? 'Transportadora'
        const carrierId = session.metadata?.carrier_id ?? undefined
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : undefined
        const price = (session.amount_total ?? 0) / 100

        if (offerId && userId) {
          await upsertFreightFromCheckout({
            sessionId: session.id,
            offerId,
            userId,
            carrierName,
            ...(carrierId ? { carrierId } : {}),
            routeId: offerId,
            price,
            paymentStatus: 'expired',
            ...(paymentIntentId ? { paymentIntentId } : {}),
          })
        }

        if (offerId) {
          await updateFreightPaymentSnapshot(offerId, {
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
