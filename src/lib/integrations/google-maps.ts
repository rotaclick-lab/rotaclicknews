import type { GoogleMapsRoute, GoogleMapsGeocode } from '@/types/integration.types'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ''
const DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json'
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export class GoogleMapsClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured')
    }
  }

  /**
   * Calcula rota entre origem e destino
   */
  async getRoute(
    origin: string,
    destination: string,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
      waypoints?: string[]
      avoid?: ('tolls' | 'highways' | 'ferries')[]
    }
  ): Promise<GoogleMapsRoute | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured')
      }

      const params = new URLSearchParams({
        origin,
        destination,
        key: this.apiKey,
        mode: options?.mode || 'driving',
        language: 'pt-BR',
        units: 'metric',
      })

      if (options?.waypoints && options.waypoints.length > 0) {
        params.append('waypoints', options.waypoints.join('|'))
      }

      if (options?.avoid && options.avoid.length > 0) {
        params.append('avoid', options.avoid.join('|'))
      }

      const response = await fetch(`${DIRECTIONS_API_URL}?${params}`, {
        method: 'GET',
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        console.error('Google Maps route not found:', data.status)
        return null
      }

      const route = data.routes[0]
      const leg = route.legs[0]

      return {
        distance: leg.distance,
        duration: leg.duration,
        origin: leg.start_address,
        destination: leg.end_address,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          html_instructions: step.html_instructions,
          start_location: step.start_location,
          end_location: step.end_location,
        })),
      }
    } catch (error) {
      console.error('Google Maps route error:', error)
      return null
    }
  }

  /**
   * Geocoding: converte endereço em coordenadas
   */
  async geocode(address: string): Promise<GoogleMapsGeocode | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured')
      }

      const params = new URLSearchParams({
        address,
        key: this.apiKey,
        language: 'pt-BR',
      })

      const response = await fetch(`${GEOCODING_API_URL}?${params}`, {
        method: 'GET',
        next: { revalidate: 86400 }, // Cache for 24 hours
      })

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      const result = data.results[0]

      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
      }
    } catch (error) {
      console.error('Google Maps geocode error:', error)
      return null
    }
  }

  /**
   * Reverse Geocoding: converte coordenadas em endereço
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured')
      }

      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        language: 'pt-BR',
      })

      const response = await fetch(`${GEOCODING_API_URL}?${params}`, {
        method: 'GET',
        next: { revalidate: 86400 },
      })

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      return data.results[0].formatted_address
    } catch (error) {
      console.error('Google Maps reverse geocode error:', error)
      return null
    }
  }

  /**
   * Calcula distância entre múltiplos pontos
   */
  async getDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<Array<Array<{ distance: number; duration: number }>> | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not configured')
      }

      const params = new URLSearchParams({
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        mode,
        key: this.apiKey,
        language: 'pt-BR',
        units: 'metric',
      })

      const response = await fetch(`${DISTANCE_MATRIX_API_URL}?${params}`, {
        method: 'GET',
        next: { revalidate: 3600 },
      })

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK') {
        return null
      }

      return data.rows.map((row: any) =>
        row.elements.map((element: any) => ({
          distance: element.distance?.value || 0,
          duration: element.duration?.value || 0,
        }))
      )
    } catch (error) {
      console.error('Google Maps distance matrix error:', error)
      return null
    }
  }

  /**
   * Gera URL estática do mapa
   */
  getStaticMapUrl(
    center: { lat: number; lng: number },
    markers?: Array<{ lat: number; lng: number; label?: string }>,
    options?: {
      zoom?: number
      width?: number
      height?: number
      maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
    }
  ): string {
    const params = new URLSearchParams({
      center: `${center.lat},${center.lng}`,
      zoom: String(options?.zoom || 13),
      size: `${options?.width || 600}x${options?.height || 400}`,
      maptype: options?.maptype || 'roadmap',
      key: this.apiKey,
    })

    if (markers && markers.length > 0) {
      markers.forEach((marker) => {
        const label = marker.label ? `label:${marker.label}|` : ''
        params.append('markers', `${label}${marker.lat},${marker.lng}`)
      })
    }

    return `https://maps.googleapis.com/maps/api/staticmap?${params}`
  }
}

// Export singleton instance
export const googleMaps = new GoogleMapsClient()
