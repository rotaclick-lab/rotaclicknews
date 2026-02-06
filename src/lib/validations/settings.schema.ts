import { z } from 'zod'

// User profile schema
export const userProfileSchema = z.object({
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

// Company settings schema
export const companySettingsSchema = z.object({
  name: z.string().min(3, 'Nome da empresa é obrigatório'),
  document: z.string().min(11, 'CNPJ é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  address: z.string().min(5, 'Endereço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
  zip_code: z.string().min(8, 'CEP é obrigatório'),
  logo_url: z.string().url().optional().or(z.literal('')),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
})

// Notification settings schema
export const notificationSettingsSchema = z.object({
  email_notifications: z.boolean().default(true),
  freight_updates: z.boolean().default(true),
  payment_reminders: z.boolean().default(true),
  document_expiration: z.boolean().default(true),
  new_marketplace_routes: z.boolean().default(false),
  proposal_updates: z.boolean().default(true),
  system_updates: z.boolean().default(true),
})

// Password change schema
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirm_password: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

// Export types
export type UserProfileFormData = z.infer<typeof userProfileSchema>
export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
