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

    // Usar proxy interno para evitar CORS (browser) ou BrasilAPI direto (server)
    const isServer = typeof window === 'undefined'
    const url = isServer
      ? `https://brasilapi.com.br/api/cep/v2/${cepLimpo}`
      : `/api/viacep/${cepLimpo}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.log('CEP não encontrado:', cep)
      return null
    }

    const data = await response.json()

    if (data && typeof data === 'object' && 'message' in data) {
      return null
    }

    // Proxy retorna formato ViaCEP; BrasilAPI direto retorna city/state
    const logradouro = data.logradouro ?? data.street ?? ''
    const bairro = data.bairro ?? data.neighborhood ?? ''
    const localidade = data.localidade ?? data.city ?? ''
    const uf = data.uf ?? data.state ?? ''

    console.log('CEP encontrado:', { localidade, uf })

    return {
      cep: data.cep,
      logradouro,
      complemento: data.complemento || '',
      bairro,
      localidade,
      uf,
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
    // BrasilAPI não tem busca por cidade, retorna null para fallback
    // Usar a rota de busca por CEP individual
    console.log('BrasilAPI - busca por cidade não suportada, usando fallback:', { cidade, uf })
    return null
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
