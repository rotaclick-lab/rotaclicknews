import { z } from 'zod'

/**
 * Validate Brazilian CPF
 */
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false
  
  return true
}

// Driver create/update schema
export const driverSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  
  cpf: z
    .string()
    .min(11, 'CPF inválido')
    .refine(
      (cpf) => {
        const cleaned = cpf.replace(/\D/g, '')
        return cleaned.length === 11
      },
      'CPF deve ter 11 dígitos'
    )
    .refine(
      (cpf) => {
        const cleaned = cpf.replace(/\D/g, '')
        return isValidCPF(cleaned)
      },
      'CPF inválido'
    ),
  
  license_number: z
    .string()
    .min(11, 'Número da CNH deve ter no mínimo 11 dígitos')
    .max(11, 'Número da CNH deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Número da CNH deve conter apenas dígitos'),
  
  license_category: z.enum(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'], {
    required_error: 'Selecione a categoria da CNH',
  }),
  
  license_expiry_date: z
    .string()
    .nullable()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const expiryDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return expiryDate >= today
      },
      'A CNH não pode estar vencida'
    )
    .transform((val) => val || null),
  
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  email: z
    .string()
    .email('Email inválido')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  address: z
    .string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  city: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .toUpperCase()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  postal_code: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 12345-678)')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  emergency_contact_name: z
    .string()
    .max(200, 'Nome do contato de emergência deve ter no máximo 200 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  emergency_contact_phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || null),
  
  status: z.enum(['active', 'inactive', 'on_vacation']),
})

// Driver filters schema
export const driverFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'on_vacation']).optional(),
  license_category: z.enum(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  expiring_license: z.boolean().optional(),
})

// Export types
export type DriverFormDataType = z.infer<typeof driverSchema>
export type DriverFiltersFormData = z.infer<typeof driverFiltersSchema>
