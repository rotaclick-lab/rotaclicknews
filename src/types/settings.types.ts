export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'operator'
  company_id: string
  created_at: string
  updated_at: string
}

export interface CompanySettings {
  id: string
  name: string
  document: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_notifications: boolean
  freight_updates: boolean
  payment_reminders: boolean
  document_expiration: boolean
  new_marketplace_routes: boolean
  proposal_updates: boolean
  system_updates: boolean
  created_at: string
  updated_at: string
}

export interface SecuritySettings {
  id: string
  user_id: string
  two_factor_enabled: boolean
  session_timeout: number
  password_changed_at?: string
  last_login_at?: string
  last_login_ip?: string
  created_at: string
  updated_at: string
}

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
}

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso completo ao sistema',
  manager: 'Gerencia operações e equipe',
  operator: 'Operação diária',
}
