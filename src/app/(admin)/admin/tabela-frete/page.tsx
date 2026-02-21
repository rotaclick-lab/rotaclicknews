import { listAdminFreightRoutes, listAdminCarriersForSelect } from '@/app/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminFreightRoutesList } from './admin-freight-routes-list'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { page?: string; carrier?: string }
}

export default async function AdminTabelaFretePage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const carrierId = searchParams.carrier || undefined

  let routesResult = await listAdminFreightRoutes({ carrierId, page, perPage: 50 })
  let carriers: Array<{ id: string; label: string }> = []
  try {
    carriers = await listAdminCarriersForSelect()
  } catch {
    carriers = []
  }
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
