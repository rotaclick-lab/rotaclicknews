'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { customerSchema } from '@/lib/validations/customer.schema'
import type { CustomerFormData, CustomerListParams, CustomerWithRelations } from '@/types/customer.types'

type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * List customers with filters and pagination
 */
export async function listCustomers(
  params: CustomerListParams = {}
): Promise<ActionResponse<{ customers: CustomerWithRelations[]; total: number }>> {
  try {
    const supabase = await createClient()

    const {
      page = 1,
      per_page = 10,
      order_by = 'name',
      order = 'asc',
      status,
      customer_type,
      city,
      state,
      search,
    } = params

    // Build query
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (customer_type) query = query.eq('customer_type', customer_type)
    if (city) query = query.ilike('city', `%${city}%`)
    if (state) query = query.eq('state', state)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,document.ilike.%${search}%,email.ilike.%${search}%`
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
      console.error('Error listing customers:', error)
      return { success: false, error: 'Erro ao listar clientes' }
    }

    return {
      success: true,
      data: {
        customers: (data as CustomerWithRelations[]) || [],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error listing customers:', error)
    return { success: false, error: 'Erro inesperado ao listar clientes' }
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: string): Promise<ActionResponse<CustomerWithRelations>> {
  try {
    const supabase = await createClient()

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (customerError) {
      console.error('Error getting customer:', customerError)
      return { success: false, error: 'Cliente não encontrado' }
    }

    // Get customer statistics
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)

    const { data: freightsData } = await supabase
      .from('freights')
      .select('total_value, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(1)

    const totalValue = await supabase
      .from('freights')
      .select('total_value')
      .eq('customer_id', id)
      .then((res) =>
        res.data?.reduce((sum, freight) => sum + (freight.total_value || 0), 0) || 0
      )

    return {
      success: true,
      data: {
        ...customer,
        freights_count: freightsCount || 0,
        total_freights_value: totalValue,
        last_freight_date: freightsData?.[0]?.created_at || null,
      } as CustomerWithRelations,
    }
  } catch (error) {
    console.error('Error getting customer:', error)
    return { success: false, error: 'Erro inesperado ao buscar cliente' }
  }
}

/**
 * Create customer
 */
export async function createCustomer(
  data: CustomerFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = customerSchema.safeParse(data)
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

    // Check if document already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('document', validationResult.data.document)
      .single()

    if (existingCustomer) {
      return { success: false, error: 'Já existe um cliente com este documento' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Insert customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        ...cleanedData,
        company_id: userData.company_id,
      })
      .select()
      .single()

    if (customerError) {
      console.error('Error creating customer:', customerError)
      return { success: false, error: 'Erro ao criar cliente' }
    }

    revalidatePath('/clientes')
    return { success: true, data: { id: customer.id } }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { success: false, error: 'Erro inesperado ao criar cliente' }
  }
}

/**
 * Update customer
 */
export async function updateCustomer(
  id: string,
  data: CustomerFormData
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Validate data
    const validationResult = customerSchema.safeParse(data)
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

    // Check if document already exists (excluding current customer)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('company_id', userData!.company_id)
      .eq('document', validationResult.data.document)
      .neq('id', id)
      .single()

    if (existingCustomer) {
      return { success: false, error: 'Já existe um cliente com este documento' }
    }

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    )

    // Update customer
    const { error: customerError } = await supabase
      .from('customers')
      .update(cleanedData)
      .eq('id', id)

    if (customerError) {
      console.error('Error updating customer:', customerError)
      return { success: false, error: 'Erro ao atualizar cliente' }
    }

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating customer:', error)
    return { success: false, error: 'Erro inesperado ao atualizar cliente' }
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    // Check if customer has freights
    const { count: freightsCount } = await supabase
      .from('freights')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)

    if (freightsCount && freightsCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir este cliente pois existem ${freightsCount} frete(s) associado(s)`,
      }
    }

    // Delete customer
    const { error } = await supabase.from('customers').delete().eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      return { success: false, error: 'Erro ao excluir cliente' }
    }

    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { success: false, error: 'Erro inesperado ao excluir cliente' }
  }
}

/**
 * Toggle customer status
 */
export async function toggleCustomerStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('customers')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating customer status:', error)
      return { success: false, error: 'Erro ao atualizar status do cliente' }
    }

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating customer status:', error)
    return { success: false, error: 'Erro inesperado ao atualizar status' }
  }
}
