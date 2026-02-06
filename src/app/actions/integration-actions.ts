'use server'

import { viaCEP } from '@/lib/integrations/viacep'
import { googleMaps } from '@/lib/integrations/google-maps'
import { mapbox } from '@/lib/integrations/mapbox'
import { correios } from '@/lib/integrations/correios'

// ===== ViaCEP Actions =====

export async function searchAddressByCEP(cep: string) {
  try {
    const address = await viaCEP.getAddress(cep)
    
    if (!address) {
      return { success: false, error: 'CEP não encontrado' }
    }

    return { success: true, data: address }
  } catch (error) {
    console.error('Error searching address by CEP:', error)
    return { success: false, error: 'Erro ao buscar endereço' }
  }
}

export async function searchAddressByLocation(
  uf: string,
  city: string,
  street: string
) {
  try {
    const addresses = await viaCEP.searchAddress(uf, city, street)
    
    if (addresses.length === 0) {
      return { success: false, error: 'Nenhum endereço encontrado' }
    }

    return { success: true, data: addresses }
  } catch (error) {
    console.error('Error searching address by location:', error)
    return { success: false, error: 'Erro ao buscar endereços' }
  }
}

// ===== Google Maps Actions =====

export async function calculateRoute(
  origin: string,
  destination: string,
  options?: {
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    avoid?: ('tolls' | 'highways' | 'ferries')[]
  }
) {
  try {
    const route = await googleMaps.getRoute(origin, destination, options)
    
    if (!route) {
      return { success: false, error: 'Rota não encontrada' }
    }

    return { success: true, data: route }
  } catch (error) {
    console.error('Error calculating route:', error)
    return { success: false, error: 'Erro ao calcular rota' }
  }
}

export async function geocodeAddress(address: string) {
  try {
    const result = await googleMaps.geocode(address)
    
    if (!result) {
      return { success: false, error: 'Endereço não encontrado' }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return { success: false, error: 'Erro ao buscar coordenadas' }
  }
}

export async function reverseGeocodeCoordinates(lat: number, lng: number) {
  try {
    const address = await googleMaps.reverseGeocode(lat, lng)
    
    if (!address) {
      return { success: false, error: 'Endereço não encontrado' }
    }

    return { success: true, data: address }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return { success: false, error: 'Erro ao buscar endereço' }
  }
}

export async function calculateDistanceMatrix(
  origins: string[],
  destinations: string[],
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
) {
  try {
    const matrix = await googleMaps.getDistanceMatrix(origins, destinations, mode)
    
    if (!matrix) {
      return { success: false, error: 'Erro ao calcular distâncias' }
    }

    return { success: true, data: matrix }
  } catch (error) {
    console.error('Error calculating distance matrix:', error)
    return { success: false, error: 'Erro ao calcular distâncias' }
  }
}

// ===== Mapbox Actions =====

export async function mapboxGeocode(query: string, options?: {
  country?: string
  limit?: number
}) {
  try {
    const results = await mapbox.geocode(query, {
      country: options?.country || 'BR',
      limit: options?.limit || 5,
    })
    
    if (results.length === 0) {
      return { success: false, error: 'Nenhum resultado encontrado' }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error with Mapbox geocoding:', error)
    return { success: false, error: 'Erro ao buscar localização' }
  }
}

export async function mapboxCalculateRoute(
  coordinates: Array<[number, number]>,
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling'
) {
  try {
    const route = await mapbox.getRoute(coordinates, profile)
    
    if (!route) {
      return { success: false, error: 'Rota não encontrada' }
    }

    return { success: true, data: route }
  } catch (error) {
    console.error('Error calculating Mapbox route:', error)
    return { success: false, error: 'Erro ao calcular rota' }
  }
}

// ===== Correios Actions =====

export async function trackPackage(trackingCode: string) {
  try {
    const tracking = await correios.track(trackingCode)
    
    if (!tracking) {
      return { success: false, error: 'Código de rastreamento não encontrado' }
    }

    return { success: true, data: tracking }
  } catch (error) {
    console.error('Error tracking package:', error)
    return { success: false, error: 'Erro ao rastrear encomenda' }
  }
}

export async function calculateShippingCost(
  originCEP: string,
  destinationCEP: string,
  weight: number,
  options?: {
    serviceType?: 'PAC' | 'SEDEX' | 'SEDEX10'
    declaredValue?: number
  }
) {
  try {
    const shipping = await correios.calculateShipping(
      originCEP,
      destinationCEP,
      weight,
      options
    )
    
    if (!shipping) {
      return { success: false, error: 'Erro ao calcular frete' }
    }

    return { success: true, data: shipping }
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return { success: false, error: 'Erro ao calcular frete' }
  }
}
