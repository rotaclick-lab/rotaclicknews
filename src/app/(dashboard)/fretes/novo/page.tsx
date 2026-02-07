import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FreightForm } from '@/components/fretes/freight-form'

export default async function NovoFretePage() {
  const supabase = await createClient()

  // Get current user
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

  if (!userData) {
    redirect('/dashboard')
  }

  // Fetch customers, drivers, and vehicles
  const [customersResult, driversResult, vehiclesResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name')
      .eq('company_id', userData.company_id)
      .order('name'),
    supabase
      .from('drivers')
      .select('id, name')
      .eq('company_id', userData.company_id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('vehicles')
      .select('id, plate, model')
      .eq('company_id', userData.company_id)
      .eq('status', 'active')
      .order('plate'),
  ])

  const customers = customersResult.data || []
  const drivers = driversResult.data || []
  const vehicles = vehiclesResult.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/fretes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Frete</h1>
          <p className="text-muted-foreground">
            Preencha as informações para criar um novo frete
          </p>
        </div>
      </div>

      {/* Form */}
      {customers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Você precisa cadastrar pelo menos um cliente antes de criar um frete.
          </p>
          <Link href="/clientes/novo">
            <Button>Cadastrar Cliente</Button>
          </Link>
        </div>
      ) : (
        <FreightForm customers={customers} drivers={drivers} vehicles={vehicles} />
      )}
    </div>
  )
}
