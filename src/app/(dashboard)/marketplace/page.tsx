import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReturnFreightCard } from '@/components/marketplace/return-freight-card'
import { listReturnFreights } from '@/app/actions/return-freight-actions'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface MarketplacePageProps {
  searchParams: {
    page?: string
    status?: string
  }
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status || 'available'
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace de Retorno</h1>
          <p className="text-muted-foreground">
            Encontre oportunidades de fretes de retorno
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace/minhas-rotas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Publicar Rota
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades Disponíveis</CardTitle>
          <CardDescription>Fretes de retorno publicados por outras transportadoras</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ListLoadingSkeleton />}>
            <ReturnFreightsList page={page} status={status} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function ReturnFreightsList({ page, status }: { page: number; status: string }) {
  const result = await listReturnFreights({
    page,
    per_page: 12,
    filters: { status: status !== 'all' ? status as any : undefined },
  })

  if (!result.success) {
    return <div className="text-center py-12"><p className="text-muted-foreground">{result.error}</p></div>
  }

  const { return_freights = [], total = 0 } = result.data || {}

  if (return_freights.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma oportunidade encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {return_freights.map((returnFreight) => (
          <ReturnFreightCard key={returnFreight.id} returnFreight={returnFreight} showActions={true} />
        ))}
      </div>

      {total > 12 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" asChild disabled={page <= 1}>
            <Link href={`/marketplace?page=${page - 1}&status=${status}`}>Anterior</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {Math.ceil(total / 12)}</span>
          <Button variant="outline" asChild disabled={page >= Math.ceil(total / 12)}>
            <Link href={`/marketplace?page=${page + 1}&status=${status}`}>Próxima</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function ListLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
    </div>
  )
}
