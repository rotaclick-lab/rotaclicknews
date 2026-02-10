import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FreightForm } from '@/components/fretes/freight-form'

export const dynamic = 'force-dynamic'

export default async function NovoFretePage() {
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
      <FreightForm customers={[]} drivers={[]} vehicles={[]} />
    </div>
  )
}
