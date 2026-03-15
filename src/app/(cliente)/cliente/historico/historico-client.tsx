'use client'

import { Fragment, useState, useMemo } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle, Truck, Download, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProofViewer } from '../proof-viewer'
import Link from 'next/link'

interface Freight {
  id: string
  status: string
  payment_status: string
  carrier_name: string | null
  price: number
  origin_zip: string
  dest_zip: string
  deadline_days: number | null
  created_at: string
  proof_urls: string[] | null
  taxable_weight: number | null
  invoice_value: number | null
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

function statusLabel(f: Freight) {
  if (f.payment_status === 'paid') {
    const map: Record<string, string> = { pending: 'Aguardando', in_transit: 'Em Trânsito', delivered: 'Entregue', cancelled: 'Cancelado' }
    return map[f.status] ?? 'Pago'
  }
  if (f.payment_status === 'failed' || f.payment_status === 'expired' || f.status === 'cancelled') return 'Cancelado'
  return 'Pendente'
}

export function HistoricoClient({ freights }: { freights: Freight[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const filtered = useMemo(() => {
    const now = new Date()
    return freights.filter(f => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !f.carrier_name?.toLowerCase().includes(q) &&
          !f.origin_zip?.includes(q) &&
          !f.dest_zip?.includes(q)
        ) return false
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid' && f.payment_status !== 'paid') return false
        if (statusFilter === 'in_transit' && !(f.payment_status === 'paid' && f.status === 'in_transit')) return false
        if (statusFilter === 'delivered' && !(f.payment_status === 'paid' && f.status === 'delivered')) return false
        if (statusFilter === 'pending' && f.payment_status === 'paid') return false
      }
      if (periodFilter !== 'all') {
        const created = new Date(f.created_at)
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        if (periodFilter === '30' && diffDays > 30) return false
        if (periodFilter === '90' && diffDays > 90) return false
        if (periodFilter === '180' && diffDays > 180) return false
      }
      return true
    })
  }, [freights, search, statusFilter, periodFilter])

  const totalSpentFiltered = filtered.filter(f => f.payment_status === 'paid').reduce((s, f) => s + (Number(f.price) || 0), 0)

  const handleExportCSV = () => {
    const header = ['Data', 'Origem', 'Destino', 'Transportadora', 'Peso (kg)', 'Prazo', 'Status', 'Valor (R$)']
    const rows = filtered.map(f => [
      new Date(f.created_at).toLocaleDateString('pt-BR'),
      fmtCep(f.origin_zip),
      fmtCep(f.dest_zip),
      f.carrier_name ?? '—',
      f.taxable_weight ? Number(f.taxable_weight).toFixed(1) : '—',
      f.deadline_days ? `${f.deadline_days}d úteis` : '—',
      statusLabel(f),
      f.price ? Number(f.price).toFixed(2).replace('.', ',') : '—',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico-fretes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar transportadora, CEP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="paid">Pagos</option>
              <option value="in_transit">Em Trânsito</option>
              <option value="delivered">Entregues</option>
              <option value="pending">Pendentes</option>
            </select>
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">Todo período</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="180">Últimos 6 meses</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="h-9 border-brand-200 text-brand-700 hover:bg-brand-50 shrink-0"
            >
              <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">
            {filtered.length} frete{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {filtered.length > 0 && (
              <span className="ml-2 text-orange-600 font-bold">{fmt(totalSpentFiltered)}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Truck className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                {freights.length === 0 ? 'Nenhum frete encontrado.' : 'Nenhum frete corresponde aos filtros.'}
              </p>
              {freights.length === 0 && (
                <Link href="/cliente/cotacao" className="text-sm text-brand-600 hover:underline font-medium">
                  Fazer primeira cotação →
                </Link>
              )}
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
                  {filtered.map((f) => {
                    const proofCount = Array.isArray(f.proof_urls) ? f.proof_urls.length : 0
                    return (
                      <Fragment key={f.id}>
                        <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
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
                          <td className="py-3 px-4 text-right font-semibold text-orange-600 whitespace-nowrap">
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
    </div>
  )
}
