import type { ViaCEPAddress } from '@/types/integration.types'

const BRASILAPI_BASE_URL = 'https://brasilapi.com.br/api/cep/v2'

export class ViaCEPClient {
  /**
   * Busca endereço por CEP via BrasilAPI
   */
  async getAddress(cep: string): Promise<ViaCEPAddress | null> {
    try {
      const cleanCEP = cep.replace(/\D/g, '')

      if (cleanCEP.length !== 8) {
        throw new Error('CEP inválido')
      }

      const response = await fetch(`${BRASILAPI_BASE_URL}/${cleanCEP}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      if (!data.city) {
        return null
      }

      // Converter para formato ViaCEPAddress (compatibilidade)
      return {
        cep: data.cep,
        logradouro: data.street || '',
        complemento: '',
        bairro: data.neighborhood || '',
        localidade: data.city,
        uf: data.state,
        gia: '',
        ddd: '',
        siafi: '',
      } as ViaCEPAddress
    } catch (error) {
      console.error('BrasilAPI error:', error)
      return null
    }
  }

  /**
   * Busca por logradouro não suportada na BrasilAPI - retorna vazio
   */
  async searchAddress(_uf: string, _city: string, _street: string): Promise<ViaCEPAddress[]> {
    return []
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
