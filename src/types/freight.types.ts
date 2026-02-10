import type { Database } from './database.types'

// Database types
export type Freight = Database['public']['Tables']['freights']['Row']
export type FreightInsert = Database['public']['Tables']['freights']['Insert']
export type FreightUpdate = Database['public']['Tables']['freights']['Update']

export type FreightItem = Database['public']['Tables']['freight_items']['Row']
export type FreightItemInsert = Database['public']['Tables']['freight_items']['Insert']
export type FreightItemUpdate = Database['public']['Tables']['freight_items']['Update']

export type FreightTracking = Database['public']['Tables']['freight_tracking']['Row']
export type FreightTrackingInsert = Database['public']['Tables']['freight_tracking']['Insert']

// Freight status enum
export const FREIGHT_STATUS = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export type FreightStatus = (typeof FREIGHT_STATUS)[keyof typeof FREIGHT_STATUS]

// Status labels
export const FREIGHT_STATUS_LABELS: Record<FreightStatus, string> = {
  pending: 'Pendente',
  in_transit: 'Em Trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

// Status colors for badges
export const FREIGHT_STATUS_COLORS: Record<FreightStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_transit: 'bg-brand-100 text-brand-800 border-brand-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

// Extended freight with relations
export interface FreightWithRelations extends Freight {
  // Helper computed fields for display
  freight_number?: string
  origin_city?: string
  origin_state?: string
  origin_postal_code?: string
  destination_city?: string
  destination_state?: string
  destination_postal_code?: string
  
  customer?: {
    id: string
    name: string
    document: string
    email?: string
    phone?: string
  }
  driver?: {
    id: string
    name: string
    phone: string
    license_number?: string
  }
  vehicle?: {
    id: string
    plate: string
    model: string
    type?: string
  }
  items?: FreightItem[]
  tracking?: FreightTracking[]
}

// Freight form data
export interface FreightFormData {
  customer_id: string
  driver_id?: string | null
  vehicle_id?: string | null
  origin_address: string
  origin_city: string
  origin_state: string
  origin_postal_code: string
  destination_address: string
  destination_city: string
  destination_state: string
  destination_postal_code: string
  pickup_date?: string | null
  delivery_date?: string | null
  estimated_delivery_date?: string | null
  freight_value: number
  additional_costs?: number
  discount?: number
  total_value: number
  payment_method?: string | null
  notes?: string | null
  status: FreightStatus
  items: FreightItemFormData[]
}

// Freight item form data
export interface FreightItemFormData {
  description: string
  quantity: number
  weight: number
  volume?: number | null
  value: number
  notes?: string | null
}

// Freight filters
export interface FreightFilters {
  status?: FreightStatus
  customer_id?: string
  driver_id?: string
  vehicle_id?: string
  origin_city?: string
  destination_city?: string
  date_from?: string
  date_to?: string
  search?: string
}

// Freight list params
export interface FreightListParams extends FreightFilters {
  page?: number
  per_page?: number
  order_by?: 'created_at' | 'pickup_date' | 'delivery_date' | 'total_value'
  order?: 'asc' | 'desc'
}

// Freight statistics
export interface FreightStats {
  total: number
  pending: number
  in_transit: number
  delivered: number
  cancelled: number
  total_value: number
  average_value: number
}
