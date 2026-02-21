import { listAdminRepasses, listAdminCarriersForSelect } from '@/app/actions/admin-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RepassesList } from './repasses-list'
import { Clock, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default async function RepassesPage({
  searchParams,
}: {
  searchParams: { status?: string; carrier?: string }
}) {
  const status = searchParams.status ?? 'pending'

  const [allResult, carriers] = await Promise.all([
    listAdminRepasses({}),
    listAdminCarriersForSelect().catch(() => [] as Array<{ id: string; label: string }>),
  ])

  const all = allResult.success ? allResult.data : []
  const pending = all.filter((f) => f.repasse_status === 'pending')
  const paid = all.filter((f) => f.repasse_status === 'paid')

  const totalPending = pending.reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)
  const totalPaid = paid.reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)
  const totalRotaclick = all.reduce((s, r) => s + (Number(r.rotaclick_amount) || 0), 0)
  const totalRevenue = all.reduce((s, r) => s + (Number(r.price) || 0), 0)

  // Filter by status and carrier for display
  let filtered = status === 'paid' ? paid : pending
  if (searchParams.carrier) {
    filtered = filtered.filter((f) => f.carrier_id === searchParams.carrier)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Repasses às Transportadoras</h1>
        <p className="text-muted-foreground">Controle de pagamentos devidos às transportadoras parceiras.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xl font-black text-slate-900">{fmt(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total recebido (clientes)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100"><DollarSign className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xl font-black text-orange-700">{fmt(totalRotaclick)}</p>
              <p className="text-xs text-muted-foreground">Margem RotaClick</p>
            </div>
          </CardContent>
        </Card>
        <a href="/admin/repasses?status=pending">
          <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${status === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-xl font-black text-yellow-700">{fmt(totalPending)}</p>
                <p className="text-xs text-muted-foreground">{pending.length} repasses pendentes</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="/admin/repasses?status=paid">
          <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${status === 'paid' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xl font-black text-emerald-700">{fmt(totalPaid)}</p>
                <p className="text-xs text-muted-foreground">{paid.length} repasses pagos</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{status === 'pending' ? 'Repasses pendentes' : 'Repasses realizados'}</CardTitle>
          <CardDescription>
            {status === 'pending'
              ? 'Fretes pagos pelos clientes aguardando repasse às transportadoras.'
              : 'Repasses já realizados às transportadoras.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepassesList freights={filtered} status={status} carriers={carriers} selectedCarrier={searchParams.carrier} />
        </CardContent>
      </Card>
    </div>
  )
}
