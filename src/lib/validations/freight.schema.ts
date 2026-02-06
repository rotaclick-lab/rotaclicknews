import { z } from 'zod'

// Freight item schema
export const freightItemSchema = z.object({
  description: z
    .string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  quantity: z
    .number()
    .min(1, 'Quantidade deve ser no mínimo 1')
    .or(z.string().transform(Number)),
  weight: z
    .number()
    .min(0.01, 'Peso deve ser maior que 0')
    .or(z.string().transform(Number)),
  volume: z
    .number()
    .min(0)
    .nullable()
    .optional()
    .or(z.string().transform(Number)),
  value: z
    .number()
    .min(0, 'Valor deve ser maior ou igual a 0')
    .or(z.string().transform(Number)),
  notes: z.string().max(500).nullable().optional(),
})

// Freight create/update schema
export const freightSchema = z.object({
  customer_id: z.string().uuid('Selecione um cliente válido'),
  driver_id: z.string().uuid('Selecione um motorista válido').nullable().optional(),
  vehicle_id: z.string().uuid('Selecione um veículo válido').nullable().optional(),
  
  // Origin
  origin_address: z
    .string()
    .min(5, 'Endereço de origem deve ter no mínimo 5 caracteres')
    .max(200),
  origin_city: z
    .string()
    .min(2, 'Cidade de origem deve ter no mínimo 2 caracteres')
    .max(100),
  origin_state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .toUpperCase(),
  origin_postal_code: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 12345-678)'),
  
  // Destination
  destination_address: z
    .string()
    .min(5, 'Endereço de destino deve ter no mínimo 5 caracteres')
    .max(200),
  destination_city: z
    .string()
    .min(2, 'Cidade de destino deve ter no mínimo 2 caracteres')
    .max(100),
  destination_state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: RJ)')
    .toUpperCase(),
  destination_postal_code: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 12345-678)'),
  
  // Dates
  pickup_date: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  estimated_delivery_date: z.string().nullable().optional(),
  
  // Financial
  freight_value: z
    .number()
    .min(0, 'Valor do frete deve ser maior ou igual a 0')
    .or(z.string().transform(Number)),
  additional_costs: z
    .number()
    .min(0)
    .nullable()
    .optional()
    .or(z.string().transform(Number)),
  discount: z
    .number()
    .min(0)
    .nullable()
    .optional()
    .or(z.string().transform(Number)),
  total_value: z
    .number()
    .min(0, 'Valor total deve ser maior ou igual a 0')
    .or(z.string().transform(Number)),
  
  payment_method: z
    .enum(['cash', 'pix', 'credit_card', 'bank_transfer', 'check'])
    .nullable()
    .optional(),
  
  notes: z.string().max(1000).nullable().optional(),
  
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  
  // Items
  items: z
    .array(freightItemSchema)
    .min(1, 'Adicione pelo menos 1 item ao frete'),
})

// Freight update status schema
export const freightStatusSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  notes: z.string().max(500).nullable().optional(),
})

// Freight filters schema
export const freightFiltersSchema = z.object({
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']).optional(),
  customer_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  origin_city: z.string().optional(),
  destination_city: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().optional(),
})

// Export types
export type FreightFormData = z.infer<typeof freightSchema>
export type FreightItemFormData = z.infer<typeof freightItemSchema>
export type FreightStatusFormData = z.infer<typeof freightStatusSchema>
export type FreightFiltersFormData = z.infer<typeof freightFiltersSchema>
