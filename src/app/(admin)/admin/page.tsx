import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Truck, FileText, Upload, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function getAdminStats() {
  try {
    const admin = createAdminClient()

    const [
      { count: usersCount },
      { count: companiesCount },
      { count: carriersCount },
      { count: freightsCount },
      { count: rntrcCount },
      { data: lastIngestion },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      admin.from('companies').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      admin.from('carriers').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      admin.from('freights').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      admin.from('rntrc_cache').select('*', { count: 'exact', head: true }).catch(() => ({ count: 0 })),
      admin
        .from('antt_ingestion_runs')
        .select('created_at, status, records_imported')
        .order('created_at', { ascending: false })
        .limit(5)
        .catch(() => ({ data: [] })),
    ])

    return {
      users: usersCount ?? 0,
      companies: companiesCount ?? 0,
      carriers: carriersCount ?? 0,
      freights: freightsCount ?? 0,
      rntrcCache: rntrcCount ?? 0,
      lastIngestions: lastIngestion?.data ?? [],
    }
  } catch (e) {
    console.error('getAdminStats error:', e)
    return {
      users: 0,
      companies: 0,
      carriers: 0,
      freights: 0,
      rntrcCache: 0,
      lastIngestions: [],
    }
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Admin</h1>
        <p className="text-muted-foreground">Visão geral da plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.users}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.companies}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.carriers}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.freights}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Upload className="h-4 w-4" />
              RNTRC Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.rntrcCache}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/rntrc">
              <Button size="sm" variant="outline">
                Upload RNTRC
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Últimas ingestões RNTRC */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Últimas ingestões RNTRC</CardTitle>
          <CardDescription>Histórico de uploads e sincronizações</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.lastIngestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ingestão registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {stats.lastIngestions.map((run: { created_at: string; status: string; records_imported: number }) => (
                <div
                  key={run.created_at}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <span className="font-medium">
                      {new Date(run.created_at).toLocaleString('pt-BR')}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {run.records_imported} registros
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
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
          <Link href="/admin/rntrc" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Ver histórico completo
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
