import { z } from 'zod'

// Transaction Category Schema
export const transactionCategorySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo é obrigatório',
  }),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
})

// Transaction Schema
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo é obrigatório',
  }),
  category_id: z.string().uuid('Categoria inválida'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  payment_date: z.string().optional().nullable(),
  payment_method: z.enum([
    'cash',
    'bank_transfer',
    'credit_card',
    'debit_card',
    'pix',
    'boleto',
    'check',
    'other',
  ]).optional().nullable(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  freight_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  supplier_name: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_interval: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),
  recurrence_count: z.coerce.number().int().positive().optional().nullable(),
  attachment_url: z.string().url().optional().nullable().or(z.literal('')),
}).refine(
  (data) => {
    if (data.status === 'paid' && !data.payment_date) {
      return false
    }
    return true
  },
  {
    message: 'Data de pagamento é obrigatória para transações pagas',
    path: ['payment_date'],
  }
).refine(
  (data) => {
    if (data.status === 'paid' && !data.payment_method) {
      return false
    }
    return true
  },
  {
    message: 'Método de pagamento é obrigatório para transações pagas',
    path: ['payment_method'],
  }
).refine(
  (data) => {
    if (data.is_recurring && !data.recurrence_interval) {
      return false
    }
    return true
  },
  {
    message: 'Intervalo de recorrência é obrigatório',
    path: ['recurrence_interval'],
  }
).refine(
  (data) => {
    if (data.is_recurring && !data.recurrence_count) {
      return false
    }
    return true
  },
  {
    message: 'Quantidade de recorrências é obrigatória',
    path: ['recurrence_count'],
  }
)

// Filter schemas
export const transactionFiltersSchema = z.object({
  type: z.enum(['all', 'income', 'expense']).optional(),
  status: z.enum(['all', 'pending', 'paid', 'overdue', 'cancelled']).optional(),
  category_id: z.string().uuid().optional(),
  payment_method: z.enum([
    'cash',
    'bank_transfer',
    'credit_card',
    'debit_card',
    'pix',
    'boleto',
    'check',
    'other',
  ]).optional(),
  freight_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  min_amount: z.coerce.number().positive().optional(),
  max_amount: z.coerce.number().positive().optional(),
})

// Export types
export type TransactionCategoryFormData = z.infer<typeof transactionCategorySchema>
export type TransactionFormData = z.infer<typeof transactionSchema>
export type TransactionFiltersFormData = z.infer<typeof transactionFiltersSchema>
