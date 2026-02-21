'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createStripeAccountLink } from '@/app/actions/stripe-actions'
import { toast } from 'sonner'
import { CreditCard, CheckCircle2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'

interface StripeConnectSettingsProps {
  stripeConnectId?: string | null
  stripeOnboardingComplete?: boolean
}

export function StripeConnectSettings({ stripeConnectId, stripeOnboardingComplete }: StripeConnectSettingsProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    const result = await createStripeAccountLink()
    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      toast.error(result.error ?? 'Erro ao conectar com Stripe')
      setLoading(false)
    }
  }

  return (
    <Card className="border-brand-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-500" />
          Pagamentos via Stripe Connect
        </CardTitle>
        <CardDescription>
          Conecte sua conta ao Stripe para receber pagamentos diretamente dos clientes via RotaClick.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stripeOnboardingComplete ? (
          <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Conta Stripe conectada!</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                Você está pronto para receber pagamentos. ID: <code className="font-mono text-xs bg-emerald-100 px-1 rounded">{stripeConnectId}</code>
              </p>
            </div>
          </div>
        ) : stripeConnectId ? (
          <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800">Onboarding incompleto</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Sua conta foi criada mas o cadastro no Stripe ainda não foi finalizado.
              </p>
              <Button
                onClick={handleConnect}
                disabled={loading}
                size="sm"
                className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                Continuar cadastro no Stripe
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl space-y-2">
              <p className="text-sm font-medium text-brand-800">Como funciona:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Clientes pagam pelo RotaClick com cartão de crédito</li>
                <li>O valor é transferido automaticamente para sua conta Stripe</li>
                <li>A plataforma retém uma comissão de 10% por transação</li>
                <li>Saques disponíveis em 2 dias úteis após o pagamento</li>
              </ul>
            </div>
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white w-full md:w-auto"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conectando...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Conectar com Stripe</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
