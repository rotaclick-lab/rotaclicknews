import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FreightForm } from '@/components/fretes/freight-form'
import { getFreight } from '@/app/actions/freight-actions'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditarFretePage({ params }: PageProps) {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's company
  const { data: userData } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    redirect('/dashboard')
  }

  // Fetch freight
  const freightResult = await getFreight(params.id)

  if (!freightResult.success || !freightResult.data) {
    notFound()
  }

  const freight = freightResult.data

  // Check if freight belongs to user's company
  if (freight.company_id !== userData.company_id) {
    notFound()
  }

  // Fetch customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('company_id', userData.company_id)
    .eq('is_active', true)
    .order('name')

  // Fetch drivers
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('company_id', userData.company_id)
    .eq('is_active', true)
    .order('name')

  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, license_plate, model')
    .eq('company_id', userData.company_id)
    .eq('status', 'active')
    .order('license_plate')

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
          customers={customers || []}
          drivers={drivers || []}
          vehicles={
            vehicles?.map((v) => ({
              id: v.id,
              plate: v.license_plate,
              model: v.model,
            })) || []
          }
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
