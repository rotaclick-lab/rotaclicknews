'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { proposalSchema } from '@/lib/validations/marketplace.schema'
import type { ProposalFormData, ProposalListParams, ProposalWithRelations } from '@/types/marketplace.types'

// Create proposal
export async function createProposal(formData: ProposalFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    // Validate data
    const validatedData = proposalSchema.parse(formData)

    // Check if return freight is still available
    const { data: returnFreight } = await supabase
      .from('return_freights')
      .select('status, company_id')
      .eq('id', validatedData.return_freight_id)
      .single()

    if (!returnFreight) {
      return { success: false, error: 'Frete de retorno não encontrado' }
    }

    if (returnFreight.company_id === profile.company_id) {
      return { success: false, error: 'Você não pode fazer proposta para sua própria rota' }
    }

    if (returnFreight.status !== 'available' && returnFreight.status !== 'in_negotiation') {
      return { success: false, error: 'Este frete não está mais disponível' }
    }

    // Create proposal
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...validatedData,
        company_id: profile.company_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating proposal:', error)
      return { success: false, error: 'Erro ao criar proposta' }
    }

    // Update return freight status to in_negotiation if first proposal
    await supabase
      .from('return_freights')
      .update({ status: 'in_negotiation' })
      .eq('id', validatedData.return_freight_id)
      .eq('status', 'available')

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/minhas-propostas')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in createProposal:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar proposta' }
  }
}

// Accept proposal
export async function acceptProposal(proposalId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Get proposal with return freight
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, return_freights(*)')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      return { success: false, error: 'Proposta não encontrada' }
    }

    // Check ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (proposal.return_freights.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    // Accept proposal
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId)

    if (updateError) {
      return { success: false, error: 'Erro ao aceitar proposta' }
    }

    // Reject all other proposals for this return freight
    await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('return_freight_id', proposal.return_freight_id)
      .neq('id', proposalId)
      .eq('status', 'pending')

    // Update return freight status
    await supabase
      .from('return_freights')
      .update({ status: 'accepted' })
      .eq('id', proposal.return_freight_id)

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/minhas-rotas')

    return { success: true }
  } catch (error) {
    console.error('Error in acceptProposal:', error)
    return { success: false, error: 'Erro ao aceitar proposta' }
  }
}

// Reject proposal
export async function rejectProposal(proposalId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Get proposal with return freight
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, return_freights(*)')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      return { success: false, error: 'Proposta não encontrada' }
    }

    // Check ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (proposal.return_freights.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    // Reject proposal
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('id', proposalId)

    if (updateError) {
      return { success: false, error: 'Erro ao recusar proposta' }
    }

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/minhas-rotas')

    return { success: true }
  } catch (error) {
    console.error('Error in rejectProposal:', error)
    return { success: false, error: 'Erro ao recusar proposta' }
  }
}

// Withdraw proposal
export async function withdrawProposal(proposalId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Check ownership
    const { data: proposal } = await supabase
      .from('proposals')
      .select('company_id')
      .eq('id', proposalId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (proposal?.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    // Withdraw proposal
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ status: 'withdrawn' })
      .eq('id', proposalId)

    if (updateError) {
      return { success: false, error: 'Erro ao retirar proposta' }
    }

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/minhas-propostas')

    return { success: true }
  } catch (error) {
    console.error('Error in withdrawProposal:', error)
    return { success: false, error: 'Erro ao retirar proposta' }
  }
}

// List my proposals
export async function listMyProposals(params: ProposalListParams = {}) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    const {
      page = 1,
      per_page = 20,
      order_by = 'created_at',
      order = 'desc',
      filters = {},
    } = params

    let query = supabase
      .from('proposals')
      .select(`
        *,
        return_freights(*),
        companies:company_id(id, name)
      `, { count: 'exact' })
      .eq('company_id', profile.company_id)

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    const { data, error, count } = await query
      .order(order_by, { ascending: order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('Error listing proposals:', error)
      return { success: false, error: 'Erro ao buscar propostas' }
    }

    return {
      success: true,
      data: {
        proposals: data as ProposalWithRelations[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in listMyProposals:', error)
    return { success: false, error: 'Erro ao buscar propostas' }
  }
}
