export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  metadata: any | null
  read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'updated_at'>
export type NotificationUpdate = Partial<NotificationInsert>

export const NOTIFICATION_TYPE = {
  FREIGHT_CREATED: 'freight_created',
  FREIGHT_UPDATED: 'freight_updated',
  FREIGHT_COMPLETED: 'freight_completed',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_OVERDUE: 'payment_overdue',
  DOCUMENT_EXPIRING: 'document_expiring',
  DOCUMENT_EXPIRED: 'document_expired',
  PROPOSAL_RECEIVED: 'proposal_received',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  SYSTEM: 'system',
} as const

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE]

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  freight_created: 'Frete Criado',
  freight_updated: 'Frete Atualizado',
  freight_completed: 'Frete Concluído',
  payment_received: 'Pagamento Recebido',
  payment_overdue: 'Pagamento Vencido',
  document_expiring: 'Documento Expirando',
  document_expired: 'Documento Vencido',
  proposal_received: 'Proposta Recebida',
  proposal_accepted: 'Proposta Aceita',
  system: 'Sistema',
}

export interface NotificationWithUser extends Notification {
  users?: {
    name: string
    email: string
  }
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  freight_notifications: boolean
  financial_notifications: boolean
  document_notifications: boolean
  marketplace_notifications: boolean
}
