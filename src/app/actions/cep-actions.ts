'use server'

export interface AddressData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function searchAddressByCEP(cep: string) {
  const cleanCEP = cep.replace(/\D/g, '')

  if (cleanCEP.length !== 8) {
    return { success: false, error: 'CEP inválido. Deve conter 8 dígitos.' }
  }

  try {
    // Usar ViaCEP (API pública e gratuita)
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
      cache: 'force-cache',
    })

    if (!response.ok) {
      return { success: false, error: 'Erro ao consultar CEP. Tente novamente.' }
    }

    const data: AddressData = await response.json()

    if (data.erro) {
      return { success: false, error: 'CEP não encontrado.' }
    }

    return {
      success: true,
      data: {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
      }
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return { success: false, error: 'Erro ao conectar com o serviço de CEP.' }
  }
}
