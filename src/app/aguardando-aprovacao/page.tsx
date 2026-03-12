import { Clock, Mail, Phone, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AguardandoAprovacaoPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-amber-100">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Cadastro em análise</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Seu cadastro foi recebido com sucesso! Nossa equipe está verificando seus documentos (RNTRC e apólice de seguro).
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
          <p className="text-sm font-semibold text-amber-800">O que acontece agora?</p>
          <ul className="space-y-2">
            {[
              'Verificamos seu número RNTRC no sistema ANTT',
              'Analisamos sua apólice de seguro de carga',
              'Você recebe um email com o resultado em até 48h',
              'Após aprovação, sua tabela de frete será cadastrada',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-slate-700">Dúvidas? Entre em contato:</p>
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
