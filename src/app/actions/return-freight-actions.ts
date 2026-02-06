'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { returnFreightSchema } from '@/lib/validations/marketplace.schema'
import type { ReturnFreightListParams, ReturnFreightWithRelations, ReturnFreightFormData } from '@/types/marketplace.types'

// List return freights with filters and pagination
export async function listReturnFreights(params: ReturnFreightListParams = {}) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Get user's company
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
      search = '',
    } = params

    // Base query
    let query = supabase
      .from('return_freights')
      .select(`
        *,
        companies:company_id(id, name),
        vehicles:vehicle_id(id, plate, type),
        proposals(count)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.origin_state) {
      query = query.eq('origin_state', filters.origin_state)
    }

    if (filters.destination_state) {
      query = query.eq('destination_state', filters.destination_state)
    }

    if (filters.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type)
    }

    if (filters.min_date) {
      query = query.gte('available_date', filters.min_date)
    }

    if (filters.max_date) {
      query = query.lte('available_date', filters.max_date)
    }

    if (filters.max_distance) {
      query = query.lte('distance_km', filters.max_distance)
    }

    // Search
    if (search) {
      query = query.or(`origin_city.ilike.%${search}%,destination_city.ilike.%${search}%,cargo_type.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1

    // Execute query
    const { data, error, count } = await query
      .order(order_by, { ascending: order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('Error listing return freights:', error)
      return { success: false, error: 'Erro ao buscar fretes de retorno' }
    }

    // Process data to include proposal stats
    const returnFreights = data.map((rf: any) => ({
      ...rf,
      proposals_count: rf.proposals?.[0]?.count || 0,
    }))

    return {
      success: true,
      data: {
        return_freights: returnFreights as ReturnFreightWithRelations[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in listReturnFreights:', error)
    return { success: false, error: 'Erro ao buscar fretes de retorno' }
  }
}

// Get single return freight with proposals
export async function getReturnFreight(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data, error } = await supabase
      .from('return_freights')
      .select(`
        *,
        companies:company_id(id, name),
        vehicles:vehicle_id(id, plate, type, model, brand),
        proposals(
          *,
          companies:company_id(id, name),
          vehicles:vehicle_id(id, plate, type),
          drivers:driver_id(id, name, phone)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching return freight:', error)
      return { success: false, error: 'Frete de retorno não encontrado' }
    }

    // Calculate proposal stats
    const proposals = data.proposals || []
    const proposalPrices = proposals
      .filter((p: any) => p.status === 'pending' || p.status === 'counter')
      .map((p: any) => p.proposed_price)

    const stats = {
      proposals_count: proposals.length,
      pending_proposals: proposals.filter((p: any) => p.status === 'pending').length,
      best_proposal: proposalPrices.length > 0 ? Math.min(...proposalPrices) : null,
      average_proposal: proposalPrices.length > 0 
        ? proposalPrices.reduce((a: number, b: number) => a + b, 0) / proposalPrices.length 
        : null,
    }

    return {
      success: true,
      data: {
        ...data,
        ...stats,
      } as ReturnFreightWithRelations,
    }
  } catch (error) {
    console.error('Error in getReturnFreight:', error)
    return { success: false, error: 'Erro ao buscar frete de retorno' }
  }
}

// Create return freight
export async function createReturnFreight(formData: ReturnFreightFormData) {
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
    const validatedData = returnFreightSchema.parse(formData)

    // Create return freight
    const { data, error } = await supabase
      .from('return_freights')
      .insert({
        ...validatedData,
        company_id: profile.company_id,
        status: 'available',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating return freight:', error)
      return { success: false, error: 'Erro ao criar frete de retorno' }
    }

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/minhas-rotas')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in createReturnFreight:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar frete de retorno' }
  }
}

// Update return freight
export async function updateReturnFreight(id: string, formData: ReturnFreightFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Check ownership
    const { data: existingFreight } = await supabase
      .from('return_freights')
      .select('company_id')
      .eq('id', id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (existingFreight?.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    // Validate data
    const validatedData = returnFreightSchema.parse(formData)

    // Update return freight
    const { data, error } = await supabase
      .from('return_freights')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating return freight:', error)
      return { success: false, error: 'Erro ao atualizar frete de retorno' }
    }

    revalidatePath('/marketplace')
    revalidatePath(`/marketplace/${id}`)

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in updateReturnFreight:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar frete de retorno' }
  }
}

// Delete return freight
export async function deleteReturnFreight(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Check ownership
    const { data: existingFreight } = await supabase
      .from('return_freights')
      .select('company_id')
      .eq('id', id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (existingFreight?.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    // Check for accepted proposals
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id')
      .eq('return_freight_id', id)
      .eq('status', 'accepted')

    if (proposals && proposals.length > 0) {
      return { 
        success: false, 
        error: 'Não é possível excluir frete com propostas aceitas' 
      }
    }

    // Delete return freight (proposals will be cascade deleted)
    const { error } = await supabase
      .from('return_freights')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting return freight:', error)
      return { success: false, error: 'Erro ao excluir frete de retorno' }
    }

    revalidatePath('/marketplace')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteReturnFreight:', error)
    return { success: false, error: 'Erro ao excluir frete de retorno' }
  }
}

// Cancel return freight
export async function cancelReturnFreight(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    // Check ownership
    const { data: existingFreight } = await supabase
      .from('return_freights')
      .select('company_id')
      .eq('id', id)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (existingFreight?.company_id !== profile?.company_id) {
      return { success: false, error: 'Não autorizado' }
    }

    const { error } = await supabase
      .from('return_freights')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      console.error('Error cancelling return freight:', error)
      return { success: false, error: 'Erro ao cancelar frete de retorno' }
    }

    revalidatePath('/marketplace')
    revalidatePath(`/marketplace/${id}`)

    return { success: true }
  } catch (error) {
    console.error('Error in cancelReturnFreight:', error)
    return { success: false, error: 'Erro ao cancelar frete de retorno' }
  }
}
