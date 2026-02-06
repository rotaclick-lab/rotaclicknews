// Types from database (will be generated from Supabase)
export type ReturnFreight = {
  id: string
  company_id: string
  vehicle_id?: string | null
  origin_city: string
  origin_state: string
  origin_postal_code?: string | null
  destination_city: string
  destination_state: string
  destination_postal_code?: string | null
  vehicle_type: string
  available_date: string
  expiry_date: string
  status: string
  suggested_price?: number | null
  max_price?: number | null
  cargo_type?: string | null
  cargo_weight?: number | null
  cargo_volume?: number | null
  distance_km?: number | null
  notes?: string | null
  auto_accept_best?: boolean
  allow_counter_offers?: boolean
  created_at: string
  updated_at: string
}

export type ReturnFreightInsert = Omit<ReturnFreight, 'id' | 'created_at' | 'updated_at'>
export type ReturnFreightUpdate = Partial<ReturnFreightInsert>

export type Proposal = {
  id: string
  return_freight_id: string
  company_id: string
  vehicle_id?: string | null
  driver_id?: string | null
  proposed_price: number
  estimated_delivery_days: number
  status: string
  message?: string | null
  valid_until: string
  created_at: string
  updated_at: string
}

export type ProposalInsert = Omit<Proposal, 'id' | 'created_at' | 'updated_at'>
export type ProposalUpdate = Partial<ProposalInsert>

// Enums
export const RETURN_FREIGHT_STATUS = {
  AVAILABLE: 'available',
  IN_NEGOTIATION: 'in_negotiation',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export type ReturnFreightStatus = typeof RETURN_FREIGHT_STATUS[keyof typeof RETURN_FREIGHT_STATUS]

export const RETURN_FREIGHT_STATUS_LABELS: Record<ReturnFreightStatus, string> = {
  available: 'Disponível',
  in_negotiation: 'Em Negociação',
  accepted: 'Aceito',
  expired: 'Expirado',
  cancelled: 'Cancelado',
}

export const RETURN_FREIGHT_STATUS_COLORS: Record<ReturnFreightStatus, string> = {
  available: 'text-green-700 bg-green-50 border-green-200',
  in_negotiation: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  accepted: 'text-blue-700 bg-blue-50 border-blue-200',
  expired: 'text-gray-700 bg-gray-50 border-gray-200',
  cancelled: 'text-red-700 bg-red-50 border-red-200',
}

export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTER: 'counter',
  WITHDRAWN: 'withdrawn',
} as const

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS]

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
  counter: 'Contra-proposta',
  withdrawn: 'Retirada',
}

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  accepted: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-red-700 bg-red-50 border-red-200',
  counter: 'text-blue-700 bg-blue-50 border-blue-200',
  withdrawn: 'text-gray-700 bg-gray-50 border-gray-200',
}

// Extended types with relations
export interface ReturnFreightWithRelations extends ReturnFreight {
  companies?: {
    id: string
    name: string
  }
  vehicles?: {
    id: string
    plate: string
    type: string
  }
  proposals_count?: number
  best_proposal?: number | null
  average_proposal?: number | null
}

export interface ProposalWithRelations extends Proposal {
  return_freights?: ReturnFreight
  companies?: {
    id: string
    name: string
  }
}

// Form data types
export interface ReturnFreightFormData {
  origin_city: string
  origin_state: string
  origin_postal_code?: string | null
  destination_city: string
  destination_state: string
  destination_postal_code?: string | null
  vehicle_id?: string | null
  vehicle_type: string
  available_date: string
  expiry_date: string
  suggested_price?: number | null
  max_price?: number | null
  cargo_type?: string | null
  cargo_weight?: number | null
  cargo_volume?: number | null
  distance_km?: number | null
  notes?: string | null
  auto_accept_best?: boolean
  allow_counter_offers?: boolean
}

export interface ProposalFormData {
  return_freight_id: string
  proposed_price: number
  estimated_delivery_days: number
  vehicle_id?: string | null
  driver_id?: string | null
  message?: string | null
  valid_until: string
}

// Filter types
export interface ReturnFreightFilters {
  status?: ReturnFreightStatus | 'all'
  origin_state?: string
  destination_state?: string
  vehicle_type?: string
  min_date?: string
  max_date?: string
  max_distance?: number
}

export interface ProposalFilters {
  status?: ProposalStatus | 'all'
  return_freight_id?: string
  min_price?: number
  max_price?: number
}

// List params
export interface ReturnFreightListParams {
  page?: number
  per_page?: number
  order_by?: string
  order?: 'asc' | 'desc'
  filters?: ReturnFreightFilters
  search?: string
}

export interface ProposalListParams {
  page?: number
  per_page?: number
  order_by?: string
  order?: 'asc' | 'desc'
  filters?: ProposalFilters
  search?: string
}

// Stats
export interface MarketplaceStats {
  total_return_freights: number
  available_count: number
  in_negotiation_count: number
  accepted_count: number
  total_proposals: number
  pending_proposals: number
  accepted_proposals: number
  average_match_time_hours: number
  total_savings: number
}

// Matching types
export interface MatchingSuggestion {
  return_freight: ReturnFreightWithRelations
  compatibility_score: number
  distance_match: boolean
  date_match: boolean
  vehicle_match: boolean
  price_match: boolean
  reasons: string[]
}
