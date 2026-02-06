import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, Users, Car } from 'lucide-react'

async function getDashboardStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) return null

  const companyId = userData.company_id

  // Count freights
  const { count: freightsCount } = await supabase
    .from('freights')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Count customers
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  // Count vehicles
  const { count: vehiclesCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  return {
    totalFreights: freightsCount || 0,
    totalCustomers: customersCount || 0,
    totalVehicles: vehiclesCount || 0,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  if (!stats) {
    return <div>Erro ao carregar dashboard</div>
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bem-vindo ao RotaClick! 🚛</h2>
        <p className="text-muted-foreground">
          Gerencie seus fretes de forma simples e eficiente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fretes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFreights}</div>
            <p className="text-xs text-muted-foreground">
              Fretes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Veículos na frota
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Cadastre seus primeiros fretes na seção <strong>Fretes</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            • Adicione clientes na seção <strong>Clientes</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            • Configure seus veículos na seção <strong>Veículos</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
