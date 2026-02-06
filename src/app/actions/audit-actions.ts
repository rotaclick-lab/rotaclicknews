'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuditListParams, AuditStats, ComplianceReport, SecurityEvent } from '@/types/audit.types'

// List audit logs with filters
export async function listAuditLogs(params: AuditListParams = {}) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const {
      page = 1,
      per_page = 50,
      order_by = 'created_at',
      order = 'desc',
      filters = {},
    } = params

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', profile.company_id)

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters.action && filters.action !== 'all') {
      query = query.eq('action', filters.action)
    }

    if (filters.resource_type && filters.resource_type !== 'all') {
      query = query.eq('resource_type', filters.resource_type)
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    if (filters.ip_address) {
      query = query.eq('ip_address', filters.ip_address)
    }

    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,resource_id.ilike.%${filters.search}%`)
    }

    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1

    const { data, error, count } = await query
      .order(order_by, { ascending: order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('Error listing audit logs:', error)
      return { success: false, error: 'Erro ao buscar logs' }
    }

    return {
      success: true,
      data: {
        logs: data,
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in listAuditLogs:', error)
    return { success: false, error: 'Erro ao buscar logs' }
  }
}

// Get audit statistics
export async function getAuditStats(startDate?: string, endDate?: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const today = new Date().toISOString().split('T')[0]
    const start = startDate || today
    const end = endDate || today

    // Get all logs for period
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', profile.company_id)
      .gte('created_at', start)
      .lte('created_at', end + 'T23:59:59')

    if (error) {
      console.error('Error fetching audit stats:', error)
      return { success: false, error: 'Erro ao buscar estatísticas' }
    }

    // Calculate stats
    const stats: AuditStats = {
      total_logs: logs?.length || 0,
      today_logs: logs?.filter(l => l.created_at.startsWith(today)).length || 0,
      failed_logins_today: logs?.filter(l => 
        l.action === 'login_failed' && l.created_at.startsWith(today)
      ).length || 0,
      unique_users_today: new Set(
        logs?.filter(l => l.created_at.startsWith(today)).map(l => l.user_id)
      ).size,
      by_action: [],
      by_resource: [],
      by_hour: [],
      suspicious_activities: [],
    }

    // Group by action
    const actionMap = new Map<string, number>()
    logs?.forEach(log => {
      actionMap.set(log.action, (actionMap.get(log.action) || 0) + 1)
    })
    stats.by_action = Array.from(actionMap.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)

    // Group by resource
    const resourceMap = new Map<string, number>()
    logs?.forEach(log => {
      resourceMap.set(log.resource_type, (resourceMap.get(log.resource_type) || 0) + 1)
    })
    stats.by_resource = Array.from(resourceMap.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)

    // Group by hour
    const hourMap = new Map<number, number>()
    logs?.forEach(log => {
      const hour = new Date(log.created_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })
    stats.by_hour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourMap.get(i) || 0,
    }))

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error in getAuditStats:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}

// Generate compliance report (LGPD)
export async function generateComplianceReport(startDate: string, endDate: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    // Get logs for period
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', profile.company_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')

    if (error) {
      console.error('Error generating compliance report:', error)
      return { success: false, error: 'Erro ao gerar relatório' }
    }

    // Build compliance report
    const report: ComplianceReport = {
      period: { start: startDate, end: endDate },
      total_actions: logs?.length || 0,
      data_access: {
        reads: logs?.filter(l => l.action === 'read').length || 0,
        exports: logs?.filter(l => l.action === 'export').length || 0,
        users: [...new Set(logs?.filter(l => l.action === 'read' || l.action === 'export').map(l => l.user_id))],
      },
      data_modifications: {
        creates: logs?.filter(l => l.action === 'create').length || 0,
        updates: logs?.filter(l => l.action === 'update').length || 0,
        deletes: logs?.filter(l => l.action === 'delete').length || 0,
      },
      security_events: {
        failed_logins: logs?.filter(l => l.action === 'login_failed').length || 0,
        permission_denials: logs?.filter(l => l.action === 'permission_denied').length || 0,
      },
      user_activity: [],
    }

    // User activity breakdown
    const userMap = new Map<string, { total: number; sensitive: number }>()
    logs?.forEach(log => {
      if (!log.user_id) return

      const activity = userMap.get(log.user_id) || { total: 0, sensitive: 0 }
      activity.total++

      if (['delete', 'export', 'permission_denied'].includes(log.action)) {
        activity.sensitive++
      }

      userMap.set(log.user_id, activity)
    })

    report.user_activity = Array.from(userMap.entries())
      .map(([userId, activity]) => ({
        user_id: userId,
        user_name: 'Usuário', // Would need to join with users table
        total_actions: activity.total,
        sensitive_actions: activity.sensitive,
      }))
      .sort((a, b) => b.total_actions - a.total_actions)

    return { success: true, data: report }
  } catch (error) {
    console.error('Error in generateComplianceReport:', error)
    return { success: false, error: 'Erro ao gerar relatório de conformidade' }
  }
}

// Detect security events
export async function detectSecurityEvents(hours: number = 24) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('company_id', profile.company_id)
      .gte('created_at', since)

    if (error) {
      console.error('Error detecting security events:', error)
      return { success: false, error: 'Erro ao detectar eventos' }
    }

    const events: SecurityEvent[] = []

    // Detect multiple failed logins
    const failedLoginsByUser = new Map<string, number>()
    logs?.filter(l => l.action === 'login_failed').forEach(log => {
      const email = log.metadata?.email || 'unknown'
      failedLoginsByUser.set(email, (failedLoginsByUser.get(email) || 0) + 1)
    })

    for (const [email, count] of failedLoginsByUser.entries()) {
      if (count >= 5) {
        events.push({
          type: 'multiple_failed_logins',
          severity: count >= 10 ? 'critical' : 'high',
          description: `${count} tentativas de login falhadas para ${email}`,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Detect unusual export activity
    const exports = logs?.filter(l => l.action === 'export') || []
    if (exports.length >= 10) {
      events.push({
        type: 'data_export',
        severity: 'medium',
        description: `${exports.length} exportações realizadas nas últimas ${hours}h`,
        timestamp: new Date().toISOString(),
      })
    }

    // Detect permission violations
    const permissionDenials = logs?.filter(l => l.action === 'permission_denied') || []
    if (permissionDenials.length >= 5) {
      events.push({
        type: 'permission_violation',
        severity: 'high',
        description: `${permissionDenials.length} violações de permissão detectadas`,
        timestamp: new Date().toISOString(),
      })
    }

    return { success: true, data: events }
  } catch (error) {
    console.error('Error in detectSecurityEvents:', error)
    return { success: false, error: 'Erro ao detectar eventos de segurança' }
  }
}

// Export audit logs to CSV
export async function exportAuditLogs(filters: any) {
  try {
    const result = await listAuditLogs({
      page: 1,
      per_page: 10000,
      filters,
    })

    if (!result.success || !result.data) {
      return { success: false, error: 'Erro ao buscar logs' }
    }

    // Generate CSV
    let csv = 'Data,Usuário,Ação,Recurso,Descrição,IP\n'

    result.data.logs.forEach((log: any) => {
      const date = new Date(log.created_at).toLocaleString('pt-BR')
      const user = log.user_id || 'Sistema'
      const action = log.action
      const resource = log.resource_type
      const description = log.description.replace(/"/g, '""')
      const ip = log.ip_address || '-'

      csv += `"${date}","${user}","${action}","${resource}","${description}","${ip}"\n`
    })

    return {
      success: true,
      data: {
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
        content: csv,
        mime_type: 'text/csv',
      },
    }
  } catch (error) {
    console.error('Error in exportAuditLogs:', error)
    return { success: false, error: 'Erro ao exportar logs' }
  }
}
