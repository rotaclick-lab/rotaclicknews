import { z } from 'zod'

// Report filters schema
export const reportFiltersSchema = z.object({
  period: z.enum([
    'today',
    'yesterday',
    'this_week',
    'last_week',
    'this_month',
    'last_month',
    'this_quarter',
    'last_quarter',
    'this_year',
    'last_year',
    'custom',
  ]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  status: z.string().optional(),
  category_id: z.string().uuid().optional(),
  min_amount: z.coerce.number().positive().optional(),
  max_amount: z.coerce.number().positive().optional(),
}).refine(
  (data) => {
    if (data.period === 'custom') {
      return !!data.start_date && !!data.end_date
    }
    return true
  },
  {
    message: 'Datas inicial e final são obrigatórias para período personalizado',
    path: ['start_date'],
  }
)

// Report request schema
export const reportRequestSchema = z.object({
  type: z.enum(['freights', 'financial', 'customers', 'drivers', 'vehicles', 'executive']),
  format: z.enum(['pdf', 'excel', 'csv']),
  filters: reportFiltersSchema,
  include_charts: z.boolean().optional().default(true),
  include_details: z.boolean().optional().default(true),
})

// Scheduled report schema
export const scheduledReportSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  type: z.enum(['freights', 'financial', 'customers', 'drivers', 'vehicles', 'executive']),
  format: z.enum(['pdf', 'excel', 'csv']),
  filters: reportFiltersSchema,
  schedule: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string().email()).min(1, 'Pelo menos um destinatário é obrigatório'),
  is_active: z.boolean().optional().default(true),
})

// Export types
export type ReportFiltersFormData = z.infer<typeof reportFiltersSchema>
export type ReportRequestFormData = z.infer<typeof reportRequestSchema>
export type ScheduledReportFormData = z.infer<typeof scheduledReportSchema>
