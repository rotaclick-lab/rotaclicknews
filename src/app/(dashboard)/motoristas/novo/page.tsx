import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DriverForm } from '@/components/motoristas/driver-form'
import { createClient } from '@/lib/supabase/server'

export default async function NovoMotoristaPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/motoristas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Motorista</h1>
          <p className="text-muted-foreground">
            Preencha as informações para criar um novo motorista
          </p>
        </div>
      </div>

      {/* Form */}
      <DriverForm />
    </div>
  )
}
