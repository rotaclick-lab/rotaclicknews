import { notFound } from 'next/navigation'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VehicleStatusBadge } from '@/components/veiculos/vehicle-status-badge'
import { VehicleTypeBadge } from '@/components/veiculos/vehicle-type-badge'
import { VehicleDocumentAlert } from '@/components/veiculos/vehicle-document-alert'
import { getVehicle } from '@/app/actions/vehicle-actions'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getVehicle(id)
  if (!result.success || !result.data) notFound()
  const vehicle = result.data

  const { data: recentFreights } = await supabase
    .from('freights')
    .select('id, freight_number, status, total_value, created_at, origin_city, origin_state, destination_city, destination_state')
    .eq('vehicle_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/veiculos">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">{vehicle.plate}</h1>
            <p className="text-muted-foreground">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/veiculos/${vehicle.id}/editar`}>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Editar</Button>
          </Link>
        </div>
      </div>

      <VehicleDocumentAlert
        crlvExpiryDate={vehicle.crlv_expiry_date}
        ipvaExpiryDate={vehicle.ipva_expiry_date}
        insuranceExpiryDate={vehicle.insurance_expiry_date}
        vehiclePlate={vehicle.plate}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações Gerais</CardTitle>
            <div className="flex gap-2">
              <VehicleTypeBadge type={vehicle.type} />
              <VehicleStatusBadge status={vehicle.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Fretes</p>
              <p className="text-lg font-semibold">{vehicle.freights_count || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fretes Ativos</p>
              <p className="text-lg font-semibold">{vehicle.active_freights || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Último Frete</p>
              <p className="text-lg font-semibold">{vehicle.last_freight_date ? formatDate(vehicle.last_freight_date) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-sm font-medium text-muted-foreground">Marca</p><p>{vehicle.brand}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Modelo</p><p>{vehicle.model}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Ano</p><p>{vehicle.year}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Cor</p><p>{vehicle.color || 'N/A'}</p></div>
              {vehicle.fuel_type && <div><p className="text-sm font-medium text-muted-foreground">Combustível</p><p>{vehicle.fuel_type}</p></div>}
              {(vehicle.capacity_kg || vehicle.capacity_m3) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacidade</p>
                  <div className="flex flex-col text-sm">
                    {vehicle.capacity_kg && <span>{vehicle.capacity_kg}kg</span>}
                    {vehicle.capacity_m3 && <span>{vehicle.capacity_m3}m³</span>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vehicle.chassis_number && <div><p className="text-sm font-medium text-muted-foreground">Chassi</p><p className="font-mono text-sm">{vehicle.chassis_number}</p></div>}
            {vehicle.renavam && <div><p className="text-sm font-medium text-muted-foreground">RENAVAM</p><p className="font-mono">{vehicle.renavam}</p></div>}
            {vehicle.crlv_expiry_date && <div><p className="text-sm font-medium text-muted-foreground">Validade CRLV</p><p>{formatDate(vehicle.crlv_expiry_date)}</p></div>}
            {vehicle.ipva_expiry_date && <div><p className="text-sm font-medium text-muted-foreground">Vencimento IPVA</p><p>{formatDate(vehicle.ipva_expiry_date)}</p></div>}
          </CardContent>
        </Card>
      </div>

      {(vehicle.insurance_company || vehicle.insurance_expiry_date) && (
        <Card>
          <CardHeader><CardTitle>Seguro</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {vehicle.insurance_company && <div><p className="text-sm font-medium text-muted-foreground">Seguradora</p><p>{vehicle.insurance_company}</p></div>}
              {vehicle.insurance_policy_number && <div><p className="text-sm font-medium text-muted-foreground">Apólice</p><p className="font-mono text-sm">{vehicle.insurance_policy_number}</p></div>}
              {vehicle.insurance_expiry_date && <div><p className="text-sm font-medium text-muted-foreground">Validade</p><p>{formatDate(vehicle.insurance_expiry_date)}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {vehicle.notes && (
        <Card>
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fretes Recentes</CardTitle>
            <Link href={`/fretes?vehicle_id=${vehicle.id}`}>
              <Button variant="outline" size="sm">Ver Todos</Button>
            </Link>
          </div>
          <CardDescription>Últimos fretes realizados com este veículo</CardDescription>
        </CardHeader>
        <CardContent>
          {recentFreights && recentFreights.length > 0 ? (
            <div className="space-y-3">
              {recentFreights.map((freight) => (
                <Link key={freight.id} href={`/fretes/${freight.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{freight.freight_number}</p>
                    <p className="text-sm text-muted-foreground">{freight.origin_city}, {freight.origin_state} → {freight.destination_city}, {freight.destination_state}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(freight.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(freight.total_value)}</span>
                    <Badge variant="outline">
                      {freight.status === 'pending' && 'Pendente'}
                      {freight.status === 'in_transit' && 'Em Trânsito'}
                      {freight.status === 'delivered' && 'Entregue'}
                      {freight.status === 'cancelled' && 'Cancelado'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum frete atribuído a este veículo ainda</p>
              <Link href={`/fretes/novo?vehicle_id=${vehicle.id}`}><Button>Criar Primeiro Frete</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
