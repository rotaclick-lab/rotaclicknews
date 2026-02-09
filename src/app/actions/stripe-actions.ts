'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export async function createCheckoutSession(offer: { carrier: string, price: number, id: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Você precisa estar logado para finalizar o pagamento.' }
    }

    // No ambiente de teste, usaremos uma URL de sucesso simulada
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Frete: ${offer.carrier}`,
              description: `Serviço de transporte via RotaClick`,
            },
            unit_amount: Math.round(offer.price * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cotacao/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cotacao`,
      customer_email: user.email,
      metadata: {
        offer_id: offer.id,
        user_id: user.id,
      }
    })

    return { success: true, url: session.url }
  } catch (error: any) {
    console.error('Erro ao criar sessão do Stripe:', error)
    return { success: false, error: error.message }
  }
}
