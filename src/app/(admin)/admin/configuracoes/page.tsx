import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
}

export default async function AdminConfiguracoesPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-muted-foreground">Parâmetros gerais da plataforma</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Configurações gerais</CardTitle>
          <CardDescription>Em breve: modo manutenção, limites, URLs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta seção será expandida com opções de configuração do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
