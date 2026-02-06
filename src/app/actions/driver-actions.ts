'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { driverSchema } from '@/lib/validations/driver.schema'
import type { DriverFormData, DriverListParams, DriverWithRelations } from '@/types/driver.types'

type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * List drivers with filters and pagination
 */
export async function listDrivers(
  params: DriverListParams = {}
): Promise<ActionResponse<{ drivers: DriverWithRelations[]; total: number }>> {
  try {
    const supabase = await createClient()

    const {
      page = 1,
      per_page = 10,
      order_by = 'name',
      order = 'asc',
      status,
      license_category,
      city,
      state,
      search,
      expiring_license,
    } = params

    // Build query
    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (license_category) query = query.eq('license_category', license_category)
    if (city) query = query.ilike('city', `%${city}%`)
    if (state) query = query.eq('state', state)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,cpf.ilike.%${search}%,license_number.ilike.%${search}%`
      )
    }
    
    // Filter expiring licenses (next 30 days)
    if (expiring_license) {
      const today = new Date()
      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      
      query = query
        .gte('license_expiry_date', today.toISOString().split('T')[0])
        .lte('license_expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
    }

    // Apply ordering
    query = query.order(order_by, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error listing drivers:', error)
      return { success: false, error: 'Erro ao listar motoristas' }
    }

    return {
      success: true,
      data: {
        drivers: (data as DriverWithRelations[]) || [],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error listing drivers:', error)
    return { success: false, error: 'Erro inesperado ao listar motoristas' }
  }
}

/**
 * Get driver by ID
 */
export async function getDriver(id: string): Promise<ActionResponse<DriverWithRelations>> {
  try {
    const supabase = await createClient()

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (driverError) {
      console.error('Error getting driver:', driverError)
      return { success: false, error: 'Motorista não encontrado' }
    }

    // Get driver statistics
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', id)

    const { count: activeFreights } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', id)
      .in('status', ['pending', 'in_transit'])

    const { data: lastFreight } = await supabase
      .from('freights')
      .select('created_at')
      .eq('driver_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      success: true,
      data: {
        ...driver,
        freights_count: freightsCount || 0,
        active_freights: activeFreights || 0,
        last_freight_date: lastFreight?.created_at || null,
      } as DriverWithRelations,
    }
  } catch (error) {
    console.error('Error getting driver:', error)
    return { success: false, error: 'Erro inesperado ao buscar motorista' }
  }
}

/**
 * Create driver
 */
export async function createDriver(
  data: DriverFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = driverSchema.safeParse(data)
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

    // Check if CPF already exists
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('cpf', validationResult.data.cpf)
      .single()

    if (existingDriver) {
      return { success: false, error: 'Já existe um motorista com este CPF' }
    }

    // Check if license number already exists
    const { data: existingLicense } = await supabase
      .from('drivers')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('license_number', validationResult.data.license_number)
      .single()

    if (existingLicense) {
      return { success: false, error: 'Já existe um motorista com este número de CNH' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Insert driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        ...cleanedData,
        company_id: userData.company_id,
      })
      .select()
      .single()

    if (driverError) {
      console.error('Error creating driver:', driverError)
      return { success: false, error: 'Erro ao criar motorista' }
    }

    revalidatePath('/motoristas')
    return { success: true, data: { id: driver.id } }
  } catch (error) {
    console.error('Error creating driver:', error)
    return { success: false, error: 'Erro inesperado ao criar motorista' }
  }
}

/**
 * Update driver
 */
export async function updateDriver(
  id: string,
  data: DriverFormData
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = driverSchema.safeParse(data)
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

    // Check if CPF already exists (excluding current driver)
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('company_id', userData!.company_id)
      .eq('cpf', validationResult.data.cpf)
      .neq('id', id)
      .single()

    if (existingDriver) {
      return { success: false, error: 'Já existe um motorista com este CPF' }
    }

    // Check if license number already exists (excluding current driver)
    const { data: existingLicense } = await supabase
      .from('drivers')
      .select('id')
      .eq('company_id', userData!.company_id)
      .eq('license_number', validationResult.data.license_number)
      .neq('id', id)
      .single()

    if (existingLicense) {
      return { success: false, error: 'Já existe um motorista com este número de CNH' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Update driver
    const { error: driverError } = await supabase
      .from('drivers')
      .update(cleanedData)
      .eq('id', id)

    if (driverError) {
      console.error('Error updating driver:', driverError)
      return { success: false, error: 'Erro ao atualizar motorista' }
    }

    revalidatePath('/motoristas')
    revalidatePath(`/motoristas/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating driver:', error)
    return { success: false, error: 'Erro inesperado ao atualizar motorista' }
  }
}

/**
 * Delete driver
 */
export async function deleteDriver(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Check if driver has freights
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', id)

    if (freightsCount && freightsCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir este motorista pois existem ${freightsCount} frete(s) associado(s)`,
      }
    }

    // Delete driver
    const { error } = await supabase.from('drivers').delete().eq('id', id)

    if (error) {
      console.error('Error deleting driver:', error)
      return { success: false, error: 'Erro ao excluir motorista' }
    }

    revalidatePath('/motoristas')
    return { success: true }
  } catch (error) {
    console.error('Error deleting driver:', error)
    return { success: false, error: 'Erro inesperado ao excluir motorista' }
  }
}

/**
 * Toggle driver status
 */
export async function toggleDriverStatus(
  id: string,
  status: 'active' | 'inactive' | 'on_vacation'
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('drivers')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating driver status:', error)
      return { success: false, error: 'Erro ao atualizar status do motorista' }
    }

    revalidatePath('/motoristas')
    revalidatePath(`/motoristas/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating driver status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status' }
  }
}
