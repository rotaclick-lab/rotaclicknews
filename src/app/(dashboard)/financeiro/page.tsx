import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, Clock, CheckCircle2, TrendingUp, MapPin, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const REPASSE_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Aguardando repasse', color: 'bg-yellow-100 text-yellow-800' },
  scheduled: { label: 'Agendado',           color: 'bg-blue-100 text-blue-800' },
  paid:      { label: 'Repassado',          color: 'bg-emerald-100 text-emerald-800' },
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/financeiro')

  const { data: freights } = await supabase
    .from('freights')
    .select('id, price, carrier_amount, rotaclick_amount, repasse_status, repasse_due_date, repasse_paid_at, payment_term_days, origin_zip, dest_zip, created_at, carrier_name')
    .eq('carrier_id', user.id)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })

  const rows = freights ?? []

  const totalBruto = rows.reduce((s, r) => s + (Number(r.price) || 0), 0)
  const totalLiquido = rows.reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)
  const totalPendente = rows.filter(r => r.repasse_status !== 'paid').reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)
  const totalRepassado = rows.filter(r => r.repasse_status === 'paid').reduce((s, r) => s + (Number(r.carrier_amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Seus fretes pagos e repasses da RotaClick</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xl font-black text-slate-900">{fmt(totalBruto)}</p>
              <p className="text-xs text-muted-foreground">Total faturado (bruto)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xl font-black text-emerald-700">{fmt(totalLiquido)}</p>
              <p className="text-xs text-muted-foreground">Seu valor líquido</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xl font-black text-yellow-700">{fmt(totalPendente)}</p>
              <p className="text-xs text-muted-foreground">Aguardando repasse</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100"><CheckCircle2 className="h-5 w-5 text-slate-600" /></div>
            <div>
              <p className="text-xl font-black text-slate-700">{fmt(totalRepassado)}</p>
              <p className="text-xs text-muted-foreground">Já repassado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de fretes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Histórico de repasses</CardTitle>
          <CardDescription>{rows.length} frete(s) pago(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum frete pago ainda. Quando um cliente contratar e pagar, aparecerá aqui.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const repasse = REPASSE_LABELS[r.repasse_status ?? 'pending'] ?? REPASSE_LABELS.pending
                const fmtCep = (z: string | null) => z ? `${z.slice(0,5)}-${z.slice(5)}` : '—'
                return (
                  <div key={r.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {fmtCep(r.origin_zip)} → {fmtCep(r.dest_zip)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Pago em {fmtDate(r.created_at)}
                        {r.repasse_due_date && (
                          <span className="ml-2">· Repasse previsto: <strong>{fmtDate(r.repasse_due_date)}</strong></span>
                        )}
                        {r.repasse_paid_at && (
                          <span className="ml-2">· Repassado em: <strong>{fmtDate(r.repasse_paid_at)}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-700">{fmt(Number(r.carrier_amount) || 0)}</p>
                        <p className="text-xs text-muted-foreground">seu valor</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${repasse.color}`}>
                        {repasse.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
