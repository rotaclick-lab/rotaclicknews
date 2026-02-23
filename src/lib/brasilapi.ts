/**
 * Integração com BrasilAPI
 * API brasileira moderna e sem CORS para dados de CEP
 */

export interface BrasilAPIResponse {
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  service: string
  location: {
    type: string
    coordinates: {
      longitude: string
      latitude: string
    }
  }
}

export interface BrasilAPIError {
  name: string
  message: string
  type: string
}

/**
 * Busca informações de um CEP na BrasilAPI
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Promise com dados do CEP ou null se não encontrar
 */
export async function buscarCEPBrasilAPI(cep: string): Promise<BrasilAPIResponse | null> {
  try {
    // Normalizar CEP para apenas dígitos
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      return null
    }

    // Usar BrasilAPI - sem problemas de CORS
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RotaClick-Freight/1.0'
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('BrasilAPI - CEP não encontrado:', cep)
      }
      return null
    }

    const data = await response.json()

    // BrasilAPI retorna erro com status 404, mas também pode retornar objeto de erro
    if (data && typeof data === 'object' && 'message' in data) {
      console.log('BrasilAPI - Erro:', data.message)
      return null
    }

    console.log('BrasilAPI - CEP encontrado:', { cidade: data.city, uf: data.state })
    return data as BrasilAPIResponse
  } catch (error) {
    console.error('Erro ao buscar CEP na BrasilAPI:', error)
    return null
  }
}

/**
 * Converte resposta BrasilAPI para formato ViaCEP (compatibilidade)
 */
export function converterBrasilAPIParaViaCEP(brasilAPI: BrasilAPIResponse) {
  return {
    cep: brasilAPI.cep,
    logradouro: brasilAPI.street || '',
    complemento: '',
    bairro: brasilAPI.neighborhood || '',
    localidade: brasilAPI.city,
    uf: brasilAPI.state,
    gia: '',
    ddd: '',
    siafi: ''
  }
}
