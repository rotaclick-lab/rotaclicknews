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
  const supabase = await createClient()

  try {
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
          cnpj: data.cnpj,
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
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Erro ao criar usuário' }
    }

    // 2. Registrar aceites de termos
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
      const acceptancesWithUserId = termAcceptances.map(acceptance => ({
        ...acceptance,
        user_id: authData.user.id,
      }))

      const { error: termsError } = await supabase
        .from('term_acceptances')
        .insert(acceptancesWithUserId)

      if (termsError) {
        console.error('Terms acceptance error:', termsError)
        // Não retornar erro aqui, pois o usuário já foi criado
      }
    }

    // 3. Atualizar profile com dados adicionais
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        cpf: data.cpf,
        phone: data.phone,
        whatsapp_permission: data.whatsappPermission,
        accept_communications: data.acceptCommunications,
        accept_credit_analysis: data.acceptCreditAnalysis,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // 4. Atualizar company com dados operacionais
    // Buscar company_id do profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', authData.user.id)
      .single()

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
        console.error('Company update error:', companyError)
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('Registration error:', error)
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
