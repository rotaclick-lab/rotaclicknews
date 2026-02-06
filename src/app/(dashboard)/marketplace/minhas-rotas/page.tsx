import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReturnFreightCard } from '@/components/marketplace/return-freight-card'
import { listReturnFreights } from '@/app/actions/return-freight-actions'
import { Plus } from 'lucide-react'

interface MinhasRotasPageProps {
  searchParams: { status?: string }
}

export default async function MinhasRotasPage({ searchParams }: MinhasRotasPageProps) {
  const status = searchParams.status || 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Rotas</h1>
          <p className="text-muted-foreground">Gerencie suas rotas publicadas</p>
        </div>
        <Button asChild>
          <Link href="/marketplace/minhas-rotas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Rota
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={status} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild><Link href="/marketplace/minhas-rotas?status=all">Todas</Link></TabsTrigger>
          <TabsTrigger value="available" asChild><Link href="/marketplace/minhas-rotas?status=available">Disponíveis</Link></TabsTrigger>
          <TabsTrigger value="in_negotiation" asChild><Link href="/marketplace/minhas-rotas?status=in_negotiation">Em Negociação</Link></TabsTrigger>
          <TabsTrigger value="accepted" asChild><Link href="/marketplace/minhas-rotas?status=accepted">Aceitas</Link></TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4">
          <Suspense fallback={<RotasLoadingSkeleton />}>
            <RotasList status={status} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function RotasList({ status }: { status: string }) {
  const result = await listReturnFreights({
    filters: { status: status !== 'all' ? status as any : undefined },
    per_page: 50,
  })

  if (!result.success) {
    return <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">{result.error}</p></CardContent></Card>
  }

  const { return_freights } = result.data

  if (return_freights.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma rota publicada ainda.</p>
            <Button asChild>
              <Link href="/marketplace/minhas-rotas/nova">
                <Plus className="mr-2 h-4 w-4" />
                Publicar Primeira Rota
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {return_freights.map((returnFreight) => (
        <ReturnFreightCard key={returnFreight.id} returnFreight={returnFreight} showActions={true} />
      ))}
    </div>
  )
}

function RotasLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
    </div>
  )
}
