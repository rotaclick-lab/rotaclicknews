import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, Edit, Mail, MapPin, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCustomer } from '@/app/actions/customer-actions'
import { CustomerStatusBadge } from '@/components/clientes/customer-status-badge'
import { CustomerTypeBadge } from '@/components/clientes/customer-type-badge'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const result = await getCustomer(id)

  if (!result.success || !result.data) {
    return {
      title: 'Cliente não encontrado',
    }
  }

  return {
    title: `${result.data.name} - Cliente`,
    description: `Detalhes do cliente ${result.data.name}`,
  }
}

export default async function ClienteDetalhePage({ params }: PageProps) {
  const { id } = await params
  const result = await getCustomer(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const customer = result.data

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Format document (CPF or CNPJ)
  const formatDocument = (doc: string) => {
    const digits = doc.replace(/\D/g, '')
    if (digits.length === 11) {
      // CPF
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (digits.length === 14) {
      // CNPJ
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return doc
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href="/clientes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <p className="text-muted-foreground">
                Cadastrado em {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/clientes/${customer.id}/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Cliente
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Fretes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.freights_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customer.total_freights_value || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Frete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.last_freight_date
                ? formatDate(customer.last_freight_date)
                : 'Nenhum'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Dados cadastrais e de contato</CardDescription>
            </div>
            <div className="flex gap-2">
              <CustomerTypeBadge type={customer.customer_type} />
              <CustomerStatusBadge status={customer.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {customer.customer_type === 'company' ? (
                  <>
                    <Building2 className="h-4 w-4" />
                    CNPJ
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    CPF
                  </>
                )}
              </div>
              <div className="font-mono text-lg">{formatDocument(customer.document)}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Telefone
              </div>
              <div className="text-lg">{customer.phone}</div>
            </div>
          </div>

          {customer.email && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  E-mail
                </div>
                <div className="text-lg">{customer.email}</div>
              </div>
            </>
          )}

          {(customer.address || customer.city || customer.state || customer.postal_code) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </div>
                <div className="space-y-1">
                  {customer.address && <div className="text-lg">{customer.address}</div>}
                  {(customer.city || customer.state || customer.postal_code) && (
                    <div className="text-lg text-muted-foreground">
                      {[customer.city, customer.state, customer.postal_code]
                        .filter(Boolean)
                        .join(' - ')}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {customer.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Observações
                </div>
                <div className="text-lg whitespace-pre-wrap">{customer.notes}</div>
              </div>
            </>
          )}

          <Separator />
          <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <span className="font-medium">Criado em:</span>{' '}
              {formatDate(customer.created_at)}
            </div>
            <div>
              <span className="font-medium">Atualizado em:</span>{' '}
              {formatDate(customer.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
