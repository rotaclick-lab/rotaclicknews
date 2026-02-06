import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerList } from '@/components/clientes/customer-list'
import { listCustomers } from '@/app/actions/customer-actions'

interface PageProps {
  searchParams: {
    page?: string
    status?: string
    customer_type?: string
    search?: string
  }
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status as any
  const customer_type = searchParams.customer_type as any
  const search = searchParams.search

  const result = await listCustomers({
    page,
    per_page: 10,
    ...(status && { status }),
    ...(customer_type && { customer_type }),
    ...(search && { search }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua transportadora
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {result.success && result.data
              ? `${result.data.total} cliente(s) encontrado(s)`
              : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<CustomerListSkeleton />}>
            {result.success && result.data ? (
              <CustomerList
                customers={result.data.customers}
                total={result.data.total}
                currentPage={page}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {result.error || 'Erro ao carregar clientes'}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomerListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
