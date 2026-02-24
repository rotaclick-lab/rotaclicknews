import { listAdminFreightRoutes, listAdminCarriersForSelect } from '@/app/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminFreightRoutesList } from './admin-freight-routes-list'
import { createAdminClient } from '@/lib/supabase/admin'
import { Route, CheckCircle2, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { page?: string; carrier?: string }
}

async function getRouteStats() {
  try {
    const admin = createAdminClient()
    const [activeRes, inactiveRes] = await Promise.all([
      admin.from('freight_routes').select('*', { count: 'exact', head: true }).or('is_active.is.null,is_active.eq.true'),
      admin.from('freight_routes').select('*', { count: 'exact', head: true }).eq('is_active', false),
    ])
    return { active: activeRes.count ?? 0, inactive: inactiveRes.count ?? 0 }
  } catch { return { active: 0, inactive: 0 } }
}

export default async function AdminTabelaFretePage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const carrierId = searchParams.carrier || undefined

  const [routesResult, carriers, routeStats] = await Promise.all([
    listAdminFreightRoutes({ carrierId, page, perPage: 50 }),
    listAdminCarriersForSelect().catch(() => [] as Array<{ id: string; label: string }>),
    getRouteStats(),
  ])

  const routes = routesResult.success && routesResult.data ? routesResult.data.routes : []
  const total = routesResult.success && routesResult.data ? routesResult.data.total : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tabelas de Frete</h1>
        <p className="text-muted-foreground">
          Rotas de frete por transportador. Ativar/desativar, editar e excluir.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100"><Route className="h-5 w-5 text-slate-600" /></div>
            <div>
              <p className="text-2xl font-black text-slate-800">{(routeStats.active + routeStats.inactive).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Total de rotas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-black text-green-700">{routeStats.active.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Rotas ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100"><XCircle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-2xl font-black text-slate-500">{routeStats.inactive.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Rotas inativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Rotas de frete</CardTitle>
          <CardDescription>
            {total} rota(s) {carrierId ? 'desta transportadora' : 'no total'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminFreightRoutesList
            routes={routes}
            total={total}
            currentPage={page}
            carriers={carriers}
            selectedCarrierId={carrierId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
