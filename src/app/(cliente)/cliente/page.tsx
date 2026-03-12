import { Fragment } from 'react'
import Link from 'next/link'
import { Package, Truck, ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getClienteDashboardStats } from '@/app/actions/quotes-actions'
import { ProofViewer } from './proof-viewer'
import { DashboardChart } from './dashboard-chart'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meu Painel | RotaClick',
  description: 'Acompanhe seus fretes e gastos na RotaClick',
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatCep(cep: string) {
  const d = cep?.replace(/\D/g, '') ?? ''
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep
}

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  if (paymentStatus === 'paid') {
    const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
      pending:    { label: 'Aguardando',  icon: Clock,        cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      in_transit: { label: 'Em Trânsito', icon: Truck,        cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      delivered:  { label: 'Entregue',    icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
      cancelled:  { label: 'Cancelado',   icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-200' },
    }
    const s = map[status] ?? { label: 'Pago', icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
        <Icon className="h-3 w-3" />{s.label}
      </span>
    )
  }
  if (paymentStatus === 'failed' || paymentStatus === 'expired' || status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3" />Cancelado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 border-slate-200">
      <AlertCircle className="h-3 w-3" />Pendente
    </span>
  )
}

export default async function ClientePage() {
  const result = await getClienteDashboardStats()
  const stats = result.success ? result.data : null

  return (
    <div className="py-8 px-4 md:px-8 pb-24 md:pb-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Painel</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seus fretes e gastos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Fretes',
            value: String(stats?.totalFreights ?? 0),
            icon: Package,
            color: 'text-brand-600',
            bg: 'bg-brand-50',
          },
          {
            label: 'Fretes Pagos',
            value: String(stats?.paidFreights ?? 0),
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Em Trânsito',
            value: String(stats?.inTransitFreights ?? 0),
            icon: Truck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Total Gasto',
            value: formatCurrency(stats?.totalSpent ?? 0),
            icon: DollarSign,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">Gastos nos últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardChart data={stats?.monthlyData ?? []} />
        </CardContent>
      </Card>

      {/* Fretes recentes */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">Fretes recentes</CardTitle>
          <Link href="/cliente/historico" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {!stats || stats.recentFreights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Truck className="h-10 w-10 opacity-30" />
              <p className="text-sm">Você ainda não tem fretes contratados.</p>
              <Button asChild size="sm" className="bg-brand-500 hover:bg-brand-600 text-white mt-1">
                <Link href="/cotacao?from=cliente">Fazer primeira cotação</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Rota</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Transportadora</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 hidden md:table-cell">Data</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Status</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentFreights.map((f) => {
                    const proofCount = Array.isArray(f.proof_urls) ? f.proof_urls.length : 0
                    return (
                      <Fragment key={f.id}>
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                            {formatCep(f.origin_zip)} → {formatCep(f.dest_zip)}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{f.carrier_name || '—'}</td>
                          <td className="py-3 px-3 text-slate-500 hidden md:table-cell whitespace-nowrap">
                            {new Date(f.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={f.status} paymentStatus={f.payment_status} />
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-orange-600 whitespace-nowrap">
                            {formatCurrency(Number(f.price))}
                          </td>
                        </tr>
                        {proofCount > 0 && (
                          <tr className="border-b border-slate-50 bg-emerald-50/30">
                            <td colSpan={5} className="px-3 pb-3">
                              <ProofViewer freightId={f.id} proofCount={proofCount} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
