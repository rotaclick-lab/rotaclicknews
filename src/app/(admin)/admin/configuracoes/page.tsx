import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Info, Shield, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
}

async function getPlatformStats() {
  try {
    const admin = createAdminClient()
    const [usersRes, carriersRes, routesRes] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('carriers').select('*', { count: 'exact', head: true }),
      admin.from('freight_routes').select('*', { count: 'exact', head: true }),
    ])
    return {
      users: usersRes.count ?? 0,
      carriers: carriersRes.count ?? 0,
      routes: routesRes.count ?? 0,
    }
  } catch {
    return { users: 0, carriers: 0, routes: 0 }
  }
}

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
  { key: 'NEXT_PUBLIC_APP_URL', label: 'App URL' },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', secret: true },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key' },
  { key: 'GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key', secret: true },
]

export default async function AdminConfiguracoesPage() {
  await requireAdmin()
  const stats = await getPlatformStats()

  const envStatus = ENV_VARS.map((v) => ({
    ...v,
    configured: !!process.env[v.key],
    value: v.secret ? undefined : process.env[v.key]?.slice(0, 30) + (process.env[v.key] && process.env[v.key]!.length > 30 ? '…' : ''),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-muted-foreground">Parâmetros e status da plataforma RotaClick</p>
      </div>

      {/* Status da plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Usuários cadastrados', value: stats.users.toLocaleString('pt-BR') },
          { label: 'Transportadoras ativas', value: stats.carriers.toLocaleString('pt-BR') },
          { label: 'Rotas de frete', value: stats.routes.toLocaleString('pt-BR') },
        ].map(({ label, value }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status das variáveis de ambiente */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Variáveis de ambiente
          </CardTitle>
          <CardDescription>Status das integrações configuradas no servidor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {envStatus.map((env) => (
              <div key={env.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{env.label}</p>
                  <p className="text-xs font-mono text-muted-foreground">{env.key}</p>
                  {env.value && (
                    <p className="text-xs text-muted-foreground mt-0.5">{env.value}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    env.configured
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {env.configured ? 'Configurado' : 'Ausente'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links úteis */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Links úteis
          </CardTitle>
          <CardDescription>Painéis externos das integrações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Supabase Dashboard', href: 'https://supabase.com/dashboard' },
              { label: 'Stripe Dashboard', href: 'https://dashboard.stripe.com' },
              { label: 'Vercel Dashboard', href: 'https://vercel.com/dashboard' },
              { label: 'Portal ANTT RNTRC', href: 'https://dados.antt.gov.br/pt_PT/dataset?organization=agencia-nacional-de-transportes-terrestres-antt&tags=rntrc' },
              { label: 'ViaCEP', href: 'https://viacep.com.br' },
              { label: 'GitHub do projeto', href: 'https://github.com/rotaclick-lab/rotaclicknews' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                {label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info do sistema */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações do sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Versão', value: '1.0.0' },
              { label: 'Framework', value: 'Next.js 16' },
              { label: 'Banco de dados', value: 'Supabase (PostgreSQL)' },
              { label: 'Pagamentos', value: 'Stripe Connect' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
