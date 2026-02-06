import { z } from 'zod'

/**
 * Validate Brazilian vehicle plate (old and new formats)
 * Old: ABC-1234
 * New (Mercosul): ABC1D23
 */
function isValidPlate(plate: string): boolean {
  const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  
  // Old format: 3 letters + 4 numbers
  const oldFormat = /^[A-Z]{3}\d{4}$/
  
  // New format (Mercosul): 3 letters + 1 number + 1 letter + 2 numbers
  const newFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/
  
  return oldFormat.test(cleaned) || newFormat.test(cleaned)
}

// Vehicle create/update schema
export const vehicleSchema = z.object({
  plate: z
    .string()
    .min(7, 'Placa inválida')
    .max(8, 'Placa inválida')
    .refine(isValidPlate, 'Placa inválida (formato: ABC-1234 ou ABC1D23)'),
  
  model: z
    .string()
    .min(2, 'Modelo deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),
  
  brand: z
    .string()
    .min(2, 'Marca deve ter no mínimo 2 caracteres')
    .max(100, 'Marca deve ter no máximo 100 caracteres'),
  
  year: z
    .number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser futuro'),
  
  type: z.enum(['truck', 'van', 'semi_trailer', 'trailer', 'pickup', 'motorcycle'], {
    required_error: 'Selecione o tipo de veículo',
  }),
  
  capacity_kg: z
    .number()
    .min(0, 'Capacidade deve ser maior ou igual a 0')
    .nullable()
    .optional(),
  
  capacity_m3: z
    .number()
    .min(0, 'Capacidade deve ser maior ou igual a 0')
    .nullable()
    .optional(),
  
  fuel_type: z
    .string()
    .max(50, 'Tipo de combustível deve ter no máximo 50 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  color: z
    .string()
    .max(50, 'Cor deve ter no máximo 50 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  chassis_number: z
    .string()
    .max(50, 'Número do chassi deve ter no máximo 50 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  renavam: z
    .string()
    .regex(/^\d{9,11}$/, 'RENAVAM deve ter entre 9 e 11 dígitos')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  crlv_expiry_date: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  ipva_expiry_date: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  insurance_expiry_date: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  insurance_company: z
    .string()
    .max(100, 'Nome da seguradora deve ter no máximo 100 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  insurance_policy_number: z
    .string()
    .max(100, 'Número da apólice deve ter no máximo 100 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  last_maintenance_date: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  last_maintenance_km: z
    .number()
    .min(0, 'Quilometragem deve ser maior ou igual a 0')
    .nullable()
    .optional(),
  
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  status: z.enum(['active', 'inactive', 'maintenance']),
})

// Vehicle filters schema
export const vehicleFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  type: z.enum(['truck', 'van', 'semi_trailer', 'trailer', 'pickup', 'motorcycle']).optional(),
  search: z.string().optional(),
  expiring_documents: z.boolean().optional(),
})

// Export types
export type VehicleFormDataType = z.infer<typeof vehicleSchema>
export type VehicleFiltersFormData = z.infer<typeof vehicleFiltersSchema>
