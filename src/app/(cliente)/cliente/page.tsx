import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Área do Cliente | RotaClick',
  description: 'Acompanhe cotações e pagamentos na sua área de cliente RotaClick',
}

export default function ClientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-black text-brand-800">Área do Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo(a)! Aqui você acompanha suas cotações e pagamentos na RotaClick.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nova cotação</CardTitle>
              <CardDescription>Solicite uma nova cotação de frete em poucos passos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/cotacao"
                className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Ir para cotação
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
              <CardDescription>Fale com o nosso time para dúvidas sobre pedidos e pagamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                Email: <a className="text-brand-600 hover:text-brand-700" href="mailto:sac@rotaclick.com.br">sac@rotaclick.com.br</a>
              </p>
              <Link href="/atendimento" className="text-brand-600 hover:text-brand-700 font-semibold">
                Página de atendimento
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
