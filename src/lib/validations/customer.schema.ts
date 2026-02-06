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

/**
 * Validate Brazilian CNPJ
 */
function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  let length = cleaned.length - 2
  let numbers = cleaned.substring(0, length)
  const digits = cleaned.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  
  length = length + 1
  numbers = cleaned.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  
  return true
}

// Customer create/update schema
export const customerSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  
  document: z
    .string()
    .min(11, 'Documento inválido')
    .refine(
      (doc) => {
        const cleaned = doc.replace(/\D/g, '')
        return cleaned.length === 11 || cleaned.length === 14
      },
      'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)'
    )
    .refine(
      (doc) => {
        const cleaned = doc.replace(/\D/g, '')
        if (cleaned.length === 11) return isValidCPF(cleaned)
        if (cleaned.length === 14) return isValidCNPJ(cleaned)
        return false
      },
      'CPF ou CNPJ inválido'
    ),
  
  customer_type: z.enum(['individual', 'company'], {
    required_error: 'Selecione o tipo de cliente',
  }),
  
  email: z
    .string()
    .email('Email inválido')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  city: z
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .toUpperCase()
    .nullable()
    .optional()
    .or(z.literal('')),
  
  postal_code: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 12345-678)')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .nullable()
    .optional()
    .or(z.literal('')),
  
  status: z.enum(['active', 'inactive']),
})

// Customer filters schema
export const customerFiltersSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  customer_type: z.enum(['individual', 'company']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
})

// Export types
export type CustomerFormData = z.infer<typeof customerSchema>
export type CustomerFiltersFormData = z.infer<typeof customerFiltersSchema>
