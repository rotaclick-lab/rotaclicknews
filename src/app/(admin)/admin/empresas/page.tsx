import { listAdminCompanies } from '@/app/actions/admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminCompaniesList } from './admin-companies-list'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { page?: string; search?: string }
}

export default async function AdminEmpresasPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const result = await listAdminCompanies({
    page,
    perPage: 20,
    search: searchParams.search,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Empresas</h1>
        <p className="text-muted-foreground">Gestão de empresas (transportadoras)</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Lista de empresas</CardTitle>
          <CardDescription>
            {result.success && result.data ? `${result.data.total} empresa(s)` : result.error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.success && result.data ? (
            <AdminCompaniesList companies={result.data.companies} total={result.data.total} currentPage={page} />
          ) : (
            <p className="text-sm text-red-600">{result.error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
