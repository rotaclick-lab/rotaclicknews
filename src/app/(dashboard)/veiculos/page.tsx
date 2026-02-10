import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VehicleList } from '@/components/veiculos/vehicle-list'
import { listVehicles } from '@/app/actions/vehicle-actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    type?: string
    search?: string
  }>
}

export default async function VeiculosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = params.status as any
  const type = params.type as any
  const search = params.search

  const result = await listVehicles({
    page,
    per_page: 10,
    ...(status && { status }),
    ...(type && { type }),
    ...(search && { search }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground">
            Gerencie a frota de veículos da sua transportadora
          </p>
        </div>
        <Link href="/veiculos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Veículo
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <CardDescription>
            {result.success && result.data
              ? `${result.data.total} veículo(s) encontrado(s)`
              : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<VehicleListSkeleton />}>
            {result.success && result.data ? (
              <VehicleList
                vehicles={result.data.vehicles}
                total={result.data.total}
                currentPage={page}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {result.error || 'Erro ao carregar veículos'}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function VehicleListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
