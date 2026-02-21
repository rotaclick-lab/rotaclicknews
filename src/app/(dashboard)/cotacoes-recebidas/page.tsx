import { listCarrierQuotes } from '@/app/actions/quotes-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, TrendingUp, CheckCircle2, MapPin, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_CLASSES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', expired: 'Expirado', failed: 'Falhou',
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtCep = (v: string) => v ? `${v.slice(0,5)}-${v.slice(5)}` : '—'

export default async function CotacoesRecebidasPage() {
  const result = await listCarrierQuotes({ perPage: 50 })
  const freights = result.success ? (result.data?.freights ?? []) : []
  const total = result.success ? (result.data?.total ?? 0) : 0

  const paid = freights.filter((f: any) => f.payment_status === 'paid').length
  const conversionRate = total > 0 ? ((paid / total) * 100).toFixed(1) : '0'
  const totalRevenue = freights
    .filter((f: any) => f.payment_status === 'paid')
    .reduce((sum: number, f: any) => sum + (Number(f.price) || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-800">Cotações Recebidas</h1>
        <p className="text-muted-foreground">Fretes contratados via sua tabela de preços</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100">
                <Eye className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{total}</p>
                <p className="text-xs text-muted-foreground">Total de fretes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{paid}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-brand-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-indigo-700">{fmt(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Receita total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {freights.length === 0 ? (
        <Card className="border-brand-100">
          <CardContent className="py-16 text-center">
            <Eye className="h-12 w-12 text-brand-200 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum frete recebido ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando clientes cotarem e pagarem usando sua tabela de frete, os registros aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {freights.map((f: any) => (
            <Card key={f.id} className={cn(
              'border-brand-100 hover:shadow-md transition-shadow',
              f.payment_status === 'paid' && 'border-l-4 border-l-emerald-500'
            )}>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{f.id.slice(0, 8).toUpperCase()}</span>
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', STATUS_CLASSES[f.payment_status] ?? 'bg-slate-100 text-slate-600')}>
                        {STATUS_LABELS[f.payment_status] ?? f.payment_status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-brand-500" />
                      <span className="font-medium">{fmtCep(f.origin_zip)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{fmtCep(f.dest_zip)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cliente: <span className="font-medium text-foreground">{f.client_name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-800">{f.price ? fmt(Number(f.price)) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Valor do frete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
