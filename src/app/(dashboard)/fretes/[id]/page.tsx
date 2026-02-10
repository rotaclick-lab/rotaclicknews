import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, DollarSign, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FreightStatusBadge } from '@/components/fretes/freight-status-badge'
import { getFreight } from '@/app/actions/freight-actions'
import { formatCurrency, formatDate, formatCEP, formatPhone } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: {
    id: string
  }
}

export default async function FreightDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get freight
  const result = await getFreight(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const freight = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fretes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {freight.freight_number}
            </h1>
            <p className="text-muted-foreground">Detalhes do frete</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/fretes/${freight.id}/editar`}>
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

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status do Frete</CardTitle>
            <FreightStatusBadge status={freight.status || 'pending'} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Data de Coleta
              </p>
              <p className="text-lg font-semibold">
                {freight.pickup_date ? formatDate(freight.pickup_date) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Previsão de Entrega
              </p>
              <p className="text-lg font-semibold">
                N/A
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Data de Entrega
              </p>
              <p className="text-lg font-semibold">
                {freight.delivery_date ? formatDate(freight.delivery_date) : 'Pendente'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-lg">{freight.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Documento
              </p>
              <p>{freight.customer?.document || 'N/A'}</p>
            </div>
            {freight.customer?.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{freight.customer.email}</p>
              </div>
            )}
            {freight.customer?.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Telefone
                </p>
                <p>{formatPhone(freight.customer.phone)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver and Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Motorista e Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Motorista
              </p>
              <p className="text-lg">
                {freight.driver?.name || 'Não atribuído'}
              </p>
              {freight.driver?.phone && (
                <p className="text-sm text-muted-foreground">
                  {formatPhone(freight.driver.phone)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Veículo</p>
              <p className="text-lg">
                {freight.vehicle?.plate || 'Não atribuído'}
              </p>
              {freight.vehicle?.model && (
                <p className="text-sm text-muted-foreground">
                  {freight.vehicle.model}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Origin and Destination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Origem e Destino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Origem</h3>
              <div className="space-y-1 text-sm">
                <p>{(freight.origin as any)?.street || 'N/A'}, {(freight.origin as any)?.number || ''}</p>
                <p>
                  {(freight.origin as any)?.city || 'N/A'}, {(freight.origin as any)?.state || 'N/A'}
                </p>
                <p>CEP: {(freight.origin as any)?.zipCode ? formatCEP((freight.origin as any).zipCode) : 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Destino</h3>
              <div className="space-y-1 text-sm">
                <p>{(freight.destination as any)?.street || 'N/A'}, {(freight.destination as any)?.number || ''}</p>
                <p>
                  {(freight.destination as any)?.city || 'N/A'}, {(freight.destination as any)?.state || 'N/A'}
                </p>
                <p>CEP: {(freight.destination as any)?.zipCode ? formatCEP((freight.destination as any).zipCode) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens do Frete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {freight.items && freight.items.length > 0 ? (
              freight.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Qtd: {item.quantity}</span>
                      <span>Peso: {item.weight_kg || 0}kg</span>
                      {item.volume_m3 && <span>Volume: {item.volume_m3}m³</span>}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  {item.value && item.value > 0 && (
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum item cadastrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Informações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor do Frete</span>
            <span className="font-medium">
              {formatCurrency(freight.freight_value)}
            </span>
          </div>
          {freight.additional_costs && freight.additional_costs > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custos Adicionais</span>
              <span className="font-medium">
                {formatCurrency(freight.additional_costs)}
              </span>
            </div>
          )}
          {freight.discount && freight.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto</span>
              <span className="font-medium">
                -{formatCurrency(freight.discount)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Valor Total</span>
            <span className="font-bold">
              {formatCurrency(freight.total_value || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {freight.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{freight.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tracking History */}
      {freight.tracking && freight.tracking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {freight.tracking.map((track, index) => (
                <div
                  key={track.id}
                  className="flex gap-4 items-start pb-4 last:pb-0 border-b last:border-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-brand-500 h-2 w-2" />
                    {index < freight.tracking!.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FreightStatusBadge status={track.status as any} />
                      <span className="text-sm text-muted-foreground">
                        {track.created_at ? formatDate(track.created_at) : 'N/A'}
                      </span>
                    </div>
                    {track.location && (
                      <p className="text-sm font-medium mt-1">{String(track.location)}</p>
                    )}
                    {track.message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {track.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
