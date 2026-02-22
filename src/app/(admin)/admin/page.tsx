import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Truck, FileText, Upload, DollarSign, Route, ShieldCheck, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type IngestionRun = {
  created_at: string
  status: string
  records_imported: number
  source_url?: string | null
  error_message?: string | null
}

async function getAdminStats() {
  try {
    const admin = createAdminClient()

    const safeCount = async (query: Promise<{ count: number | null }>) => {
      try { const r = await query; return r.count ?? 0 } catch { return 0 }
    }

    const [usersCount, companiesCount, carriersCount, freightsCount, rntrcCount, routesCount, ingestionResult] =
      await Promise.all([
        safeCount(admin.from('profiles').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('companies').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('carriers').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('freights').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('rntrc_cache').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('freight_routes').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        (async () => {
          try {
            return await admin
              .from('antt_ingestion_runs')
              .select('created_at, status, records_imported, source_url, error_message')
              .order('created_at', { ascending: false })
              .limit(5)
          } catch { return { data: [] as IngestionRun[] } }
        })(),
      ])

    return {
      users: usersCount ?? 0,
      companies: companiesCount ?? 0,
      carriers: carriersCount ?? 0,
      freights: freightsCount ?? 0,
      rntrcCache: rntrcCount ?? 0,
      routes: routesCount ?? 0,
      lastIngestions: (ingestionResult.data ?? []) as IngestionRun[],
    }
  } catch (e) {
    console.error('getAdminStats error:', e)
    return {
      users: 0,
      companies: 0,
      carriers: 0,
      freights: 0,
      rntrcCache: 0,
      routes: 0,
      lastIngestions: [] as IngestionRun[],
    }
  }
}

const QUICK_LINKS = [
  { href: '/admin/usuarios', label: 'Usuários', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2, color: 'text-purple-600 bg-purple-50' },
  { href: '/admin/transportadoras', label: 'Transportadoras', icon: Truck, color: 'text-orange-600 bg-orange-50' },
  { href: '/admin/tabela-frete', label: 'Tabelas de Frete', icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { href: '/admin/rntrc', label: 'RNTRC', icon: Upload, color: 'text-indigo-600 bg-indigo-50' },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ShieldCheck, color: 'text-red-600 bg-red-50' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, color: 'text-slate-600 bg-slate-50' },
]

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
        <p className="text-muted-foreground">Visão geral da plataforma RotaClick</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Usuários', value: stats.users, icon: Users, href: '/admin/usuarios' },
          { label: 'Empresas', value: stats.companies, icon: Building2, href: '/admin/empresas' },
          { label: 'Transportadoras', value: stats.carriers, icon: Truck, href: '/admin/transportadoras' },
          { label: 'Fretes', value: stats.freights, icon: FileText, href: '/admin/tabela-frete' },
          { label: 'Rotas de Frete', value: stats.routes, icon: Route, href: '/admin/tabela-frete' },
          { label: 'RNTRC Cache', value: stats.rntrcCache, icon: Upload, href: '/admin/rntrc' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value.toLocaleString('pt-BR')}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Acesso rápido</CardTitle>
          <CardDescription>Navegue para as seções do painel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-center"
              >
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Últimas ingestões RNTRC */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimas ingestões RNTRC</CardTitle>
            <CardDescription>Histórico de uploads e sincronizações</CardDescription>
          </div>
          <Link href="/admin/rntrc">
            <Button variant="outline" size="sm">
              Ver tudo
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.lastIngestions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Upload className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">Nenhuma ingestão registrada ainda.</p>
              <Link href="/admin/rntrc">
                <Button size="sm">Fazer upload agora</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.lastIngestions.map((run) => (
                <div
                  key={run.created_at}
                  className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {new Date(run.created_at).toLocaleString('pt-BR')}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {run.records_imported?.toLocaleString('pt-BR') ?? 0} registros
                    </span>
                    {run.source_url && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{run.source_url}</p>
                    )}
                    {run.error_message && (
                      <p className="text-xs text-red-600 mt-0.5">{run.error_message}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      run.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : run.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
