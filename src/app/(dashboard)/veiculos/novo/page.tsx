import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VehicleForm } from '@/components/veiculos/vehicle-form'

export const dynamic = 'force-dynamic'

export default async function NovoVeiculoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/veiculos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Veículo</h1>
          <p className="text-muted-foreground">Preencha as informações para cadastrar um novo veículo</p>
        </div>
      </div>
      <VehicleForm />
    </div>
  )
}
