'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markRepasePaid } from '@/app/actions/admin-actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Freight {
  id: string
  carrier_id: string
  carrierName: string
  price: number | null
  carrier_amount: number | null
  rotaclick_amount: number | null
  payment_term_days: number | null
  repasse_due_date: string | null
  repasse_status: string
  repasse_paid_at: string | null
  created_at: string
  origin_zip: string | null
  dest_zip: string | null
  client_name?: string | null
}

interface RepassesListProps {
  freights: Freight[]
  status: string
  carriers: Array<{ id: string; label: string }>
  selectedCarrier?: string
}

const fmt = (v: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0)
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtCep = (z: string | null) =>
  z ? `${z.slice(0, 5)}-${z.slice(5)}` : '—'

export function RepassesList({ freights, status, carriers, selectedCarrier }: RepassesListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleMarkPaid = async (freightId: string) => {
    if (!confirm('Confirmar que o repasse foi realizado?')) return
    setLoading(freightId)
    const result = await markRepasePaid(freightId)
    if (result.success) {
      toast.success('Repasse marcado como pago!')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao marcar repasse')
    }
    setLoading(null)
  }

  const handleCarrierFilter = (carrierId: string) => {
    const params = new URLSearchParams()
    params.set('status', status)
    if (carrierId && carrierId !== 'all') params.set('carrier', carrierId)
    router.push(`/admin/repasses?${params.toString()}`)
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Carrier filter */}
      <div className="flex gap-2 items-center">
        <Select
          value={selectedCarrier ?? 'all'}
          onValueChange={handleCarrierFilter}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Todas transportadoras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas transportadoras</SelectItem>
            {carriers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{freights.length} registro(s)</span>
      </div>

      {freights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Clock className="h-10 w-10 text-slate-200" />
          <p className="text-muted-foreground text-sm">
            {status === 'pending' ? 'Nenhum repasse pendente.' : 'Nenhum repasse realizado ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {freights.map((f) => {
            const overdue = status === 'pending' && isOverdue(f.repasse_due_date)
            return (
              <div
                key={f.id}
                className={cn(
                  'border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4',
                  overdue ? 'border-red-200 bg-red-50/40' : 'border-slate-100'
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{f.carrierName}</span>
                    {overdue && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        Vencido
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {fmtCep(f.origin_zip)} → {fmtCep(f.dest_zip)}
                    {f.client_name && <span className="ml-2">· Cliente: {f.client_name}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Pago: {fmtDate(f.created_at)}
                    </span>
                    {f.repasse_due_date && (
                      <span className={overdue ? 'text-red-600 font-medium' : ''}>
                        Prazo: {fmtDate(f.repasse_due_date)} ({f.payment_term_days}d)
                      </span>
                    )}
                    {f.repasse_paid_at && (
                      <span className="text-emerald-600">
                        Repassado: {fmtDate(f.repasse_paid_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right space-y-0.5">
                    <div>
                      <span className="text-xs text-muted-foreground">Recebido do cliente: </span>
                      <span className="font-medium text-slate-700">{fmt(f.price)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Margem RotaClick: </span>
                      <span className="font-medium text-orange-600">{fmt(f.rotaclick_amount)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">A repassar: </span>
                      <span className="text-lg font-black text-emerald-700">{fmt(f.carrier_amount)}</span>
                    </div>
                  </div>

                  {status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      onClick={() => handleMarkPaid(f.id)}
                      disabled={loading === f.id}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      {loading === f.id ? 'Salvando...' : 'Marcar pago'}
                    </Button>
                  )}
                  {status === 'paid' && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Repassado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
