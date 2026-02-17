import { z } from 'zod'

export const pricingModelSchema = z.enum([
  'PER_KM',
  'FIXED_ROUTE',
  'CEP_RANGE',
  'WEIGHT_BRACKET',
  'VOLUME_BRACKET',
])

export const pricingAnalyzeInputSchema = z.object({
  carrier_id: z.string().uuid('Carrier inválido'),
  vehicle_type_id: z.string().uuid().optional().nullable(),
  origem: z.object({
    cep: z.string().optional().nullable(),
    cidade: z.string().optional().nullable(),
    lat: z.coerce.number().optional().nullable(),
    lng: z.coerce.number().optional().nullable(),
  }).optional().nullable(),
  destino: z.object({
    cep: z.string().optional().nullable(),
    cidade: z.string().optional().nullable(),
    lat: z.coerce.number().optional().nullable(),
    lng: z.coerce.number().optional().nullable(),
  }).optional().nullable(),
  km_estimado: z.coerce.number().positive('KM estimado deve ser maior que zero'),
  horas_estimadas: z.coerce.number().min(0).optional().nullable(),
  pedagio_estimado: z.coerce.number().min(0).optional().nullable(),
  modelo_de_preco: pricingModelSchema,
  price_input: z.coerce.number().positive('Preço deve ser maior que zero'),
  vale_pedagio_included: z.boolean().optional().default(false),
  antt_operation_code: z.string().optional().nullable(),
  custom_axles: z.coerce.number().int().positive().optional().nullable(),
})

export type PricingAnalyzeInput = z.infer<typeof pricingAnalyzeInputSchema>
export type PricingModel = z.infer<typeof pricingModelSchema>
