import { listPendingCarriers } from '@/app/actions/admin-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ApprovalQueue } from './approval-queue'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status ?? 'pending'

  const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
    listPendingCarriers({ status: 'pending' }),
    listPendingCarriers({ status: 'approved' }),
    listPendingCarriers({ status: 'rejected' }),
  ])

  const pending = pendingResult.success ? pendingResult.data : []
  const approved = approvedResult.success ? approvedResult.data : []
  const rejected = rejectedResult.success ? rejectedResult.data : []

  const current = status === 'approved' ? approved : status === 'rejected' ? rejected : pending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aprovação de Transportadoras</h1>
        <p className="text-muted-foreground">Analise RNTRC e apólice de seguro antes de ativar cada transportadora.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <a href="/admin/aprovacoes?status=pending">
          <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${status === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-black text-yellow-700">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="/admin/aprovacoes?status=approved">
          <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${status === 'approved' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-black text-emerald-700">{approved.length}</p>
                <p className="text-xs text-muted-foreground">Aprovadas</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="/admin/aprovacoes?status=rejected">
          <Card className={`border-2 cursor-pointer hover:shadow-md transition-shadow ${status === 'rejected' ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-black text-red-700">{rejected.length}</p>
                <p className="text-xs text-muted-foreground">Rejeitadas</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>
            {status === 'pending' ? 'Aguardando análise' : status === 'approved' ? 'Transportadoras aprovadas' : 'Transportadoras rejeitadas'}
          </CardTitle>
          <CardDescription>
            {status === 'pending'
              ? 'Verifique RNTRC e apólice de seguro antes de aprovar.'
              : status === 'approved'
              ? 'Cadastros aprovados e ativos na plataforma.'
              : 'Cadastros que não foram aprovados.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalQueue carriers={current} status={status} />
        </CardContent>
      </Card>
    </div>
  )
}
