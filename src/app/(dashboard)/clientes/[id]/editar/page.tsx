import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerForm } from '@/components/clientes/customer-form'
import { Skeleton } from '@/components/ui/skeleton'
import { getCustomer } from '@/app/actions/customer-actions'

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
    title: `Editar ${result.data.name}`,
    description: `Editar dados do cliente ${result.data.name}`,
  }
}

export default async function EditarClientePage({ params }: PageProps) {
  const { id } = await params
  const result = await getCustomer(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const customer = result.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
        <p className="text-muted-foreground">Atualizar dados do cliente {customer.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
          <CardDescription>Os campos marcados com * são obrigatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <CustomerForm
              initialData={{
                id: customer.id,
                name: customer.name,
                document: customer.document,
                customer_type: customer.customer_type,
                email: customer.email || '',
                phone: customer.phone,
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.postal_code || '',
                notes: customer.notes || '',
                status: customer.status,
              }}
              isEdit={true}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
