import { createClient } from '@/lib/supabase/server'
import type { AuditAction, AuditResource } from '@/types/audit.types'

export class AuditLogger {
  /**
   * Log audit event
   */
  static async log(params: {
    action: AuditAction
    resource_type: AuditResource
    resource_id?: string
    description: string
    metadata?: Record<string, any>
    before_data?: any
    after_data?: any
    ip_address?: string
    user_agent?: string
  }): Promise<boolean> {
    try {
      const supabase = await createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.warn('Audit log attempted without authenticated user')
        return false
      }

      // Get user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      // Insert audit log
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          company_id: profile?.company_id,
          action: params.action,
          resource_type: params.resource_type,
          resource_id: params.resource_id,
          description: params.description,
          metadata: params.metadata,
          before_data: params.before_data ? this.sanitizeData(params.before_data) : null,
          after_data: params.after_data ? this.sanitizeData(params.after_data) : null,
          ip_address: params.ip_address,
          user_agent: params.user_agent,
        })

      if (error) {
        console.error('Error logging audit:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Audit logger error:', error)
      return false
    }
  }

  /**
   * Log creation
   */
  static async logCreate(
    resource_type: AuditResource,
    resource_id: string,
    data: any,
    description?: string
  ): Promise<boolean> {
    return this.log({
      action: 'create',
      resource_type,
      resource_id,
      description: description || `${resource_type} criado`,
      after_data: data,
    })
  }

  /**
   * Log update
   */
  static async logUpdate(
    resource_type: AuditResource,
    resource_id: string,
    beforeData: any,
    afterData: any,
    description?: string
  ): Promise<boolean> {
    // Calculate changed fields
    const changes = this.getChangedFields(beforeData, afterData)

    return this.log({
      action: 'update',
      resource_type,
      resource_id,
      description: description || `${resource_type} atualizado`,
      before_data: beforeData,
      after_data: afterData,
      metadata: { changes },
    })
  }

  /**
   * Log deletion
   */
  static async logDelete(
    resource_type: AuditResource,
    resource_id: string,
    data: any,
    description?: string
  ): Promise<boolean> {
    return this.log({
      action: 'delete',
      resource_type,
      resource_id,
      description: description || `${resource_type} excluído`,
      before_data: data,
    })
  }

  /**
   * Log read/access
   */
  static async logRead(
    resource_type: AuditResource,
    resource_id?: string,
    description?: string
  ): Promise<boolean> {
    return this.log({
      action: 'read',
      resource_type,
      resource_id,
      description: description || `${resource_type} visualizado`,
    })
  }

  /**
   * Log login
   */
  static async logLogin(success: boolean, email: string, ip_address?: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: success ? 'login' : 'login_failed',
          resource_type: 'user',
          description: success ? 'Login realizado' : 'Falha no login',
          metadata: { email },
          ip_address,
        })

      return !error
    } catch (error) {
      console.error('Error logging login:', error)
      return false
    }
  }

  /**
   * Log permission denied
   */
  static async logPermissionDenied(
    resource_type: AuditResource,
    resource_id?: string,
    reason?: string
  ): Promise<boolean> {
    return this.log({
      action: 'permission_denied',
      resource_type,
      resource_id,
      description: `Permissão negada: ${reason || 'não autorizado'}`,
      metadata: { reason },
    })
  }

  /**
   * Log export
   */
  static async logExport(
    exportType: string,
    recordCount: number,
    format: string
  ): Promise<boolean> {
    return this.log({
      action: 'export',
      resource_type: 'report',
      description: `Exportação de ${exportType}`,
      metadata: { exportType, recordCount, format },
    })
  }

  /**
   * Get changed fields between two objects
   */
  private static getChangedFields(before: any, after: any): string[] {
    const changes: string[] = []

    if (!before || !after) return changes

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push(key)
      }
    }

    return changes
  }

  /**
   * Sanitize sensitive data
   */
  static sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card']
    const sanitized = { ...data }

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***'
      }
    }

    return sanitized
  }
}

// Export singleton
export const auditLogger = AuditLogger
