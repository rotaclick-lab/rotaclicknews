import type { Database } from './database.types'

// Database types
type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

// Customer status enum
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export type CustomerStatus = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS]

// Status labels
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
}

// Status colors for badges
export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
}

// Customer type enum
export const CUSTOMER_TYPE = {
  INDIVIDUAL: 'individual',
  COMPANY: 'company',
} as const

export type CustomerType = (typeof CUSTOMER_TYPE)[keyof typeof CUSTOMER_TYPE]

// Customer type labels
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  individual: 'Pessoa Física',
  company: 'Pessoa Jurídica',
}

// Extended customer with relations
export interface CustomerWithRelations extends Customer {
  id: string
  name: string
  document: string
  customer_type: CustomerType
  email: string | null
  phone: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  notes: string | null
  status: CustomerStatus
  company_id: string
  created_at: string
  updated_at: string
  freights_count?: number
  total_freights_value?: number
  last_freight_date?: string
}

// Customer form data
export interface CustomerFormData {
  name: string
  document: string
  customer_type: CustomerType
  email: string | null
  phone: string
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  notes: string | null
  status: CustomerStatus
}

// Customer filters
export interface CustomerFilters {
  status?: CustomerStatus
  customer_type?: CustomerType
  city?: string
  state?: string
  search?: string
}

// List params
export interface CustomerListParams extends CustomerFilters {
  page?: number
  per_page?: number
  order_by?: 'name' | 'created_at' | 'city'
  order_direction?: 'asc' | 'desc'
}
