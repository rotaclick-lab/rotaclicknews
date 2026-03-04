import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ProofViewer } from '../proof-viewer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Histórico de Fretes | RotaClick',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtCep(v: string) {
  const d = v?.replace(/\D/g, '') ?? ''
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : v
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

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let freights: any[] = []
  let totalSpent = 0

  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('freights')
      .select('id, status, payment_status, carrier_name, price, origin_zip, dest_zip, deadline_days, created_at, proof_urls, taxable_weight, invoice_value')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    freights = data ?? []
    totalSpent = freights.filter(f => f.payment_status === 'paid').reduce((s, f) => s + (Number(f.price) || 0), 0)
  }

  const paid = freights.filter(f => f.payment_status === 'paid')
  const pending = freights.filter(f => f.payment_status !== 'paid' && f.payment_status !== 'failed')

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Histórico de Fretes</h1>
            <p className="text-sm text-slate-500">Todos os fretes contratados na plataforma</p>
          </div>
        </div>

        {/* KPIs resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: String(freights.length), icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Pagos', value: String(paid.length), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pendentes', value: String(pending.length), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total gasto', value: fmt(totalSpent), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="text-base font-bold text-slate-900">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {freights.length} frete{freights.length !== 1 ? 's' : ''} encontrado{freights.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {freights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Truck className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nenhum frete encontrado.</p>
                <Link
                  href="/cotacao?from=cliente"
                  className="text-sm text-brand-600 hover:underline font-medium"
                >
                  Fazer primeira cotação →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rota</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Transportadora</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Peso</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Prazo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freights.map((f) => {
                      const proofCount = Array.isArray(f.proof_urls) ? f.proof_urls.length : 0
                      return (
                        <Fragment key={f.id}>
                          <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {fmtCep(f.origin_zip)} → {fmtCep(f.dest_zip)}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{f.carrier_name || '—'}</td>
                            <td className="py-3 px-4 text-slate-500 hidden md:table-cell">
                              {f.taxable_weight ? `${Number(f.taxable_weight).toFixed(1)} kg` : '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 hidden md:table-cell">
                              {f.deadline_days ? `${f.deadline_days}d úteis` : '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(f.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={f.status} paymentStatus={f.payment_status} />
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-orange-600">
                              {f.price ? fmt(Number(f.price)) : '—'}
                            </td>
                          </tr>
                          {proofCount > 0 && (
                            <tr className="border-b border-slate-50 bg-emerald-50/30">
                              <td colSpan={7} className="px-4 pb-3">
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

        <div className="text-center">
          <Link href="/cotacao?from=cliente" className="inline-flex items-center gap-2 text-sm text-brand-600 font-medium hover:underline">
            <Package className="h-4 w-4" /> Contratar novo frete
          </Link>
        </div>

      </div>
    </div>
  )
}
