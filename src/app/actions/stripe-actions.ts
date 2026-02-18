'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

function resolveAppBaseUrl() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (!rawBaseUrl) {
    throw new Error(
      'URL base da aplicação não configurada para o checkout Stripe (NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL).'
    )
  }

  const normalizedBaseUrl = /^https?:\/\//i.test(rawBaseUrl)
    ? rawBaseUrl
    : `https://${rawBaseUrl}`

  return new URL(normalizedBaseUrl).origin
}

/**
 * Cria uma sessão de checkout com suporte ao Stripe Connect (Split Payment)
 * @param offer Dados da oferta selecionada
 * @param connectedAccountId ID da conta Stripe da transportadora (opcional para teste)
 */
export async function createCheckoutSession(
  offer: { carrier: string, price: number, id: string },
  connectedAccountId?: string,
  nextPath = '/cotacao?resumeCheckout=1'
) {
  try {
    const appBaseUrl = resolveAppBaseUrl()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        requiresAuth: true,
        loginUrl: `/login?next=${encodeURIComponent(nextPath)}`,
        error: 'Você precisa estar logado para finalizar o pagamento.',
      }
    }

    if (!user.email) {
      return { success: false, error: 'Não foi possível identificar o email da conta para pagamento.' }
    }

    // Definimos a comissão da plataforma (ex: 10%)
    const platformFeePercent = 0.10
    const applicationFeeAmount = Math.round(offer.price * platformFeePercent * 100)

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Frete: ${offer.carrier}`,
              description: `Serviço de transporte via RotaClick - Carga #${offer.id.slice(0,8)}`,
            },
            unit_amount: Math.round(offer.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: new URL('/cotacao/sucesso?session_id={CHECKOUT_SESSION_ID}', appBaseUrl).toString(),
      cancel_url: new URL('/cotacao', appBaseUrl).toString(),
      customer_email: user.email,
      metadata: {
        offer_id: offer.id,
        user_id: user.id,
        carrier_name: offer.carrier
      },
      payment_intent_data: {
        metadata: {
          offer_id: offer.id,
          user_id: user.id,
          carrier_name: offer.carrier,
        },
      }
    }

    // Se houver uma conta conectada, configuramos o split de pagamento
    if (connectedAccountId) {
      sessionOptions.payment_intent_data = {
        ...(sessionOptions.payment_intent_data || {}),
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: connectedAccountId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions)

    return { success: true, url: session.url }
  } catch (error: any) {
    console.error('Erro ao criar sessão do Stripe Connect:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cria um link de onboarding para a transportadora se conectar ao Stripe Connect
 */
export async function createStripeAccountLink() {
  try {
    const appBaseUrl = resolveAppBaseUrl()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Usuário não autenticado')
    if (!user.email) throw new Error('Usuário sem email para criar conta Stripe')

    // 1. Criar uma conta Connect para a transportadora (tipo Express)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      metadata: {
        user_id: user.id
      }
    })

    // 2. Salvar o account.id no perfil da transportadora no Supabase (exemplo)
    await supabase
      .from('profiles')
      .update({ stripe_connect_id: account.id })
      .eq('id', user.id)

    // 3. Criar o link de onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: new URL('/configuracoes/pagamento?error=retry', appBaseUrl).toString(),
      return_url: new URL('/configuracoes/pagamento?success=true', appBaseUrl).toString(),
      type: 'account_onboarding',
    })

    return { success: true, url: accountLink.url }
  } catch (error: any) {
    console.error('Erro ao criar link de conta Stripe:', error)
    return { success: false, error: error.message }
  }
}
