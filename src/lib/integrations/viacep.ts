import type { ViaCEPAddress } from '@/types/integration.types'

const VIACEP_BASE_URL = 'https://viacep.com.br/ws'

export class ViaCEPClient {
  /**
   * Busca endereço por CEP
   */
  async getAddress(cep: string): Promise<ViaCEPAddress | null> {
    try {
      // Remove non-numeric characters
      const cleanCEP = cep.replace(/\D/g, '')

      if (cleanCEP.length !== 8) {
        throw new Error('CEP inválido')
      }

      const response = await fetch(`${VIACEP_BASE_URL}/${cleanCEP}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      })

      if (!response.ok) {
        throw new Error(`ViaCEP API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.erro) {
        return null
      }

      return data as ViaCEPAddress
    } catch (error) {
      console.error('ViaCEP error:', error)
      return null
    }
  }

  /**
   * Busca endereço por UF, cidade e logradouro
   */
  async searchAddress(uf: string, city: string, street: string): Promise<ViaCEPAddress[]> {
    try {
      const cleanUF = uf.trim()
      const cleanCity = encodeURIComponent(city.trim())
      const cleanStreet = encodeURIComponent(street.trim())

      if (cleanStreet.length < 3) {
        throw new Error('Logradouro deve ter pelo menos 3 caracteres')
      }

      const response = await fetch(
        `${VIACEP_BASE_URL}/${cleanUF}/${cleanCity}/${cleanStreet}/json/`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 86400 },
        }
      )

      if (!response.ok) {
        throw new Error(`ViaCEP API error: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        return data as ViaCEPAddress[]
      }

      return []
    } catch (error) {
      console.error('ViaCEP search error:', error)
      return []
    }
  }

  /**
   * Valida formato de CEP
   */
  isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.length === 8
  }

  /**
   * Formata CEP (12345678 -> 12345-678)
   */
  formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) return cep
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`
  }
}

// Export singleton instance
export const viaCEP = new ViaCEPClient()
