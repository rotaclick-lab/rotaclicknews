import type { Database } from './database.types'

// Database types
export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

// Driver status enum
export const DRIVER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_VACATION: 'on_vacation',
} as const

export type DriverStatus = (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS]

// Status labels
export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  on_vacation: 'De Férias',
}

// Status colors for badges
export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
  on_vacation: 'bg-blue-100 text-blue-800 border-blue-300',
}

// CNH Category enum
export const CNH_CATEGORY = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  AB: 'AB',
  AC: 'AC',
  AD: 'AD',
  AE: 'AE',
} as const

export type CNHCategory = (typeof CNH_CATEGORY)[keyof typeof CNH_CATEGORY]

// Extended driver with relations
export interface DriverWithRelations {
  id: string
  name: string
  cpf: string
  license_number: string
  license_category: CNHCategory
  license_expiry_date: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  status: DriverStatus
  company_id: string
  created_at: string
  updated_at: string
  freights_count?: number
  active_freights?: number
  last_freight_date?: string
}

// Driver form data
export interface DriverFormData {
  name: string
  cpf: string
  license_number: string
  license_category: CNHCategory
  license_expiry_date: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  status: DriverStatus
}

// Driver filters
export interface DriverFilters {
  status?: DriverStatus
  license_category?: CNHCategory
  city?: string
  state?: string
  search?: string
  expiring_license?: boolean
}

// Driver list params
export interface DriverListParams extends DriverFilters {
  page?: number
  per_page?: number
  order_by?: 'name' | 'created_at' | 'license_expiry_date'
  order?: 'asc' | 'desc'
}

// Driver statistics
export interface DriverStats {
  total: number
  active: number
  inactive: number
  on_vacation: number
  expiring_licenses: number
}
