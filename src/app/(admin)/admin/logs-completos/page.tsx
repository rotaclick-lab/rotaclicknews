import { listAllAuditLogs } from '@/app/actions/platform-actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { LogsFilters } from './logs-filters'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-slate-100 text-slate-700',
  IMPORT: 'bg-orange-100 text-orange-800',
  EXPORT: 'bg-yellow-100 text-yellow-800',
  TOGGLE: 'bg-cyan-100 text-cyan-800',
  PAYMENT: 'bg-emerald-100 text-emerald-800',
}

interface PageProps {
  searchParams: {
    action?: string
    resource_type?: string
    user_id?: string
    date_from?: string
    date_to?: string
    page?: string
  }
}

const PER_PAGE = 100

export default async function AdminLogsCompletosPage({ searchParams }: PageProps) {
  await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)

  const result = await listAllAuditLogs({
    page,
    perPage: PER_PAGE,
    action: searchParams.action || undefined,
    resourceType: searchParams.resource_type || undefined,
    userId: searchParams.user_id || undefined,
    dateFrom: searchParams.date_from || undefined,
    dateTo: searchParams.date_to || undefined,
  })

  const logs = result.success ? (result.data ?? []) : []
  const total = result.success ? (result.total ?? 0) : 0
  const totalPages = Math.ceil(total / PER_PAGE)

  // Buscar valores distintos para os filtros
  let distinctActions: string[] = []
  let distinctResources: string[] = []
  try {
    const admin = createAdminClient()
    const { data: sample } = await admin
      .from('audit_logs')
      .select('action, resource_type')
      .limit(2000)
    distinctActions = [...new Set((sample ?? []).map((l) => l.action).filter(Boolean))].sort()
    distinctResources = [...new Set((sample ?? []).map((l) => l.resource_type).filter(Boolean))].sort()
  } catch { /* silent */ }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Logs Completos</h1>
        <p className="text-muted-foreground">
          Registro de <strong>{total.toLocaleString('pt-BR')}</strong> ações na plataforma — quem fez o quê e quando
        </p>
      </div>

      <LogsFilters
        actions={distinctActions}
        resources={distinctResources}
        currentAction={searchParams.action ?? ''}
        currentResource={searchParams.resource_type ?? ''}
        currentUserId={searchParams.user_id ?? ''}
        currentDateFrom={searchParams.date_from ?? ''}
        currentDateTo={searchParams.date_to ?? ''}
        basePath="/admin/logs-completos"
      />

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Histórico de ações</CardTitle>
          <CardDescription>
            {total > 0
              ? `Exibindo ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} de ${total.toLocaleString('pt-BR')}`
              : 'Nenhum registro encontrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum log encontrado com os filtros aplicados.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>ID do Recurso</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{(log as any).user_name ?? 'sistema'}</div>
                          {log.user_id && (
                            <div className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                              {log.user_id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700'}`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{log.resource_type || '-'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {log.resource_id || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[220px] truncate">
                          {(log as any).description || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(log as any).ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <a
                        href={`/admin/logs-completos?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                      >
                        Anterior
                      </a>
                    )}
                    {page < totalPages && (
                      <a
                        href={`/admin/logs-completos?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
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
