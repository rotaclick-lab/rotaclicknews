// ViaCEP Types
export interface ViaCEPAddress {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

// Google Maps Types
export interface GoogleMapsRoute {
  distance: {
    text: string
    value: number // meters
  }
  duration: {
    text: string
    value: number // seconds
  }
  origin: string
  destination: string
  polyline: string
  steps: Array<{
    distance: { text: string; value: number }
    duration: { text: string; value: number }
    html_instructions: string
    start_location: { lat: number; lng: number }
    end_location: { lat: number; lng: number }
  }>
}

export interface GoogleMapsGeocode {
  lat: number
  lng: number
  formatted_address: string
  place_id: string
}

// Mapbox Types
export interface MapboxGeocode {
  id: string
  type: string
  place_name: string
  center: [number, number] // [lng, lat]
  geometry: {
    type: string
    coordinates: [number, number]
  }
  context: Array<{
    id: string
    text: string
  }>
}

export interface MapboxRoute {
  distance: number // meters
  duration: number // seconds
  geometry: {
    coordinates: Array<[number, number]>
    type: string
  }
  weight: number
  weight_name: string
  legs: Array<{
    distance: number
    duration: number
    steps: Array<{
      distance: number
      duration: number
      geometry: any
      name: string
      mode: string
    }>
  }>
}

// Correios Types
export interface CorreiosTracking {
  code: string
  events: Array<{
    date: string
    time: string
    location: string
    status: string
    description: string
  }>
  delivered: boolean
  estimatedDelivery?: string
}

// Payment Types
export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  client_secret: string
  metadata: Record<string, any>
}

export interface AsaasPayment {
  id: string
  value: number
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE'
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCode?: string
}

// Webhook Types
export interface WebhookEvent {
  id: string
  type: string
  data: any
  created_at: string
  processed: boolean
}

export interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  active: boolean
  secret: string
}
