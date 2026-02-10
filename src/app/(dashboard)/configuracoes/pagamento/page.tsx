'use client'

import { useState } from 'react'
import { CreditCard, Building2, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createStripeAccountLink } from '@/app/actions/stripe-actions'
import { toast } from 'sonner'

export default function PagamentoSettingsPage() {
  const [loading, setLoading] = useState(false)

  const handleConnectStripe = async () => {
    setLoading(true)
    try {
      const result = await createStripeAccountLink()
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error || 'Erro ao iniciar conexão com Stripe')
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-800">Configurações de Pagamento</h1>
        <p className="text-muted-foreground">
          Gerencie como sua transportadora recebe os pagamentos dos fretes.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 border-brand-200">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Building2 className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>Receba pagamentos automaticamente na sua conta bancária</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p><strong>Split Automático:</strong> O RotaClick retém a comissão e envia o restante direto para você.</p>
              </div>
              <div className="flex gap-3 mt-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p><strong>Segurança:</strong> Seus dados bancários são processados com segurança pelo Stripe.</p>
              </div>
              <div className="flex gap-3 mt-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p><strong>Rapidez:</strong> Receba os valores conforme o prazo da sua conta Stripe.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Como funciona?
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Clique no botão abaixo para ser redirecionado ao Stripe.</li>
                <li>Preencha os dados da sua empresa e conta bancária.</li>
                <li>Após completar, você voltará para o RotaClick e estará pronto para receber.</li>
              </ol>
            </div>

            <Button 
              size="lg" 
              className="w-full md:w-auto font-bold bg-brand-500 hover:bg-brand-600 text-white" 
              onClick={handleConnectStripe}
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'CONECTAR MINHA CONTA BANCÁRIA'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Repasses</CardTitle>
            <CardDescription>Visualize todos os valores já transferidos para sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg">
              <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Nenhum repasse realizado ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Conecte sua conta para começar a receber.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
