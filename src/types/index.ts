// =====================================================
// ROTACLICK TYPES
// =====================================================

// Re-export database types
export type { Database, Tables, Enums } from './database.types'

// Import for internal use
import type { Database } from './database.types'

// =====================================================
// TABLE TYPES
// =====================================================

// Helper types for each table
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Freight = Database['public']['Tables']['freights']['Row']
export type FreightInsert = Database['public']['Tables']['freights']['Insert']
export type FreightUpdate = Database['public']['Tables']['freights']['Update']

export type FreightItem = Database['public']['Tables']['freight_items']['Row']
export type FreightItemInsert = Database['public']['Tables']['freight_items']['Insert']
export type FreightItemUpdate = Database['public']['Tables']['freight_items']['Update']

export type MarketplaceOffer = Database['public']['Tables']['marketplace_offers']['Row']
export type MarketplaceOfferInsert = Database['public']['Tables']['marketplace_offers']['Insert']
export type MarketplaceOfferUpdate = Database['public']['Tables']['marketplace_offers']['Update']

export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row']
export type FinancialTransactionInsert = Database['public']['Tables']['financial_transactions']['Insert']
export type FinancialTransactionUpdate = Database['public']['Tables']['financial_transactions']['Update']

export type FreightTracking = Database['public']['Tables']['freight_tracking']['Row']
export type FreightTrackingInsert = Database['public']['Tables']['freight_tracking']['Insert']

// =====================================================
// ENUM TYPES
// =====================================================

export type FreightStatus = Database['public']['Enums']['freight_status']
export type TransactionType = Database['public']['Enums']['transaction_type']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type VehicleStatus = Database['public']['Enums']['vehicle_status']
export type VehicleType = Database['public']['Enums']['vehicle_type']
export type UserRole = Database['public']['Enums']['user_role']

// =====================================================
// JSONB TYPES (para campos JSONB do schema)
// =====================================================

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude?: number
  longitude?: number
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
}

export interface CompanySettings {
  theme?: 'light' | 'dark'
  notifications?: boolean
  language?: string
  timezone?: string
  [key: string]: any
}

// =====================================================
// EXTENDED TYPES (com relacionamentos)
// =====================================================

export interface FreightWithRelations extends Freight {
  customer?: Customer
  driver?: Driver
  vehicle?: Vehicle
  items?: FreightItem[]
  tracking?: FreightTracking[]
}

export interface DriverWithUser extends Driver {
  user?: User
}

export interface UserWithCompany extends User {
  company?: Company
}

export interface MarketplaceOfferWithFreight extends MarketplaceOffer {
  freight?: Freight
  offering_company?: Company
}

export interface FinancialTransactionWithFreight extends FinancialTransaction {
  freight?: Freight
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// =====================================================
// FORM TYPES
// =====================================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  fullName: string
  companyName: string
  companyDocument: string
  phone?: string
}

export interface FreightForm {
  customer_id: string
  driver_id?: string
  vehicle_id?: string
  origin: Address
  destination: Address
  weight_kg: number
  volume_m3?: number
  description?: string
  freight_value: number
  additional_costs?: number
  discount?: number
  scheduled_date: string
  notes?: string
  items?: Omit<FreightItemInsert, 'freight_id'>[]
}

export interface DriverForm {
  full_name: string
  cpf: string
  cnh: string
  cnh_category: string
  phone: string
  email?: string
  address?: Address
}

export interface VehicleForm {
  license_plate: string
  type: VehicleType
  brand: string
  model: string
  year: number
  color?: string
  capacity_kg: number
  capacity_m3?: number
}

export interface CustomerForm {
  name: string
  document: string
  email?: string
  phone: string
  address?: Address
  notes?: string
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface DashboardStats {
  totalFreights: number
  activeFreights: number
  deliveredFreights: number
  totalRevenue: number
  monthlyRevenue: number
  pendingPayments: number
  activeVehicles: number
  activeDrivers: number
}

export interface FreightStatusCount {
  status: FreightStatus
  count: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
  profit: number
}
