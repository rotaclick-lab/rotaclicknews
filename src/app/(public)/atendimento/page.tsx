import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Mail, Shield } from 'lucide-react'

export const metadata = {
  title: 'Atendimento ao Cliente | RotaClick',
  description: 'Canais oficiais de atendimento da RotaClick',
}

export default function AtendimentoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-brand-700">Atendimento ao Cliente</CardTitle>
            <CardDescription>Suporte oficial da plataforma RotaClick</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-slate-700">
            <p>
              Precisa de ajuda com cotações, pagamentos, cadastro de transportadora ou acesso à conta?
              Nossa equipe está pronta para atender você.
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">Canais de atendimento</h2>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-brand-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Atendimento geral</p>
                    <a href="mailto:sac@rotaclick.com.br" className="text-brand-600 hover:text-brand-700">
                      sac@rotaclick.com.br
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-brand-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Privacidade e LGPD</p>
                    <a href="mailto:privacidade@rotaclick.com.br" className="text-brand-600 hover:text-brand-700">
                      privacidade@rotaclick.com.br
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Documentos legais</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <Link href="/termos" className="text-brand-600 hover:text-brand-700">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-brand-600 hover:text-brand-700">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
