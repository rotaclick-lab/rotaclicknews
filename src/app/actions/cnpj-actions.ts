'use server'

/**
 * Lista de CNAEs permitidos para transportadoras (Grupo 49.30-2)
 * 4930-2/01: Transporte rodoviário de carga, exceto produtos perigosos e mudanças, municipal.
 * 4930-2/02: Transporte rodoviário de carga, exceto produtos perigosos e mudanças, intermunicipal, interestadual e internacional.
 * 4930-2/03: Transporte rodoviário de produtos perigosos.
 * 4930-2/04: Transporte rodoviário de mudanças.
 */
const ALLOWED_CNAES = [
  '4930201',
  '4930202',
  '4930203',
  '4930204'
]

export async function validateCarrierCNPJ(cnpj: string) {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14) {
    return { success: false, error: 'CNPJ inválido. Deve conter 14 dígitos.' }
  }

  try {
    // Usando a BrasilAPI para consulta gratuita e rápida
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`)
    
    if (!response.ok) {
      return { success: false, error: 'Não foi possível consultar este CNPJ no momento.' }
    }

    const data = await response.json()

    // Verifica CNAE Principal
    const mainCnae = data.cnae_fiscal.toString()
    const isMainCnaeValid = ALLOWED_CNAES.includes(mainCnae)

    // Verifica CNAEs Secundários
    const secondaryCnaes = data.cnaes_secundarios || []
    const isSecondaryCnaeValid = secondaryCnaes.some((item: any) => 
      ALLOWED_CNAES.includes(item.codigo.toString())
    )

    if (!isMainCnaeValid && !isSecondaryCnaeValid) {
      return { 
        success: false, 
        error: 'Esta empresa não possui CNAE de transporte de cargas autorizado.',
        details: `CNAE Principal: ${data.cnae_fiscal_descricao}`
      }
    }

    return { 
      success: true, 
      data: {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnae_principal: data.cnae_fiscal_descricao
      }
    }

  } catch (error) {
    console.error('Erro ao validar CNPJ:', error)
    return { success: false, error: 'Erro interno ao validar CNPJ.' }
  }
}
