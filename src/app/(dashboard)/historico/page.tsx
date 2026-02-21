import { listMyFreights } from '@/app/actions/quotes-actions'
import { History, CheckCircle2, XCircle, Clock, DollarSign, Truck, MapPin, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string; borderColor: string; badgeColor: string; Icon: any }> = {
  paid:      { label: 'Pago',      borderColor: 'border-l-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  pending:   { label: 'Pendente',  borderColor: 'border-l-yellow-400',  badgeColor: 'bg-yellow-100 text-yellow-700',   Icon: Clock },
  expired:   { label: 'Expirado',  borderColor: 'border-l-gray-300',    badgeColor: 'bg-gray-100 text-gray-600',       Icon: XCircle },
  failed:    { label: 'Falhou',    borderColor: 'border-l-red-400',     badgeColor: 'bg-red-100 text-red-700',         Icon: XCircle },
  cancelled: { label: 'Cancelado', borderColor: 'border-l-red-400',     badgeColor: 'bg-red-100 text-red-700',         Icon: XCircle },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtCep = (v: string) => v ? `${v.slice(0,5)}-${v.slice(5)}` : ''

export default async function HistoricoPage() {
  const result = await listMyFreights({ perPage: 50 })
  const freights = result.success ? (result.data?.freights ?? []) : []
  const total = result.success ? (result.data?.total ?? 0) : 0

  const paid = freights.filter((f: any) => f.payment_status === 'paid')
  const pending = freights.filter((f: any) => f.payment_status === 'pending')
  const totalRevenue = paid.reduce((sum: number, f: any) => sum + (Number(f.price) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-800">Histórico de Fretes</h1>
          <p className="text-muted-foreground">Todos os seus fretes contratados na plataforma</p>
        </div>
        <Link href="/cotacao">
          <Button className="bg-brand-500 hover:bg-brand-600 text-white">Nova cotação</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-brand-100"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-brand-100"><History className="h-5 w-5 text-brand-600" /></div><div><p className="text-2xl font-bold text-brand-800">{total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card className="border-brand-100"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold text-emerald-700">{paid.length}</p><p className="text-xs text-muted-foreground">Pagos</p></div></div></CardContent></Card>
        <Card className="border-brand-100"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div><div><p className="text-2xl font-bold text-yellow-700">{pending.length}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div></CardContent></Card>
        <Card className="border-brand-100"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-orange-100"><DollarSign className="h-5 w-5 text-orange-600" /></div><div><p className="text-lg font-bold text-orange-700">{fmt(totalRevenue)}</p><p className="text-xs text-muted-foreground">Total gasto</p></div></div></CardContent></Card>
      </div>

      {freights.length === 0 ? (
        <Card className="border-brand-100">
          <CardContent className="py-16 text-center">
            <History className="h-12 w-12 text-brand-200 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum frete encontrado.</p>
            <p className="text-sm text-muted-foreground mt-1">Faça sua primeira cotação para começar.</p>
            <Link href="/cotacao" className="mt-4 inline-block"><Button className="bg-brand-500 hover:bg-brand-600 text-white">Cotar agora</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {freights.map((f: any) => {
            const cfg = STATUS_CONFIG[f.payment_status] ?? STATUS_CONFIG['pending']
            const StatusIcon = cfg.Icon
            return (
              <Card key={f.id} className={cn('border-brand-100 hover:shadow-md transition-shadow border-l-4', cfg.borderColor)}>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{f.id.slice(0,8).toUpperCase()}</span>
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1', cfg.badgeColor)}>
                          <StatusIcon className="h-3 w-3" />{cfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{new Date(f.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-brand-500" />
                        <span className="font-medium">{fmtCep(f.origin_zip)}</span>
                        <span className="text-muted-foreground"></span>
                        <span className="font-medium">{fmtCep(f.dest_zip)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{f.carrier_name || 'Transportadora'}</span>
                        {f.deadline_days && <span>{f.deadline_days} dias úteis</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-800">{f.price ? fmt(Number(f.price)) : ''}</p>
                      <p className="text-xs text-muted-foreground">Valor do frete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
