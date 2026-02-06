'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { freightSchema, freightStatusSchema } from '@/lib/validations/freight.schema'
import type { FreightFormData, FreightListParams, FreightWithRelations } from '@/types/freight.types'

type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * List freights with filters and pagination
 */
export async function listFreights(
  params: FreightListParams = {}
): Promise<ActionResponse<{ freights: FreightWithRelations[]; total: number }>> {
  try {
    const supabase = await createClient()

    const {
      page = 1,
      per_page = 10,
      order_by = 'created_at',
      order = 'desc',
      status,
      customer_id,
      driver_id,
      vehicle_id,
      origin_city,
      destination_city,
      date_from,
      date_to,
      search,
    } = params

    // Build query
    let query = supabase
      .from('freights')
      .select(
        `
        *,
        customer:customers (id, name, document),
        driver:drivers (id, name, phone),
        vehicle:vehicles (id, plate, model)
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (status) query = query.eq('status', status)
    if (customer_id) query = query.eq('customer_id', customer_id)
    if (driver_id) query = query.eq('driver_id', driver_id)
    if (vehicle_id) query = query.eq('vehicle_id', vehicle_id)
    if (origin_city) query = query.ilike('origin_city', `%${origin_city}%`)
    if (destination_city) query = query.ilike('destination_city', `%${destination_city}%`)
    if (date_from) query = query.gte('pickup_date', date_from)
    if (date_to) query = query.lte('pickup_date', date_to)
    if (search) {
      query = query.or(
        `freight_number.ilike.%${search}%,origin_city.ilike.%${search}%,destination_city.ilike.%${search}%`
      )
    }

    // Apply ordering
    query = query.order(order_by, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listing freights:', error)
      return { success: false, error: 'Erro ao listar fretes' }
    }

    return {
      success: true,
      data: {
        freights: (data as FreightWithRelations[]) || [],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error listing freights:', error)
    return { success: false, error: 'Erro inesperado ao listar fretes' }
  }
}

/**
 * Get freight by ID with relations
 */
export async function getFreight(id: string): Promise<ActionResponse<FreightWithRelations>> {
  try {
    const supabase = await createClient()

    const { data: freight, error: freightError } = await supabase
      .from('freights')
      .select(
        `
        *,
        customer:customers (id, name, document, email, phone),
        driver:drivers (id, name, phone, license_number),
        vehicle:vehicles (id, plate, model, type)
      `
      )
      .eq('id', id)
      .single()

    if (freightError) {
      console.error('Error getting freight:', freightError)
      return { success: false, error: 'Frete não encontrado' }
    }

    // Get items
    const { data: items, error: itemsError } = await supabase
      .from('freight_items')
      .select('*')
      .eq('freight_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error getting freight items:', itemsError)
    }

    // Get tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('freight_tracking')
      .select('*')
      .eq('freight_id', id)
      .order('created_at', { ascending: true })

    if (trackingError) {
      console.error('Error getting freight tracking:', trackingError)
    }

    return {
      success: true,
      data: {
        ...freight,
        items: items || [],
        tracking: tracking || [],
      } as FreightWithRelations,
    }
  } catch (error) {
    console.error('Error getting freight:', error)
    return { success: false, error: 'Erro inesperado ao buscar frete' }
  }
}

/**
 * Create freight with items
 */
export async function createFreight(
  data: FreightFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = freightSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Dados inválidos',
      }
    }

    const { items, ...freightData } = validationResult.data

    // Get user and company
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    // Generate freight number
    const freightNumber = `FRT-${Date.now()}`

    // Insert freight
    const { data: freight, error: freightError } = await supabase
      .from('freights')
      .insert({
        ...freightData,
        freight_number: freightNumber,
        company_id: userData.company_id,
      })
      .select()
      .single()

    if (freightError) {
      console.error('Error creating freight:', freightError)
      return { success: false, error: 'Erro ao criar frete' }
    }

    // Insert items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        ...item,
        freight_id: freight.id,
        company_id: userData.company_id,
      }))

      const { error: itemsError } = await supabase
        .from('freight_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Error creating freight items:', itemsError)
        // Rollback freight creation
        await supabase.from('freights').delete().eq('id', freight.id)
        return { success: false, error: 'Erro ao criar itens do frete' }
      }
    }

    // Create initial tracking
    await supabase.from('freight_tracking').insert({
      freight_id: freight.id,
      company_id: userData.company_id,
      status: freightData.status,
      location: `${freightData.origin_city}, ${freightData.origin_state}`,
      notes: 'Frete criado',
    })

    revalidatePath('/fretes')
    return { success: true, data: { id: freight.id } }
  } catch (error) {
    console.error('Error creating freight:', error)
    return { success: false, error: 'Erro inesperado ao criar frete' }
  }
}

/**
 * Update freight with items
 */
export async function updateFreight(
  id: string,
  data: FreightFormData
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = freightSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Dados inválidos',
      }
    }

    const { items, ...freightData } = validationResult.data

    // Update freight
    const { error: freightError } = await supabase
      .from('freights')
      .update(freightData)
      .eq('id', id)

    if (freightError) {
      console.error('Error updating freight:', freightError)
      return { success: false, error: 'Erro ao atualizar frete' }
    }

    // Delete old items
    await supabase.from('freight_items').delete().eq('freight_id', id)

    // Insert new items
    if (items && items.length > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

      const itemsToInsert = items.map((item) => ({
        ...item,
        freight_id: id,
        company_id: userData!.company_id,
      }))

      const { error: itemsError } = await supabase
        .from('freight_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Error updating freight items:', itemsError)
        return { success: false, error: 'Erro ao atualizar itens do frete' }
      }
    }

    revalidatePath('/fretes')
    revalidatePath(`/fretes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating freight:', error)
    return { success: false, error: 'Erro inesperado ao atualizar frete' }
  }
}

/**
 * Update freight status
 */
export async function updateFreightStatus(
  id: string,
  status: string,
  notes?: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Validate status
    const validationResult = freightStatusSchema.safeParse({ status, notes })
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Status inválido',
      }
    }

    // Update freight
    const { error: freightError } = await supabase
      .from('freights')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (freightError) {
      console.error('Error updating freight status:', freightError)
      return { success: false, error: 'Erro ao atualizar status do frete' }
    }

    // Get freight data
    const { data: freight } = await supabase
      .from('freights')
      .select('origin_city, origin_state, company_id')
      .eq('id', id)
      .single()

    // Create tracking entry
    if (freight) {
      await supabase.from('freight_tracking').insert({
        freight_id: id,
        company_id: freight.company_id,
        status,
        location: `${freight.origin_city}, ${freight.origin_state}`,
        notes: notes || `Status alterado para ${status}`,
      })
    }

    revalidatePath('/fretes')
    revalidatePath(`/fretes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating freight status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status' }
  }
}

/**
 * Delete freight
 */
export async function deleteFreight(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Delete items first (cascade)
    await supabase.from('freight_items').delete().eq('freight_id', id)
    await supabase.from('freight_tracking').delete().eq('freight_id', id)

    // Delete freight
    const { error } = await supabase.from('freights').delete().eq('id', id)

    if (error) {
      console.error('Error deleting freight:', error)
      return { success: false, error: 'Erro ao excluir frete' }
    }

    revalidatePath('/fretes')
    return { success: true }
  } catch (error) {
    console.error('Error deleting freight:', error)
    return { success: false, error: 'Erro inesperado ao excluir frete' }
  }
}
