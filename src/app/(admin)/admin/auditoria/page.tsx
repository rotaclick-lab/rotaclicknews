import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
}

export default async function AdminAuditoriaPage() {
  await requireAdmin()

  let logs: Array<{ id: string; user_id: string | null; action: string; resource_type: string; resource_id: string | null; metadata: unknown; created_at: string }> = []
  try {
    const admin = createAdminClient()
    const res = await admin
      .from('audit_logs')
      .select('id, user_id, action, resource_type, resource_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!res.error) logs = res.data ?? []
  } catch {
    logs = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Auditoria</h1>
        <p className="text-muted-foreground">Logs de ações na plataforma</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Últimas ações</CardTitle>
          <CardDescription>Registro de alterações e acessos</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum log de auditoria encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.resource_type}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[120px]">
                      {log.resource_id || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
