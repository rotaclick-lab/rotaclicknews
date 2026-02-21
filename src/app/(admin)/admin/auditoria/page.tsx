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
import { AuditoriaFilters } from './auditoria-filters'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
}

type AuditLog = {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  metadata: unknown
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-slate-100 text-slate-700',
  IMPORT: 'bg-orange-100 text-orange-800',
  EXPORT: 'bg-yellow-100 text-yellow-800',
}

interface PageProps {
  searchParams: {
    action?: string
    resource_type?: string
    date_from?: string
    date_to?: string
    page?: string
  }
}

const PER_PAGE = 50

export default async function AdminAuditoriaPage({ searchParams }: PageProps) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const filterAction = searchParams.action?.trim() || ''
  const filterResource = searchParams.resource_type?.trim() || ''
  const filterDateFrom = searchParams.date_from?.trim() || ''
  const filterDateTo = searchParams.date_to?.trim() || ''

  let logs: AuditLog[] = []
  let total = 0
  let distinctActions: string[] = []
  let distinctResources: string[] = []

  try {
    const admin = createAdminClient()

    let query = admin
      .from('audit_logs')
      .select('id, user_id, action, resource_type, resource_id, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filterAction) query = query.eq('action', filterAction)
    if (filterResource) query = query.eq('resource_type', filterResource)
    if (filterDateFrom) query = query.gte('created_at', `${filterDateFrom}T00:00:00`)
    if (filterDateTo) query = query.lte('created_at', `${filterDateTo}T23:59:59`)

    query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

    const { data, count, error } = await query
    if (!error) {
      logs = data ?? []
      total = count ?? 0
    }

    const { data: allLogs } = await admin
      .from('audit_logs')
      .select('action, resource_type')
      .limit(1000)

    distinctActions = [...new Set((allLogs ?? []).map((l) => l.action).filter(Boolean))].sort()
    distinctResources = [...new Set((allLogs ?? []).map((l) => l.resource_type).filter(Boolean))].sort()
  } catch {
    logs = []
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Auditoria</h1>
        <p className="text-muted-foreground">Logs de ações na plataforma — {total.toLocaleString('pt-BR')} registro(s)</p>
      </div>

      <AuditoriaFilters
        actions={distinctActions}
        resources={distinctResources}
        currentAction={filterAction}
        currentResource={filterResource}
        currentDateFrom={filterDateFrom}
        currentDateTo={filterDateTo}
      />

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Registros de auditoria</CardTitle>
          <CardDescription>
            {total > 0
              ? `Exibindo ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} de ${total.toLocaleString('pt-BR')}`
              : 'Nenhum registro encontrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!logs.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum log encontrado com os filtros aplicados.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>ID do Recurso</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource_type || '-'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                        {log.resource_id || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                        {log.user_id || 'sistema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`/admin/auditoria?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                      >
                        Anterior
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/admin/auditoria?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                      >
                        Próxima
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
