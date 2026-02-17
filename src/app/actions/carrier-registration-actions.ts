'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CarrierRegistrationInput } from '@/lib/validations/carrier-registration.schema'

interface TermAcceptance {
  term_type: string
  term_version: string
  ip_address?: string
  user_agent?: string
}

export async function registerCarrier(data: CarrierRegistrationInput) {
  console.log('=== INICIANDO CADASTRO ===')
  console.log('Dados recebidos:', JSON.stringify(data, null, 2))
  
  const supabase = await createClient()
  const cleanCnpj = data.cnpj.replace(/\D/g, '')

  try {
    const { data: duplicateCompany, error: duplicateCheckError } = await supabase
      .from('companies')
      .select('id')
      .eq('document', cleanCnpj)
      .maybeSingle()

    if (duplicateCheckError) {
      console.error('❌ Erro ao verificar CNPJ existente:', duplicateCheckError)
      return { error: 'Erro ao verificar CNPJ já cadastrado. Tente novamente.' }
    }

    if (duplicateCompany?.id) {
      return { error: 'Este CNPJ já está cadastrado na plataforma.' }
    }

    console.log('1. Criando usuário no Supabase Auth...')
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          cpf: data.cpf,
          phone: data.phone,
          company_name: data.companyName,
          cnpj: cleanCnpj,
          role: 'transportadora',
          // Dados adicionais que o trigger vai processar
          inscricao_estadual: data.inscricaoEstadual,
          rntrc: data.rntrc,
          tipo_veiculo_principal: data.tipoVeiculoPrincipal,
          tipo_carroceria_principal: data.tipoCarroceriaPrincipal,
          capacidade_carga_toneladas: data.capacidadeCargaToneladas,
          regioes_atendimento: data.regioesAtendimento,
          raio_atuacao: data.raioAtuacao,
          consumo_medio_diesel: data.consumoMedioDiesel,
          numero_eixos: data.numeroEixos,
          possui_rastreamento: data.possuiRastreamento,
          possui_seguro_carga: data.possuiSeguroCarga,
          numero_apolice_seguro: data.numeroApoliceSeguro,
          whatsapp_permission: data.whatsappPermission,
          accept_communications: data.acceptCommunications,
          accept_credit_analysis: data.acceptCreditAnalysis,
          // Endereço
          cep: data.cep,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
        },
      },
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      console.error('❌ authData.user está vazio')
      return { error: 'Erro ao criar usuário' }
    }

    const userId = authData.user.id

    console.log('✅ Usuário criado com sucesso:', userId)

    // 2. Registrar aceites de termos
    console.log('2. Registrando aceites de termos...')
    const termAcceptances: TermAcceptance[] = []

    if (data.acceptTerms) {
      termAcceptances.push({
        term_type: 'terms_of_use',
        term_version: '1.0',
      })
    }

    if (data.acceptPrivacy) {
      termAcceptances.push({
        term_type: 'privacy_policy',
        term_version: '1.0',
      })
    }

    if (data.acceptCommunications) {
      termAcceptances.push({
        term_type: 'communications',
        term_version: '1.0',
      })
    }

    if (data.acceptCreditAnalysis) {
      termAcceptances.push({
        term_type: 'credit_analysis',
        term_version: '1.0',
      })
    }

    // Inserir aceites de termos
    if (termAcceptances.length > 0) {
      console.log(`Inserindo ${termAcceptances.length} aceites de termos...`)
      const acceptancesWithUserId = termAcceptances.map(acceptance => ({
        ...acceptance,
        user_id: userId,
      }))

      const { error: termsError } = await supabase
        .from('term_acceptances')
        .insert(acceptancesWithUserId)

      if (termsError) {
        console.error('❌ Erro ao salvar aceites:', termsError)
        // Não retornar erro aqui, pois o usuário já foi criado
      } else {
        console.log('✅ Aceites salvos com sucesso')
      }
    }

    // 3. Atualizar profile com dados adicionais
    console.log('3. Atualizando profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        cpf: data.cpf,
        phone: data.phone,
        whatsapp_permission: data.whatsappPermission,
        accept_communications: data.acceptCommunications,
        accept_credit_analysis: data.acceptCreditAnalysis,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Erro ao atualizar profile:', profileError)
    } else {
      console.log('✅ Profile atualizado com sucesso')
    }

    // 4. Atualizar company com dados operacionais
    console.log('4. Atualizando company...')
    // Buscar company_id do profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    console.log('Company ID encontrado:', profileData?.company_id)

    if (profileData?.company_id) {
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          inscricao_estadual: data.inscricaoEstadual,
          rntrc: data.rntrc,
          tipo_veiculo_principal: data.tipoVeiculoPrincipal,
          tipo_carroceria_principal: data.tipoCarroceriaPrincipal,
          capacidade_carga_toneladas: data.capacidadeCargaToneladas,
          regioes_atendimento: data.regioesAtendimento,
          raio_atuacao: data.raioAtuacao,
          consumo_medio_diesel: data.consumoMedioDiesel,
          numero_eixos: data.numeroEixos,
          possui_rastreamento: data.possuiRastreamento,
          possui_seguro_carga: data.possuiSeguroCarga,
          numero_apolice_seguro: data.numeroApoliceSeguro,
        })
        .eq('id', profileData.company_id)

      if (companyError) {
        console.error('❌ Erro ao atualizar company:', companyError)
        if (companyError.code === '23505') {
          return { error: 'Este CNPJ já está cadastrado na plataforma.' }
        }
      } else {
        console.log('✅ Company atualizada com sucesso')
      }
    } else {
      console.warn('⚠️ Company ID não encontrado no profile')
    }

    console.log('5. Limpando sessionStorage e redirecionando...')
    console.log('=== CADASTRO CONCLUÍDO COM SUCESSO ===')
    
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('❌ ERRO GERAL NO CADASTRO:', error)
    return { error: 'Erro ao processar cadastro. Tente novamente.' }
  }
}

// Action para buscar versão atual dos termos
export async function getCurrentTermVersion(termType: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('term_versions')
    .select('version, content')
    .eq('term_type', termType)
    .eq('is_current', true)
    .single()

  if (error) {
    console.error('Error fetching term version:', error)
    return null
  }

  return data
}

// Action para verificar se usuário já aceitou determinado termo
export async function hasAcceptedTerm(userId: string, termType: string, termVersion: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('term_acceptances')
    .select('id')
    .eq('user_id', userId)
    .eq('term_type', termType)
    .eq('term_version', termVersion)
    .single()

  if (error) {
    return false
  }

  return !!data
}
