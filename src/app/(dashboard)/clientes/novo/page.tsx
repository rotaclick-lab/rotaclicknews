import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/clientes/customer-form'

export default async function NovoClientePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Preencha as informações para criar um novo cliente
          </p>
        </div>
      </div>

      {/* Form */}
      <CustomerForm />
    </div>
  )
}
