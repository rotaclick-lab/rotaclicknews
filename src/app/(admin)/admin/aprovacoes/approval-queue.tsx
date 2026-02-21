'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveCarrier, rejectCarrier } from '@/app/actions/admin-actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, FileText, ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Carrier {
  id: string
  razao_social: string | null
  nome_fantasia: string | null
  name: string | null
  cnpj: string | null
  rntrc: string | null
  rntrc_number: string | null
  insurance_file_url: string | null
  approval_status: string
  rejection_reason: string | null
  created_at: string
  email: string | null
}

interface ApprovalQueueProps {
  carriers: Carrier[]
  status: string
}

export function ApprovalQueue({ carriers, status }: ApprovalQueueProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveModal, setApproveModal] = useState<{ id: string; name: string } | null>(null)
  const [paymentTerm, setPaymentTerm] = useState<7 | 21 | 28>(7)

  const handleApprove = async () => {
    if (!approveModal) return
    setLoading(approveModal.id)
    const result = await approveCarrier(approveModal.id, paymentTerm)
    if (result.success) {
      toast.success(`Transportadora aprovada! Prazo de repasse: ${paymentTerm} dias.`)
      setApproveModal(null)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao aprovar')
    }
    setLoading(null)
  }

  const handleReject = async () => {
    if (!rejectModal) return
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição')
      return
    }
    setLoading(rejectModal.id)
    const result = await rejectCarrier(rejectModal.id, rejectReason.trim())
    if (result.success) {
      toast.success('Cadastro rejeitado.')
      setRejectModal(null)
      setRejectReason('')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao rejeitar')
    }
    setLoading(null)
  }

  if (carriers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Clock className="h-10 w-10 text-slate-200" />
        <p className="text-muted-foreground text-sm">
          {status === 'pending' ? 'Nenhuma transportadora aguardando análise.' : status === 'approved' ? 'Nenhuma transportadora aprovada ainda.' : 'Nenhuma transportadora rejeitada.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {carriers.map((c) => {
          const displayName = c.nome_fantasia || c.razao_social || c.name || '—'
          const rntrc = c.rntrc_number || c.rntrc || '—'
          const isLoading = loading === c.id

          return (
            <div key={c.id} className={cn(
              'border rounded-xl p-5 space-y-4',
              status === 'pending' ? 'border-yellow-200 bg-yellow-50/40' :
              status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' :
              'border-red-200 bg-red-50/30'
            )}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-lg">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                  <p className="text-xs text-muted-foreground">
                    CNPJ: <span className="font-mono font-medium text-slate-700">{c.cnpj ?? '—'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastro: {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  {/* RNTRC */}
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                    rntrc !== '—' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                  )}>
                    {rntrc !== '—' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    RNTRC: <span className="font-mono">{rntrc}</span>
                  </div>

                  {/* Apólice */}
                  {c.insurance_file_url ? (
                    <a
                      href={c.insurance_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-brand-100 text-brand-800 hover:bg-brand-200 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Ver apólice de seguro
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Apólice não enviada
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo de rejeição */}
              {status === 'rejected' && c.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  <span className="font-semibold">Motivo: </span>{c.rejection_reason}
                </div>
              )}

              {/* Ações */}
              {status === 'pending' && (
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={() => { setApproveModal({ id: c.id, name: displayName }); setPaymentTerm(7) }}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    {isLoading ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                  <Button
                    onClick={() => setRejectModal({ id: c.id, name: displayName })}
                    disabled={isLoading}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de aprovação */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Aprovar transportadora</h3>
            <p className="text-sm text-muted-foreground">
              Defina o prazo de repasse para <strong>{approveModal.name}</strong>. Após o cliente pagar, a RotaClick repassa em:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([7, 21, 28] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setPaymentTerm(days)}
                  className={`border-2 rounded-xl py-3 text-center font-bold transition-all ${
                    paymentTerm === days
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl">{days}</div>
                  <div className="text-xs font-normal">dias</div>
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
              O transportador receberá o repasse {paymentTerm} dias após cada frete pago pelo cliente.
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setApproveModal(null)} disabled={loading === approveModal.id}>
                Cancelar
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove} disabled={loading === approveModal.id}>
                {loading === approveModal.id ? 'Aprovando...' : `Aprovar (${paymentTerm}d)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejeição */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Rejeitar cadastro</h3>
            <p className="text-sm text-muted-foreground">
              Informe o motivo da rejeição de <strong>{rejectModal.name}</strong>. O transportador será notificado.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={4}
              placeholder="Ex: RNTRC vencida, apólice de seguro inválida, documentação incompleta..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                disabled={loading === rejectModal.id}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={loading === rejectModal.id}
              >
                {loading === rejectModal.id ? 'Rejeitando...' : 'Confirmar rejeição'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
