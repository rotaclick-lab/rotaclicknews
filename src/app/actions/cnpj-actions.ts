'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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

  const admin = createAdminClient()
  const { data: existingCompany, error: duplicateCheckError } = await admin
    .from('companies')
    .select('id')
    .eq('document', cleanCNPJ)
    .maybeSingle()

  if (duplicateCheckError) {
    console.error('Erro ao verificar duplicidade de CNPJ:', duplicateCheckError)
    return { success: false, error: 'Erro ao verificar CNPJ cadastrado. Tente novamente em instantes.' }
  }

  if (existingCompany?.id) {
    return { success: false, error: 'Este CNPJ já está cadastrado na plataforma.' }
  }

  try {
    // TENTATIVA 1: BrasilAPI
    let response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, { next: { revalidate: 3600 } })
    
    if (response.ok) {
      const data = await response.json()
      return processBrasilAPI(data)
    }

    // TENTATIVA 2: Fallback para ReceitaWS (API pública limitada a 3 req/min)
    console.log('BrasilAPI falhou, tentando ReceitaWS...')
    response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCNPJ}`, { next: { revalidate: 3600 } })
    
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'ERROR') throw new Error(data.message)
      return processReceitaWS(data)
    }

    return { success: false, error: 'Serviços de consulta indisponíveis no momento. Tente novamente em instantes.' }

  } catch (error: any) {
    console.error('Erro ao validar CNPJ:', error)
    return { success: false, error: 'Erro ao consultar CNPJ: ' + (error.message || 'Serviço instável') }
  }
}

function processBrasilAPI(data: any) {
  const mainCnae = data.cnae_fiscal.toString().replace(/\D/g, '')
  const isMainCnaeValid = ALLOWED_CNAES.includes(mainCnae)

  const secondaryCnaes = data.cnaes_secundarios || []
  const isSecondaryCnaeValid = secondaryCnaes.some((item: any) => 
    ALLOWED_CNAES.includes(item.codigo.toString().replace(/\D/g, ''))
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
        nome_fantasia: data.nome_fantasia || data.razao_social,
        cnae_principal: data.cnae_fiscal,
        cnae_principal_descricao: data.cnae_fiscal_descricao,
        cnae_secundarios: data.cnaes_secundarios || [],
        natureza_juridica: data.natureza_juridica,
        porte: data.porte,
        capital_social: data.capital_social,
        data_abertura: data.data_inicio_atividade,
        situacao_cadastral: data.descricao_situacao_cadastral,
        data_situacao_cadastral: data.data_situacao_cadastral,
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep
        },
        socios: data.qsa || [],
        email: data.email,
        telefone: data.ddd_telefone_1
      }
    }
}

function processReceitaWS(data: any) {
  const mainCnae = data.atividade_principal[0].code.replace(/\D/g, '')
  const isMainCnaeValid = ALLOWED_CNAES.includes(mainCnae)

  const secondaryCnaes = data.atividades_secundarias || []
  const isSecondaryCnaeValid = secondaryCnaes.some((item: any) => 
    ALLOWED_CNAES.includes(item.code.replace(/\D/g, ''))
  )

  if (!isMainCnaeValid && !isSecondaryCnaeValid) {
    return { 
      success: false, 
      error: 'Esta empresa não possui CNAE de transporte de cargas autorizado.',
      details: `Atividade: ${data.atividade_principal[0].text}`
    }
  }

  return { 
    success: true, 
    data: {
      razao_social: data.nome,
      nome_fantasia: data.fantasia || data.nome,
      cnae_principal: data.atividade_principal[0].code,
      cnae_principal_descricao: data.atividade_principal[0].text,
      cnae_secundarios: data.atividades_secundarias || [],
      natureza_juridica: data.natureza_juridica,
      porte: data.porte,
      capital_social: data.capital_social,
      data_abertura: data.data_situacao,
      situacao_cadastral: data.situacao,
      data_situacao_cadastral: data.data_situacao,
      endereco: {
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep
      },
      socios: data.qsa || [],
      email: data.email,
      telefone: data.telefone
    }
  }
}
