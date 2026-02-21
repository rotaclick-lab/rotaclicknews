import { listAdminCarriers } from '@/app/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminCarriersList } from './admin-carriers-list'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { page?: string; search?: string }
}

export default async function AdminTransportadorasPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const result = await listAdminCarriers({
    page,
    perPage: 20,
    search: searchParams.search,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transportadoras</h1>
        <p className="text-muted-foreground">Carriers e rotas de frete</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Lista de transportadoras</CardTitle>
          <CardDescription>
            {result.success && result.data ? `${result.data.total} transportadora(s)` : result.error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.success && result.data ? (
            <AdminCarriersList carriers={result.data.carriers} total={result.data.total} currentPage={page} />
          ) : (
            <p className="text-sm text-red-600">{result.error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
