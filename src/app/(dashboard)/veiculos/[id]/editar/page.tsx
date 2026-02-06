import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VehicleForm } from '@/components/veiculos/vehicle-form'
import { getVehicle } from '@/app/actions/vehicle-actions'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarVeiculoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getVehicle(id)
  if (!result.success || !result.data) notFound()
  const vehicle = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/veiculos/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Veículo</h1>
          <p className="text-muted-foreground font-mono">{vehicle.plate}</p>
        </div>
      </div>
      <VehicleForm vehicle={vehicle} />
    </div>
  )
}
