import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, PackageSearch, ArrowRight } from 'lucide-react'
import { FunnelExport } from './funnel-export'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Funil de Cotações | Admin RotaClick',
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtCep = (v: string) =>
  v?.length === 8 ? `${v.slice(0, 5)}-${v.slice(5)}` : (v ?? '—')

export default async function FunilCotacoesPage() {
  const admin = createAdminClient()

  const { data: leads, count } = await admin
    .from('quote_funnel')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

  const all = leads ?? []
  const withResults = all.filter((l) => l.results_count > 0).length
  const converted = all.filter((l) => l.converted).length
  const uniqueEmails = new Set(all.map((l) => l.contact_email).filter(Boolean)).size
  const convRate = all.length > 0 ? ((converted / all.length) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Funil de Cotações</h1>
          <p className="text-sm text-muted-foreground">Leads capturados silenciosamente no step 1 da cotação</p>
        </div>
        <FunnelExport leads={all} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de leads', value: String(count ?? 0), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Emails únicos', value: String(uniqueEmails), icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Com resultados', value: String(withResults), icon: PackageSearch, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Taxa conversão', value: `${convRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
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

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Leads recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {all.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum lead ainda. Aguarde cotações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Data</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Nome</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Email</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Telefone</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Rota</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Peso</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">NF</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Resultados</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Converteu</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((l) => (
                    <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{l.contact_name || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.contact_email ? (
                          <a href={`mailto:${l.contact_email}`} className="text-brand-600 hover:underline">
                            {l.contact_email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.contact_phone ? (
                          <a href={`https://wa.me/55${l.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {l.contact_phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <span className="font-mono text-xs">
                          {fmtCep(l.origin_zip)} → {fmtCep(l.dest_zip)}
                        </span>
                        {(l.origin_city || l.dest_city) && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {l.origin_city} → {l.dest_city}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.taxable_weight ? `${Number(l.taxable_weight).toLocaleString('pt-BR')} kg` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {l.invoice_value ? fmt(Number(l.invoice_value)) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          l.results_count > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {l.results_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${l.converted ? 'bg-green-500' : 'bg-slate-300'}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
