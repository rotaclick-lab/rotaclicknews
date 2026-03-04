import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, TrendingUp, DollarSign, Truck, Plus, ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle, UserCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getClienteDashboardStats } from '@/app/actions/quotes-actions'
import { getClienteProfile } from '@/app/actions/cliente-profile-actions'
import { ProofViewer } from './proof-viewer'

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
      pending:    { label: 'Aguardando',  icon: Clock,         cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      in_transit: { label: 'Em Trânsito', icon: Truck,         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      delivered:  { label: 'Entregue',    icon: CheckCircle2,  cls: 'bg-green-50 text-green-700 border-green-200' },
      cancelled:  { label: 'Cancelado',   icon: XCircle,       cls: 'bg-red-50 text-red-700 border-red-200' },
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
  const [result, profileResult] = await Promise.all([
    getClienteDashboardStats(),
    getClienteProfile(),
  ])
  const stats = result.success ? result.data : null
  const profile = profileResult.data ?? null

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Perfil'
  const avatarUrl = profile?.avatar_url ?? ''

  const maxMonthVal = Math.max(...(stats?.monthlyData.map(m => m.valor) ?? [1]), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meu Painel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe seus fretes e gastos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-brand-200 text-brand-700 hover:bg-brand-50 pl-2">
              <Link href="/cliente/perfil" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <UserCircle className="h-5 w-5 text-brand-500" />
                  )}
                </div>
                <span>{firstName}</span>
              </Link>
            </Button>
            <Button asChild className="bg-brand-500 hover:bg-brand-600 text-white">
              <Link href="/cotacao?from=cliente">
                <Plus className="h-4 w-4 mr-1.5" />Nova Cotação
              </Link>
            </Button>
          </div>
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
              label: 'Total Gasto',
              value: formatCurrency(stats?.totalSpent ?? 0),
              icon: DollarSign,
              color: 'text-orange-600',
              bg: 'bg-orange-50',
            },
            {
              label: 'Ticket Médio',
              value: formatCurrency(stats?.avgPrice ?? 0),
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
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

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Gráfico de gastos mensais */}
          <Card className="lg:col-span-3 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Gastos nos últimos 6 meses</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats || stats.monthlyData.every(m => m.valor === 0) ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                  <TrendingUp className="h-8 w-8 opacity-40" />
                  <span>Nenhum gasto registrado ainda</span>
                </div>
              ) : (
                <div className="flex items-end gap-3 h-40 pt-4">
                  {stats.monthlyData.map((m) => {
                    const heightPct = maxMonthVal > 0 ? (m.valor / maxMonthVal) * 100 : 0
                    return (
                      <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-brand-600">
                          {m.valor > 0 ? formatCurrency(m.valor).replace('R$\u00a0', 'R$') : ''}
                        </span>
                        <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '80px' }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-brand-400 rounded-t-md transition-all"
                            style={{ height: `${Math.max(heightPct, m.valor > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{m.mes}</span>
                        <span className="text-[10px] text-slate-400">{m.fretes} frete{m.fretes !== 1 ? 's' : ''}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações rápidas */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Nova cotação de frete', href: '/cotacao?from=cliente', icon: Plus, color: 'bg-brand-500 hover:bg-brand-600' },
                { label: 'Ver histórico completo', href: '/cliente/historico', icon: Package, color: 'bg-slate-700 hover:bg-slate-800' },
                { label: 'Falar com suporte', href: '/cliente/suporte', icon: ArrowRight, color: 'bg-orange-500 hover:bg-orange-600' },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors ${color}`}
                >
                  <span>{label}</span>
                  <Icon className="h-4 w-4 opacity-80" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

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
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">Data</th>
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
                            <td className="py-3 px-3 font-medium text-slate-700">
                              {formatCep(f.origin_zip)} → {formatCep(f.dest_zip)}
                            </td>
                            <td className="py-3 px-3 text-slate-600">{f.carrier_name || '—'}</td>
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(f.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={f.status} paymentStatus={f.payment_status} />
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-orange-600">
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
    </div>
  )
}
