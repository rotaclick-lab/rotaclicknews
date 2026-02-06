import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DriverForm } from '@/components/motoristas/driver-form'
import { getDriver } from '@/app/actions/driver-actions'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditarMotoristaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get driver
  const result = await getDriver(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const driver = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/motoristas/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Motorista</h1>
          <p className="text-muted-foreground">{driver.name}</p>
        </div>
      </div>

      {/* Form */}
      <DriverForm driver={driver} />
    </div>
  )
}
