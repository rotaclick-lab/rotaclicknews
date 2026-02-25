import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Truck, FileText, Upload, DollarSign, Route, ShieldCheck, Settings, Plug, TrendingUp, Megaphone, Clock, AlertCircle, Building2 } from 'lucide-react'
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

type RecentUser = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
}

type RecentFreight = {
  id: string
  origin_city: string | null
  destination_city: string | null
  price: number | null
  payment_status: string | null
  created_at: string
}

async function getAdminStats() {
  try {
    const admin = createAdminClient()

    const safeCount = async (query: Promise<{ count: number | null }>) => {
      try { const r = await query; return r.count ?? 0 } catch { return 0 }
    }

    const [usersCount, companiesApprovedCount, pendingCount, freightsCount, rntrcCount, routesCount, integrationsCount, campaignsCount, revenueResult, ingestionResult, recentUsersResult, recentFreightsResult] =
      await Promise.all([
        safeCount(admin.from('profiles').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('companies').select('*', { count: 'exact', head: true }).eq('approval_status', 'approved') as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('companies').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending') as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('freights').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid') as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('rntrc_cache').select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('freight_routes').select('*', { count: 'exact', head: true }).or('is_active.is.null,is_active.eq.true') as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('carrier_integrations').select('*', { count: 'exact', head: true }).eq('is_active', true) as unknown as Promise<{ count: number | null }>),
        safeCount(admin.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null }>),
        (async () => {
          try {
            const { data } = await admin.from('freights').select('price').eq('payment_status', 'paid')
            return { total: (data ?? []).reduce((s, r) => s + (Number(r.price) || 0), 0) }
          } catch { return { total: 0 } }
        })(),
        (async () => {
          try {
            return await admin.from('antt_ingestion_runs').select('created_at, status, records_imported, source_url, error_message').order('created_at', { ascending: false }).limit(3)
          } catch { return { data: [] as IngestionRun[] } }
        })(),
        (async () => {
          try {
            return await admin.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5)
          } catch { return { data: [] as RecentUser[] } }
        })(),
        (async () => {
          try {
            return await admin.from('freights').select('id, origin_city, destination_city, price, payment_status, created_at').order('created_at', { ascending: false }).limit(5)
          } catch { return { data: [] as RecentFreight[] } }
        })(),
      ])

    return {
      users: usersCount ?? 0,
      companies: companiesApprovedCount ?? 0,
      pendingApprovals: pendingCount ?? 0,
      freights: freightsCount ?? 0,
      rntrcCache: rntrcCount ?? 0,
      routes: routesCount ?? 0,
      integrations: integrationsCount ?? 0,
      activeCampaigns: campaignsCount ?? 0,
      totalRevenue: revenueResult.total,
      lastIngestions: (ingestionResult.data ?? []) as IngestionRun[],
      recentUsers: (recentUsersResult.data ?? []) as RecentUser[],
      recentFreights: (recentFreightsResult.data ?? []) as RecentFreight[],
    }
  } catch (e) {
    console.error('getAdminStats error:', e)
    return {
      users: 0, companies: 0, pendingApprovals: 0, freights: 0, rntrcCache: 0,
      routes: 0, integrations: 0, activeCampaigns: 0, totalRevenue: 0,
      lastIngestions: [] as IngestionRun[], recentUsers: [] as RecentUser[], recentFreights: [] as RecentFreight[],
    }
  }
}

const QUICK_LINKS = [
  { href: '/admin/usuarios', label: 'Usuários', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { href: '/admin/aprovacoes', label: 'Aprovações', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2, color: 'text-purple-600 bg-purple-50' },
  { href: '/admin/transportadoras', label: 'Transportadoras', icon: Truck, color: 'text-orange-600 bg-orange-50' },
  { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone, color: 'text-brand-600 bg-brand-50' },
  { href: '/admin/tabela-frete', label: 'Tabelas de Frete', icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { href: '/admin/integracoes', label: 'Integrações', icon: Plug, color: 'text-sky-600 bg-sky-50' },
  { href: '/admin/rntrc', label: 'RNTRC', icon: Upload, color: 'text-indigo-600 bg-indigo-50' },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ShieldCheck, color: 'text-red-600 bg-red-50' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, color: 'text-slate-600 bg-slate-50' },
]

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
          <p className="text-muted-foreground">Visão geral da plataforma RotaClick</p>
        </div>
        {stats.pendingApprovals > 0 && (
          <Link href="/admin/aprovacoes">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold">
                {stats.pendingApprovals} aprovação{stats.pendingApprovals > 1 ? 'ões' : ''} pendente{stats.pendingApprovals > 1 ? 's' : ''}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* KPI Receita em destaque */}
      <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50">
        <CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-100">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Receita Total (fretes pagos)</p>
            <p className="text-3xl font-black text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Usuários', value: stats.users, icon: Users, href: '/admin/usuarios', color: 'text-blue-600' },
          { label: 'Transportadoras', value: stats.companies, icon: Truck, href: '/admin/transportadoras', color: 'text-orange-600' },
          { label: 'Pend. Aprovação', value: stats.pendingApprovals, icon: AlertCircle, href: '/admin/aprovacoes', color: stats.pendingApprovals > 0 ? 'text-amber-600' : 'text-slate-400' },
          { label: 'Fretes Pagos', value: stats.freights, icon: FileText, href: '/admin/repasses', color: 'text-green-600' },
          { label: 'Campanhas Ativas', value: stats.activeCampaigns, icon: Megaphone, href: '/admin/campanhas', color: 'text-brand-600' },
          { label: 'Rotas Ativas', value: stats.routes, icon: Route, href: '/admin/tabela-frete', color: 'text-purple-600' },
          { label: 'Integrações', value: stats.integrations, icon: Plug, href: '/admin/integracoes', color: 'text-sky-600' },
          { label: 'RNTRC Cache', value: stats.rntrcCache, icon: Upload, href: '/admin/rntrc', color: 'text-indigo-600' },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
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

      {/* Atividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Últimos cadastros</CardTitle>
              <CardDescription>Usuários recentemente registrados</CardDescription>
            </div>
            <Link href="/admin/usuarios"><Button variant="outline" size="sm">Ver todos</Button></Link>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário ainda.</p>
            ) : (
              <div className="space-y-1">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant="outline" className="text-xs capitalize">{u.role || 'user'}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Últimos fretes</CardTitle>
              <CardDescription>Fretes criados recentemente na plataforma</CardDescription>
            </div>
            <Link href="/admin/repasses"><Button variant="outline" size="sm">Ver todos</Button></Link>
          </CardHeader>
          <CardContent>
            {stats.recentFreights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum frete ainda.</p>
            ) : (
              <div className="space-y-1">
                {stats.recentFreights.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.origin_city || '—'} → {f.destination_city || '—'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{new Date(f.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-sm font-semibold text-green-700">
                        {f.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.price) : '—'}
                      </span>
                      <Badge variant="outline" className={`text-xs ${
                        f.payment_status === 'paid' ? 'border-green-300 text-green-700 bg-green-50'
                        : f.payment_status === 'pending' ? 'border-amber-300 text-amber-700 bg-amber-50'
                        : 'border-slate-200 text-slate-500'
                      }`}>
                        {f.payment_status === 'paid' ? 'Pago' : f.payment_status === 'pending' ? 'Pendente' : f.payment_status || '—'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas ingestões RNTRC */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Últimas ingestões RNTRC</CardTitle>
            <CardDescription>Histórico de uploads e sincronizações</CardDescription>
          </div>
          <Link href="/admin/rntrc"><Button variant="outline" size="sm">Ver tudo</Button></Link>
        </CardHeader>
        <CardContent>
          {stats.lastIngestions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Upload className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">Nenhuma ingestão registrada ainda.</p>
              <Link href="/admin/rntrc"><Button size="sm">Fazer upload agora</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.lastIngestions.map((run) => (
                <div key={run.created_at} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-medium text-sm">{new Date(run.created_at).toLocaleString('pt-BR')}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{run.records_imported?.toLocaleString('pt-BR') ?? 0} registros</span>
                    {run.error_message && <p className="text-xs text-red-600 mt-0.5">{run.error_message}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    run.status === 'SUCCESS' ? 'bg-green-100 text-green-800'
                    : run.status === 'FAILED' ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>{run.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
