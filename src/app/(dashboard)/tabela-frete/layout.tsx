import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, XCircle, AlertTriangle } from 'lucide-react'

export default async function TabelaFreteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/tabela-frete')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'transportadora') redirect('/dashboard')

  if (!profile.company_id) {
    return <ApprovalBlock status="pending" reason={null} />
  }

  const { data: company } = await supabase
    .from('companies')
    .select('approval_status, rejection_reason')
    .eq('id', profile.company_id)
    .single()

  if (!company || company.approval_status === 'pending') {
    return <ApprovalBlock status="pending" reason={null} />
  }

  if (company.approval_status === 'rejected') {
    return <ApprovalBlock status="rejected" reason={company.rejection_reason} />
  }

  return <>{children}</>
}

function ApprovalBlock({ status, reason }: { status: 'pending' | 'rejected'; reason: string | null }) {
  const isPending = status === 'pending'
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className={`border-2 max-w-lg w-full ${isPending ? 'border-yellow-300' : 'border-red-300'}`}>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isPending ? 'bg-yellow-100' : 'bg-red-100'}`}>
            {isPending
              ? <Clock className="h-8 w-8 text-yellow-600" />
              : <XCircle className="h-8 w-8 text-red-600" />
            }
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isPending ? 'text-yellow-800' : 'text-red-800'}`}>
              {isPending ? 'Cadastro em análise' : 'Cadastro não aprovado'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {isPending
                ? 'Sua RNTRC e apólice de seguro estão sendo verificadas pela equipe RotaClick. Você será notificado por email assim que o processo for concluído.'
                : 'Seu cadastro não foi aprovado pela RotaClick.'}
            </p>
            {!isPending && reason && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-left">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div><span className="font-semibold">Motivo: </span>{reason}</div>
                </div>
              </div>
            )}
            {!isPending && (
              <p className="text-xs text-muted-foreground mt-3">
                Para mais informações, entre em contato: <a href="mailto:suporte@rotaclick.com.br" className="text-brand-600 underline">suporte@rotaclick.com.br</a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
