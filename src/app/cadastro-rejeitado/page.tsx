import { XCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function CadastroRejeitadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let rejectionReason: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('rejection_reason')
        .eq('id', profile.company_id)
        .single()
      rejectionReason = company?.rejection_reason ?? null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Cadastro não aprovado</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Infelizmente seu cadastro não foi aprovado pela nossa equipe de análise.
          </p>
        </div>

        {rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-red-800 mb-1">Motivo:</p>
            <p className="text-sm text-red-700">{rejectionReason}</p>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-slate-700">Próximos passos:</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com nosso suporte para entender o motivo e verificar se é possível corrigir as pendências e reenviar seu cadastro.
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-slate-700">Fale com o suporte:</p>
          <p className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:suporte@rotaclick.com.br" className="text-brand-600 hover:underline">
              suporte@rotaclick.com.br
            </a>
          </p>
          <p className="flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
            <a href="tel:+551135142933" className="text-brand-600 hover:underline">
              (11) 3514-2933
            </a>
          </p>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full">Voltar ao login</Button>
        </Link>
      </div>
    </div>
  )
}
