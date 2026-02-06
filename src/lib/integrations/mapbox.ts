import type { MapboxGeocode, MapboxRoute } from '@/types/integration.types'

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const GEOCODING_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const DIRECTIONS_API_URL = 'https://api.mapbox.com/directions/v5/mapbox'

export class MapboxClient {
  private accessToken: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken || MAPBOX_ACCESS_TOKEN

    if (!this.accessToken) {
      console.warn('Mapbox access token not configured')
    }
  }

  /**
   * Geocoding: converte endereço em coordenadas
   */
  async geocode(query: string, options?: {
    country?: string
    limit?: number
    types?: string[]
  }): Promise<MapboxGeocode[]> {
    try {
      if (!this.accessToken) {
        throw new Error('Mapbox access token not configured')
      }

      const params = new URLSearchParams({
        access_token: this.accessToken,
        limit: String(options?.limit || 5),
        language: 'pt',
      })

      if (options?.country) {
        params.append('country', options.country)
      }

      if (options?.types && options.types.length > 0) {
        params.append('types', options.types.join(','))
      }

      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `${GEOCODING_API_URL}/${encodedQuery}.json?${params}`,
        {
          method: 'GET',
          next: { revalidate: 86400 },
        }
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()

      return data.features || []
    } catch (error) {
      console.error('Mapbox geocode error:', error)
      return []
    }
  }

  /**
   * Reverse Geocoding: converte coordenadas em endereço
   */
  async reverseGeocode(lng: number, lat: number): Promise<MapboxGeocode | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Mapbox access token not configured')
      }

      const params = new URLSearchParams({
        access_token: this.accessToken,
        language: 'pt',
      })

      const response = await fetch(
        `${GEOCODING_API_URL}/${lng},${lat}.json?${params}`,
        {
          method: 'GET',
          next: { revalidate: 86400 },
        }
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        return null
      }

      return data.features[0]
    } catch (error) {
      console.error('Mapbox reverse geocode error:', error)
      return null
    }
  }

  /**
   * Calcula rota entre coordenadas
   */
  async getRoute(
    coordinates: Array<[number, number]>,
    profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving',
    options?: {
      steps?: boolean
      geometries?: 'geojson' | 'polyline' | 'polyline6'
      overview?: 'full' | 'simplified' | 'false'
    }
  ): Promise<MapboxRoute | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Mapbox access token not configured')
      }

      const coordsString = coordinates
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';')

      const params = new URLSearchParams({
        access_token: this.accessToken,
        steps: String(options?.steps ?? true),
        geometries: options?.geometries || 'geojson',
        overview: options?.overview || 'full',
        language: 'pt',
      })

      const response = await fetch(
        `${DIRECTIONS_API_URL}/${profile}/${coordsString}?${params}`,
        {
          method: 'GET',
          next: { revalidate: 3600 },
        }
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        return null
      }

      return data.routes[0]
    } catch (error) {
      console.error('Mapbox route error:', error)
      return null
    }
  }

  /**
   * Gera URL da tile do mapa estático
   */
  getStaticMapUrl(
    center: [number, number], // [lng, lat]
    zoom: number = 13,
    options?: {
      width?: number
      height?: number
      bearing?: number
      pitch?: number
      markers?: Array<{
        coordinates: [number, number]
        color?: string
        label?: string
      }>
      path?: Array<[number, number]>
    }
  ): string {
    const width = options?.width || 600
    const height = options?.height || 400
    const bearing = options?.bearing || 0
    const pitch = options?.pitch || 0

    const overlays: string[] = []

    // Add markers
    if (options?.markers && options.markers.length > 0) {
      options.markers.forEach(marker => {
        const color = marker.color || 'red'
        const label = marker.label || ''
        const [lng, lat] = marker.coordinates
        overlays.push(`pin-s-${label}+${color}(${lng},${lat})`)
      })
    }

    // Add path
    if (options?.path && options.path.length > 0) {
      const pathString = options.path
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(',')
      overlays.push(`path-5+f44-0.5(${encodeURIComponent(pathString)})`)
    }

    const overlayString = overlays.length > 0 ? `${overlays.join(',')}/` : ''

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${overlayString}${center[0]},${center[1]},${zoom},${bearing},${pitch}/${width}x${height}@2x?access_token=${this.accessToken}`
  }
}

// Export singleton instance
export const mapbox = new MapboxClient()
