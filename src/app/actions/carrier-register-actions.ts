'use server'

import { createClient } from '@/lib/supabase/server'

interface CarrierRegistrationData {
  // Responsável
  nomeCompleto: string
  cpf: string
  telefone: string
  // Empresa
  razaoSocial: string
  cnpj: string
  inscricaoEstadual: string
  rntrc: string
  // Endereço
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  // Operacional
  tipoVeiculo: string
  tipoCarroceria: string
  capacidadeCarga: string
  raioOperacao: string
  regioes: string[]
  consumoMedio: string
  qtdEixos: string
  numeroApolice: string
  possuiRastreamento: boolean
  possuiSeguro: boolean
  // Credenciais
  email: string
  senha: string
  // Termos
  aceitaTermos: boolean
  aceitaPrivacidade: boolean
  aceitaComunicacoes: boolean
  aceitaAnalise: boolean
}

export async function registerCarrier(data: CarrierRegistrationData) {
  const supabase = await createClient()

  // 1. Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.senha,
    options: {
      data: {
        full_name: data.nomeCompleto,
        role: 'transportadora',
        cnpj: data.cnpj.replace(/\D/g, ''),
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.rotaclick.com.br'}/auth/callback`,
    },
  })

  if (authError) {
    console.error('Erro ao criar usuário:', authError)
    if (authError.message.includes('already registered')) {
      return { success: false, error: 'Este email já está cadastrado. Tente fazer login.' }
    }
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: 'Erro inesperado ao criar conta.' }
  }

  const userId = authData.user.id

  try {
    // 2. Criar a empresa na tabela companies
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: data.razaoSocial,
        document: data.cnpj.replace(/\D/g, ''),
        email: data.email,
        phone: data.telefone.replace(/\D/g, ''),
        cnpj: data.cnpj.replace(/\D/g, ''),
        razao_social: data.razaoSocial,
        city: data.cidade,
        state: data.uf,
        postal_code: data.cep.replace(/\D/g, ''),
        inscricao_estadual: data.inscricaoEstadual,
        rntrc: data.rntrc,
        endereco_completo: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep.replace(/\D/g, ''),
        },
        address: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          cep: data.cep.replace(/\D/g, ''),
        },
        tipo_veiculo_principal: data.tipoVeiculo,
        tipo_carroceria_principal: data.tipoCarroceria,
        capacidade_carga_toneladas: data.capacidadeCarga ? parseInt(data.capacidadeCarga) : null,
        raio_atuacao: data.raioOperacao ? `${data.raioOperacao} km` : null,
        regioes_atendimento: data.regioes,
        consumo_medio_diesel: data.consumoMedio ? parseFloat(data.consumoMedio) : null,
        numero_eixos: data.qtdEixos ? parseInt(data.qtdEixos) : null,
        possui_rastreamento: data.possuiRastreamento,
        possui_seguro_carga: data.possuiSeguro,
        numero_apolice_seguro: data.numeroApolice || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (companyError) {
      console.error('Erro ao criar empresa:', companyError)
      // Não deletar o auth user pois o email de confirmação já foi enviado
      // O usuário pode completar o cadastro depois
      return { 
        success: false, 
        error: 'Conta criada, mas houve um erro ao salvar os dados da empresa. Entre em contato com o suporte.' 
      }
    }

    // 3. Criar o perfil na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        company_id: companyData.id,
        name: data.nomeCompleto,
        email: data.email,
        phone: data.telefone.replace(/\D/g, ''),
        cpf: data.cpf.replace(/\D/g, ''),
        role: 'transportadora',
        accept_communications: data.aceitaComunicacoes,
        accept_credit_analysis: data.aceitaAnalise,
        whatsapp_permission: true,
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      return { 
        success: false, 
        error: 'Conta criada, mas houve um erro ao salvar seu perfil. Entre em contato com o suporte.' 
      }
    }

    // 4. Registrar aceite dos termos
    const termsToAccept = []
    if (data.aceitaTermos) {
      termsToAccept.push({
        user_id: userId,
        term_type: 'termos_uso',
        term_version: '1.0',
        accepted_at: new Date().toISOString(),
      })
    }
    if (data.aceitaPrivacidade) {
      termsToAccept.push({
        user_id: userId,
        term_type: 'politica_privacidade',
        term_version: '1.0',
        accepted_at: new Date().toISOString(),
      })
    }
    if (data.aceitaComunicacoes) {
      termsToAccept.push({
        user_id: userId,
        term_type: 'comunicacoes',
        term_version: '1.0',
        accepted_at: new Date().toISOString(),
      })
    }
    if (data.aceitaAnalise) {
      termsToAccept.push({
        user_id: userId,
        term_type: 'analise_credito',
        term_version: '1.0',
        accepted_at: new Date().toISOString(),
      })
    }

    if (termsToAccept.length > 0) {
      const { error: termsError } = await supabase
        .from('term_acceptances')
        .insert(termsToAccept)

      if (termsError) {
        console.error('Erro ao registrar termos (não crítico):', termsError)
        // Não bloquear o cadastro por erro nos termos
      }
    }

    // 5. Criar notificação de boas-vindas
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        company_id: companyData.id,
        title: 'Bem-vindo ao RotaClick!',
        message: `Olá ${data.nomeCompleto}, sua conta foi criada com sucesso. Configure sua tabela de frete para começar a receber cotações.`,
        type: 'system',
        is_read: false,
      })
      .then(() => {})
      .catch(() => {}) // Não bloquear por erro na notificação

    return { 
      success: true, 
      message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta.',
      userId,
      companyId: companyData.id,
    }

  } catch (error: any) {
    console.error('Erro inesperado no cadastro:', error)
    return { 
      success: false, 
      error: 'Erro inesperado. Tente novamente ou entre em contato com o suporte.' 
    }
  }
}
