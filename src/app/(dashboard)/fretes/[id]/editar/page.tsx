import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FreightForm } from '@/components/fretes/freight-form'
import { getFreight } from '@/app/actions/freight-actions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditarFretePage({ params }: PageProps) {
  // Fetch freight
  const freightResult = await getFreight(params.id)

  if (!freightResult.success || !freightResult.data) {
    notFound()
  }

  const freight = freightResult.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Frete</h1>
        <p className="text-muted-foreground">
          Código: {freight.code || 'N/A'}
        </p>
      </div>

      {/* Form */}
      <Suspense fallback={<FormSkeleton />}>
        <FreightForm
          freight={freight}
          customers={[]}
          drivers={[]}
          vehicles={[]}
        />
      </Suspense>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
