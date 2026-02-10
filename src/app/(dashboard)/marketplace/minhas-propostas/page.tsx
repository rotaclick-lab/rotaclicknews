import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProposalCard } from '@/components/marketplace/proposal-card'
import { listMyProposals } from '@/app/actions/proposal-actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface MinhasPropostasPageProps {
  searchParams: { status?: string }
}

export default async function MinhasPropostasPage({ searchParams }: MinhasPropostasPageProps) {
  const status = searchParams.status || 'all'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Propostas</h1>
        <p className="text-muted-foreground">Acompanhe suas propostas enviadas</p>
      </div>

      <Tabs defaultValue={status} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild><Link href="/marketplace/minhas-propostas?status=all">Todas</Link></TabsTrigger>
          <TabsTrigger value="pending" asChild><Link href="/marketplace/minhas-propostas?status=pending">Pendentes</Link></TabsTrigger>
          <TabsTrigger value="accepted" asChild><Link href="/marketplace/minhas-propostas?status=accepted">Aceitas</Link></TabsTrigger>
          <TabsTrigger value="rejected" asChild><Link href="/marketplace/minhas-propostas?status=rejected">Recusadas</Link></TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="space-y-4">
          <Suspense fallback={<PropostasLoadingSkeleton />}>
            <PropostasList status={status} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function PropostasList({ status }: { status: string }) {
  const result = await listMyProposals({
    filters: { status: status !== 'all' ? status as any : undefined },
    per_page: 50,
  })

  if (!result.success) {
    return <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">{result.error}</p></CardContent></Card>
  }

  const { proposals } = result.data

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma proposta encontrada.</p>
            <p className="text-sm text-muted-foreground">Explore o marketplace para encontrar oportunidades.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} showActions={false} isOwner={false} />
      ))}
    </div>
  )
}

function PropostasLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
    </div>
  )
}
