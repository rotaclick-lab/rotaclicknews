import Link from 'next/link'
import { Package, CheckCircle2, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { HistoricoClient } from './historico-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Histórico de Fretes | RotaClick',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let freights: any[] = []

  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('freights')
      .select('id, status, payment_status, carrier_name, price, origin_zip, dest_zip, deadline_days, created_at, proof_urls, taxable_weight, invoice_value')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    freights = data ?? []
  }

  const paid = freights.filter(f => f.payment_status === 'paid')
  const pending = freights.filter(f => f.payment_status !== 'paid' && f.payment_status !== 'failed' && f.payment_status !== 'expired')
  const totalSpent = paid.reduce((s, f) => s + (Number(f.price) || 0), 0)

  return (
    <div className="py-8 px-4 md:px-8 pb-24 md:pb-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de Fretes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Todos os fretes contratados na plataforma</p>
      </div>

      {/* KPIs */}
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

      <HistoricoClient freights={freights} />

      <div className="text-center">
        <Link href="/cliente/cotacao" className="inline-flex items-center gap-2 text-sm text-brand-600 font-medium hover:underline">
          <Package className="h-4 w-4" /> Contratar novo frete
        </Link>
      </div>

    </div>
  )
}
