import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FreightList } from '@/components/fretes/freight-list'
import { listFreights } from '@/app/actions/freight-actions'

interface PageProps {
  searchParams: {
    page?: string
    status?: string
    search?: string
  }
}

export default async function FretesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status as any
  const search = searchParams.search

  const result = await listFreights({
    page,
    per_page: 10,
    ...(status && { status }),
    ...(search && { search }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fretes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os fretes da sua transportadora
          </p>
        </div>
        <Link href="/fretes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Frete
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fretes</CardTitle>
          <CardDescription>
            {result.success && result.data
              ? `${result.data.total} frete(s) encontrado(s)`
              : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FreightListSkeleton />}>
            {result.success && result.data ? (
              <FreightList
                freights={result.data.freights}
                total={result.data.total}
                currentPage={page}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {result.error || 'Erro ao carregar fretes'}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function FreightListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
