import { listCarrierIntegrations, listCompaniesForIntegration } from '@/app/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2 } from 'lucide-react'
import { IntegracoesPlataformaList } from './integracoes-list'

export const dynamic = 'force-dynamic'

export default async function AdminIntegracoesPage() {
  const [integrationsResult, companiesResult] = await Promise.all([
    listCarrierIntegrations(),
    listCompaniesForIntegration(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrações de Plataforma</h1>
        <p className="text-muted-foreground">
          Gerencie as integrações de TMS negociadas com cada transportadora (SSW, Intelipost, Mandaê, etc.)
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total de integrações</p>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {integrationsResult.success ? integrationsResult.data.length : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5">
            <p className="text-sm text-green-700">Ativas</p>
            <p className="text-3xl font-black text-green-700 mt-1">
              {integrationsResult.success
                ? integrationsResult.data.filter(i => i.is_active).length
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Transportadoras disponíveis</p>
            <p className="text-3xl font-black text-slate-800 mt-1">
              {companiesResult.success ? companiesResult.data.length : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-brand-500" />
            Integrações cadastradas
          </CardTitle>
          <CardDescription>
            Cada integração conecta uma transportadora a um TMS externo para cotação automática de frete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrationsResult.success && companiesResult.success ? (
            <IntegracoesPlataformaList
              integrations={integrationsResult.data}
              companies={companiesResult.data}
            />
          ) : (
            <p className="text-sm text-red-600">
              {integrationsResult.success === false ? integrationsResult.error : companiesResult.error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
