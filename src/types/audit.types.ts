// Audit log types
export type AuditLog = {
  id: string
  user_id: string | null
  company_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  description: string
  metadata: any | null
  before_data: any | null
  after_data: any | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>

// Audit action types
export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET: 'password_reset',
  PERMISSION_DENIED: 'permission_denied',
  EXPORT: 'export',
  IMPORT: 'import',
} as const

export type AuditAction = typeof AUDIT_ACTION[keyof typeof AUDIT_ACTION]

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criar',
  update: 'Atualizar',
  delete: 'Excluir',
  read: 'Visualizar',
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Falha no Login',
  password_reset: 'Redefinição de Senha',
  permission_denied: 'Permissão Negada',
  export: 'Exportar',
  import: 'Importar',
}

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  create: 'text-green-700 bg-green-50 border-green-200',
  update: 'text-brand-700 bg-brand-50 border-brand-200',
  delete: 'text-red-700 bg-red-50 border-red-200',
  read: 'text-gray-700 bg-gray-50 border-gray-200',
  login: 'text-green-700 bg-green-50 border-green-200',
  logout: 'text-gray-700 bg-gray-50 border-gray-200',
  login_failed: 'text-red-700 bg-red-50 border-red-200',
  password_reset: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  permission_denied: 'text-red-700 bg-red-50 border-red-200',
  export: 'text-orange-700 bg-orange-50 border-orange-200',
  import: 'text-orange-700 bg-orange-50 border-orange-200',
}

// Resource types
export const AUDIT_RESOURCE = {
  FREIGHT: 'freight',
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  VEHICLE: 'vehicle',
  TRANSACTION: 'transaction',
  USER: 'user',
  COMPANY: 'company',
  PROPOSAL: 'proposal',
  ROUTE: 'route',
  REPORT: 'report',
} as const

export type AuditResource = typeof AUDIT_RESOURCE[keyof typeof AUDIT_RESOURCE]

export const AUDIT_RESOURCE_LABELS: Record<AuditResource, string> = {
  freight: 'Frete',
  customer: 'Cliente',
  driver: 'Motorista',
  vehicle: 'Veículo',
  transaction: 'Transação',
  user: 'Usuário',
  company: 'Empresa',
  proposal: 'Proposta',
  route: 'Rota',
  report: 'Relatório',
}

// Extended audit log with relations
export interface AuditLogWithUser extends AuditLog {
  users?: {
    id: string
    name: string
    email: string
  }
}

// Audit filters
export interface AuditFilters {
  user_id?: string
  action?: AuditAction | 'all'
  resource_type?: AuditResource | 'all'
  start_date?: string
  end_date?: string
  ip_address?: string
  search?: string
}

// Audit list params
export interface AuditListParams {
  page?: number
  per_page?: number
  order_by?: string
  order?: 'asc' | 'desc'
  filters?: AuditFilters
}

// Audit statistics
export interface AuditStats {
  total_logs: number
  today_logs: number
  failed_logins_today: number
  unique_users_today: number
  by_action: Array<{ action: string; count: number }>
  by_resource: Array<{ resource: string; count: number }>
  by_hour: Array<{ hour: number; count: number }>
  suspicious_activities: Array<{
    user_id: string
    user_name: string
    activity_type: string
    count: number
    last_occurrence: string
  }>
}

// Security event
export interface SecurityEvent {
  type: 'multiple_failed_logins' | 'unusual_activity' | 'permission_violation' | 'data_export'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  ip_address?: string
  description: string
  timestamp: string
}

// Compliance report
export interface ComplianceReport {
  period: { start: string; end: string }
  total_actions: number
  data_access: {
    reads: number
    exports: number
    users: string[]
  }
  data_modifications: {
    creates: number
    updates: number
    deletes: number
  }
  security_events: {
    failed_logins: number
    permission_denials: number
  }
  user_activity: Array<{
    user_id: string
    user_name: string
    total_actions: number
    sensitive_actions: number
  }>
}
