'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { vehicleSchema } from '@/lib/validations/vehicle.schema'
import type { VehicleFormData, VehicleListParams, VehicleWithRelations } from '@/types/vehicle.types'

type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * List vehicles with filters and pagination
 */
export async function listVehicles(
  params: VehicleListParams = {}
): Promise<ActionResponse<{ vehicles: VehicleWithRelations[]; total: number }>> {
  try {
    const supabase = await createClient()

    const {
      page = 1,
      per_page = 10,
      order_by = 'plate',
      order = 'asc',
      status,
      type,
      search,
      expiring_documents,
    } = params

    // Build query
    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) {
      query = query.or(
        `plate.ilike.%${search}%,model.ilike.%${search}%,brand.ilike.%${search}%`
      )
    }
    
    // Filter expiring documents (next 30 days)
    if (expiring_documents) {
      const today = new Date()
      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      
      const todayStr = today.toISOString().split('T')[0]
      const futureStr = thirtyDaysFromNow.toISOString().split('T')[0]
      
      query = query.or(
        `crlv_expiry_date.gte.${todayStr},crlv_expiry_date.lte.${futureStr},` +
        `ipva_expiry_date.gte.${todayStr},ipva_expiry_date.lte.${futureStr},` +
        `insurance_expiry_date.gte.${todayStr},insurance_expiry_date.lte.${futureStr}`
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
      console.error('Error listing vehicles:', error)
      return { success: false, error: 'Erro ao listar veículos' }
    }

    return {
      success: true,
      data: {
        vehicles: (data as VehicleWithRelations[]) || [],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error listing vehicles:', error)
    return { success: false, error: 'Erro inesperado ao listar veículos' }
  }
}

/**
 * Get vehicle by ID
 */
export async function getVehicle(id: string): Promise<ActionResponse<VehicleWithRelations>> {
  try {
    const supabase = await createClient()

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (vehicleError) {
      console.error('Error getting vehicle:', vehicleError)
      return { success: false, error: 'Veículo não encontrado' }
    }

    // Get vehicle statistics
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', id)

    const { count: activeFreights } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', id)
      .in('status', ['pending', 'in_transit'])

    const { data: lastFreight } = await supabase
      .from('freights')
      .select('created_at')
      .eq('vehicle_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      success: true,
      data: {
        ...vehicle,
        freights_count: freightsCount || 0,
        active_freights: activeFreights || 0,
        last_freight_date: lastFreight?.created_at || null,
      } as VehicleWithRelations,
    }
  } catch (error) {
    console.error('Error getting vehicle:', error)
    return { success: false, error: 'Erro inesperado ao buscar veículo' }
  }
}

/**
 * Create vehicle
 */
export async function createVehicle(
  data: VehicleFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = vehicleSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Dados inválidos',
      }
    }

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

    // Check if plate already exists
    const cleanedPlate = validationResult.data.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', userData.company_id)
      .ilike('plate', `%${cleanedPlate}%`)
      .single()

    if (existingVehicle) {
      return { success: false, error: 'Já existe um veículo com esta placa' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Insert vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        ...cleanedData,
        company_id: userData.company_id,
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('Error creating vehicle:', vehicleError)
      return { success: false, error: 'Erro ao criar veículo' }
    }

    revalidatePath('/veiculos')
    return { success: true, data: { id: vehicle.id } }
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return { success: false, error: 'Erro inesperado ao criar veículo' }
  }
}

/**
 * Update vehicle
 */
export async function updateVehicle(
  id: string,
  data: VehicleFormData
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = vehicleSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Dados inválidos',
      }
    }

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    // Check if plate already exists (excluding current vehicle)
    const cleanedPlate = validationResult.data.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', userData!.company_id)
      .ilike('plate', `%${cleanedPlate}%`)
      .neq('id', id)
      .single()

    if (existingVehicle) {
      return { success: false, error: 'Já existe um veículo com esta placa' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Update vehicle
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update(cleanedData)
      .eq('id', id)

    if (vehicleError) {
      console.error('Error updating vehicle:', vehicleError)
      return { success: false, error: 'Erro ao atualizar veículo' }
    }

    revalidatePath('/veiculos')
    revalidatePath(`/veiculos/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return { success: false, error: 'Erro inesperado ao atualizar veículo' }
  }
}

/**
 * Delete vehicle
 */
export async function deleteVehicle(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Check if vehicle has freights
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', id)

    if (freightsCount && freightsCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir este veículo pois existem ${freightsCount} frete(s) associado(s)`,
      }
    }

    // Delete vehicle
    const { error } = await supabase.from('vehicles').delete().eq('id', id)

    if (error) {
      console.error('Error deleting vehicle:', error)
      return { success: false, error: 'Erro ao excluir veículo' }
    }

    revalidatePath('/veiculos')
    return { success: true }
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return { success: false, error: 'Erro inesperado ao excluir veículo' }
  }
}

/**
 * Toggle vehicle status
 */
export async function toggleVehicleStatus(
  id: string,
  status: 'active' | 'inactive' | 'maintenance'
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('vehicles')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating vehicle status:', error)
      return { success: false, error: 'Erro ao atualizar status do veículo' }
    }

    revalidatePath('/veiculos')
    revalidatePath(`/veiculos/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating vehicle status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status' }
  }
}
