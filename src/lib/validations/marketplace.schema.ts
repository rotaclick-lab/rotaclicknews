import { z } from 'zod'

// Return Freight Schema
export const returnFreightSchema = z.object({
  origin_city: z.string().min(2, 'Cidade de origem é obrigatória'),
  origin_state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  origin_postal_code: z.string().optional().nullable(),
  destination_city: z.string().min(2, 'Cidade de destino é obrigatória'),
  destination_state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  destination_postal_code: z.string().optional().nullable(),
  vehicle_id: z.string().uuid().optional().nullable(),
  vehicle_type: z.string().min(1, 'Tipo de veículo é obrigatório'),
  available_date: z.string().min(1, 'Data disponível é obrigatória'),
  expiry_date: z.string().min(1, 'Data de validade é obrigatória'),
  suggested_price: z.coerce.number().positive().optional().nullable(),
  max_price: z.coerce.number().positive().optional().nullable(),
  cargo_type: z.string().optional().nullable(),
  cargo_weight: z.coerce.number().positive().optional().nullable(),
  cargo_volume: z.coerce.number().positive().optional().nullable(),
  distance_km: z.coerce.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  auto_accept_best: z.boolean().optional().default(false),
  allow_counter_offers: z.boolean().optional().default(true),
}).refine(
  (data) => {
    if (data.available_date && data.expiry_date) {
      return new Date(data.available_date) < new Date(data.expiry_date)
    }
    return true
  },
  {
    message: 'Data de validade deve ser posterior à data disponível',
    path: ['expiry_date'],
  }
).refine(
  (data) => {
    if (data.suggested_price && data.max_price) {
      return data.suggested_price <= data.max_price
    }
    return true
  },
  {
    message: 'Preço máximo deve ser maior ou igual ao preço sugerido',
    path: ['max_price'],
  }
)

// Proposal Schema
export const proposalSchema = z.object({
  return_freight_id: z.string().uuid('ID do frete inválido'),
  proposed_price: z.coerce.number().positive('Valor deve ser maior que zero'),
  estimated_delivery_days: z.coerce.number().int().positive('Prazo deve ser maior que zero'),
  vehicle_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  message: z.string().optional().nullable(),
  valid_until: z.string().min(1, 'Validade da proposta é obrigatória'),
}).refine(
  (data) => {
    const validUntil = new Date(data.valid_until)
    const now = new Date()
    return validUntil > now
  },
  {
    message: 'Data de validade deve ser futura',
    path: ['valid_until'],
  }
)

// Filter schemas
export const returnFreightFiltersSchema = z.object({
  status: z.enum(['all', 'available', 'in_negotiation', 'accepted', 'expired', 'cancelled']).optional(),
  origin_state: z.string().length(2).optional(),
  destination_state: z.string().length(2).optional(),
  vehicle_type: z.string().optional(),
  min_date: z.string().optional(),
  max_date: z.string().optional(),
  max_distance: z.coerce.number().positive().optional(),
})

export const proposalFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'accepted', 'rejected', 'counter', 'withdrawn']).optional(),
  return_freight_id: z.string().uuid().optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
})

// Export types
export type ReturnFreightFormData = z.infer<typeof returnFreightSchema>
export type ProposalFormData = z.infer<typeof proposalSchema>
export type ReturnFreightFiltersFormData = z.infer<typeof returnFreightFiltersSchema>
export type ProposalFiltersFormData = z.infer<typeof proposalFiltersSchema>
