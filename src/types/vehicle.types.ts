import type { Database } from './database.types'

// Database types
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

// Vehicle status enum
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const

export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS]

// Status labels
export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  maintenance: 'Em Manutenção',
}

// Status colors for badges
export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-300',
}

// Vehicle type enum
export const VEHICLE_TYPE = {
  TRUCK: 'truck',
  VAN: 'van',
  SEMI_TRAILER: 'semi_trailer',
  TRAILER: 'trailer',
  PICKUP: 'pickup',
  MOTORCYCLE: 'motorcycle',
} as const

export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE]

// Vehicle type labels
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  truck: 'Caminhão',
  van: 'Van/Furgão',
  semi_trailer: 'Carreta (Semi-reboque)',
  trailer: 'Reboque',
  pickup: 'Picape',
  motorcycle: 'Moto',
}

// Extended vehicle with relations
export interface VehicleWithRelations {
  id: string
  plate: string
  model: string
  brand: string
  year: number
  type: VehicleType
  capacity_kg: number | null
  capacity_m3: number | null
  fuel_type: string | null
  color: string | null
  chassis_number: string | null
  renavam: string | null
  crlv_expiry_date: string | null
  ipva_expiry_date: string | null
  insurance_expiry_date: string | null
  insurance_company: string | null
  insurance_policy_number: string | null
  last_maintenance_date: string | null
  last_maintenance_km: number | null
  notes: string | null
  status: VehicleStatus
  company_id: string
  created_at: string
  updated_at: string
  freights_count?: number
  active_freights?: number
  last_freight_date?: string | null
  total_km?: number
}

// Vehicle form data
export interface VehicleFormData {
  plate: string
  model: string
  brand: string
  year: number
  type: VehicleType
  capacity_kg?: number | null
  capacity_m3?: number | null
  fuel_type?: string | null
  color?: string | null
  chassis_number?: string | null
  renavam?: string | null
  crlv_expiry_date?: string | null
  ipva_expiry_date?: string | null
  insurance_expiry_date?: string | null
  insurance_company?: string | null
  insurance_policy_number?: string | null
  last_maintenance_date?: string | null
  last_maintenance_km?: number | null
  notes?: string | null
  status: VehicleStatus
}

// Vehicle filters
export interface VehicleFilters {
  status?: VehicleStatus
  type?: VehicleType
  search?: string
  expiring_documents?: boolean
}

// Vehicle list params
export interface VehicleListParams extends VehicleFilters {
  page?: number
  per_page?: number
  order_by?: 'plate' | 'model' | 'created_at'
  order?: 'asc' | 'desc'
}

// Vehicle statistics
export interface VehicleStats {
  total: number
  active: number
  inactive: number
  maintenance: number
  expiring_documents: number
}
