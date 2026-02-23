/**
 * Integração com BrasilAPI
 * API brasileira moderna e sem CORS para dados de CEP
 */

export interface BrasilAPIResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  gia: string
  ddd: string
  siafi: string
}

export interface BrasilAPIError {
  erro: boolean
}

/**
 * Busca informações de um CEP na BrasilAPI
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Promise com dados do CEP ou null se não encontrar
 */
export async function buscarCEP(cep: string): Promise<BrasilAPIResponse | null> {
  try {
    // Normalizar CEP para apenas dígitos
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      return null
    }

    // Usar BrasilAPI diretamente (sem CORS)
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RotaClick-Freight/1.0'
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000)
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

    // Converter para formato compatível
    return {
      cep: data.cep,
      logradouro: data.street || '',
      complemento: '',
      bairro: data.neighborhood || '',
      localidade: data.city,
      uf: data.state,
      gia: '',
      ddd: '',
      siafi: ''
    } as BrasilAPIResponse
  } catch (error) {
    console.error('Erro ao buscar CEP na BrasilAPI:', error)
    return null
  }
}

/**
 * Busca CEPs por cidade/estado (quando o CEP específico não é encontrado)
 * @param cidade - Nome da cidade
 * @param uf - Sigla do estado (2 letras)
 * @returns Promise com array de CEPs ou null
 */
export async function buscarCEPsPorCidade(cidade: string, uf: string): Promise<string[] | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${uf}/${cidade}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RotaClick-Freight/1.0'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    // Retorna os primeiros 10 CEPs encontrados
    return data.slice(0, 10).map((item: any) => item.cep).filter(Boolean)
  } catch (error) {
    console.error('Erro ao buscar CEPs por cidade:', error)
    return null
  }
}

/**
 * Verifica se um CEP pertence a uma cidade específica
 * @param cep - CEP a verificar
 * @param cidadeEsperada - Nome da cidade esperada
 * @param ufEsperado - UF esperada
 * @returns Promise boolean
 */
export async function verificarCidadeDoCEP(cep: string, cidadeEsperada: string, ufEsperado: string): Promise<boolean> {
  const dadosCEP = await buscarCEP(cep)
  
  if (!dadosCEP) {
    return false
  }

  // Comparação normalizada (ignora maiúsculas/minúsculas e acentos)
  const normalizar = (texto: string) => 
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const cidadeNormalizada = normalizar(dadosCEP.localidade)
  const esperadaNormalizada = normalizar(cidadeEsperada)
  const ufNormalizada = dadosCEP.uf.toLowerCase()
  const esperadaUfNormalizada = ufEsperado.toLowerCase()

  return cidadeNormalizada === esperadaNormalizada && ufNormalizada === esperadaUfNormalizada
}
