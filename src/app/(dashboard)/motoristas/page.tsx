import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DriverList } from '@/components/motoristas/driver-list'
import { listDrivers } from '@/app/actions/driver-actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    license_category?: string
    search?: string
  }>
}

export default async function MotoristasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = params.status as any
  const license_category = params.license_category as any
  const search = params.search

  const result = await listDrivers({
    page,
    per_page: 10,
    ...(status && { status }),
    ...(license_category && { license_category }),
    ...(search && { search }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motoristas</h1>
          <p className="text-muted-foreground">
            Gerencie os motoristas da sua transportadora
          </p>
        </div>
        <Link href="/motoristas/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Motorista
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
          <CardDescription>
            {result.success && result.data
              ? `${result.data.total} motorista(s) encontrado(s)`
              : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DriverListSkeleton />}>
            {result.success && result.data ? (
              <DriverList
                drivers={result.data.drivers}
                total={result.data.total}
                currentPage={page}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {result.error || 'Erro ao carregar motoristas'}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function DriverListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
