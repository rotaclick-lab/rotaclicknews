import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, MapPin, Phone, Mail, FileText, Truck, AlertCircle, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DriverStatusBadge } from '@/components/motoristas/driver-status-badge'
import { DriverLicenseAlert } from '@/components/motoristas/driver-license-alert'
import { getDriver } from '@/app/actions/driver-actions'
import { formatDocument, formatPhone, formatCEP, formatDate, formatCurrency } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DriverDetailPage({ params }: PageProps) {
  const { id } = await params
  // Get driver
  const result = await getDriver(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const driver = result.data

  // Get recent freights
  const { data: recentFreights } = await supabase
    .from('freights')
    .select('id, freight_number, status, total_value, created_at, origin_city, origin_state, destination_city, destination_state')
    .eq('driver_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/motoristas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {driver.name}
            </h1>
            <p className="text-muted-foreground">Detalhes do motorista</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/motoristas/${driver.id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* License Alert */}
      <DriverLicenseAlert expiryDate={driver.license_expiry_date} driverName={driver.name} />

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações Gerais</CardTitle>
            <DriverStatusBadge status={driver.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de Fretes
              </p>
              <p className="text-lg font-semibold">
                {driver.freights_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fretes Ativos
              </p>
              <p className="text-lg font-semibold">
                {driver.active_freights || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Último Frete
              </p>
              <p className="text-lg font-semibold">
                {driver.last_freight_date ? formatDate(driver.last_freight_date) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-lg font-mono">{formatDocument(driver.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CNH</p>
              <p className="text-lg font-mono">{driver.license_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categoria CNH</p>
              <Badge variant="outline" className="text-base">{driver.license_category}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validade CNH</p>
              <p className="text-lg">
                {driver.license_expiry_date ? formatDate(driver.license_expiry_date) : 'Não informada'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {driver.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Telefone
                  </p>
                  <p>{formatPhone(driver.phone)}</p>
                </div>
              </div>
            )}
            {driver.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p>{driver.email}</p>
                </div>
              </div>
            )}
            {!driver.phone && !driver.email && (
              <p className="text-sm text-muted-foreground">
                Nenhuma informação de contato cadastrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Address */}
      {(driver.address || driver.city) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {driver.address && <p>{driver.address}</p>}
              {driver.city && (
                <p>
                  {driver.city}, {driver.state}
                </p>
              )}
              {driver.postal_code && (
                <p>{formatCEP(driver.postal_code)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {(driver.emergency_contact_name || driver.emergency_contact_phone) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Contato de Emergência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {driver.emergency_contact_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p>{driver.emergency_contact_name}</p>
              </div>
            )}
            {driver.emergency_contact_phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p>{formatPhone(driver.emergency_contact_phone)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {driver.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{driver.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Freights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fretes Recentes
            </CardTitle>
            <Link href={`/fretes?driver_id=${driver.id}`}>
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </div>
          <CardDescription>
            Últimos fretes realizados por este motorista
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentFreights && recentFreights.length > 0 ? (
            <div className="space-y-3">
              {recentFreights.map((freight) => (
                <Link
                  key={freight.id}
                  href={`/fretes/${freight.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{freight.freight_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {freight.origin_city}, {freight.origin_state} → {freight.destination_city}, {freight.destination_state}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(freight.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {formatCurrency(freight.total_value)}
                    </span>
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
              <p className="text-muted-foreground mb-4">
                Nenhum frete atribuído a este motorista ainda
              </p>
              <Link href={`/fretes/novo?driver_id=${driver.id}`}>
                <Button>Criar Primeiro Frete</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
