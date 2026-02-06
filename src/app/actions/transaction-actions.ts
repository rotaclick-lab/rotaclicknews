'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transactionSchema, type TransactionFormData } from '@/lib/validations/financial.schema'
import type { TransactionListParams, TransactionWithRelations } from '@/types/financial.types'

// List transactions with filters
export async function listTransactions(params: TransactionListParams = {}) {
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
      order_by = 'due_date',
      order = 'desc',
      filters = {},
      search = '',
    } = params

    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_categories(id, name, type, color),
        freights(id, freight_number, origin_city, destination_city),
        customers(id, name, document)
      `, { count: 'exact' })
      .eq('company_id', profile.company_id)

    // Apply filters
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.start_date) {
      query = query.gte('due_date', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('due_date', filters.end_date)
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,reference_number.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1

    const { data, error, count } = await query
      .order(order_by, { ascending: order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('Error listing transactions:', error)
      return { success: false, error: 'Erro ao buscar transações' }
    }

    return {
      success: true,
      data: {
        transactions: data as TransactionWithRelations[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Error in listTransactions:', error)
    return { success: false, error: 'Erro ao buscar transações' }
  }
}

// Get single transaction
export async function getTransaction(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_categories(id, name, type, color),
        freights(id, freight_number, origin_city, destination_city),
        customers(id, name, document)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching transaction:', error)
      return { success: false, error: 'Transação não encontrada' }
    }

    return { success: true, data: data as TransactionWithRelations }
  } catch (error) {
    console.error('Error in getTransaction:', error)
    return { success: false, error: 'Erro ao buscar transação' }
  }
}

// Create transaction
export async function createTransaction(formData: TransactionFormData) {
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

    const validatedData = transactionSchema.parse(formData)

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...validatedData,
        company_id: profile.company_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return { success: false, error: 'Erro ao criar transação' }
    }

    revalidatePath('/financeiro')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in createTransaction:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar transação' }
  }
}

// Update transaction
export async function updateTransaction(id: string, formData: TransactionFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const validatedData = transactionSchema.parse(formData)

    const { data, error } = await supabase
      .from('transactions')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return { success: false, error: 'Erro ao atualizar transação' }
    }

    revalidatePath('/financeiro')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in updateTransaction:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar transação' }
  }
}

// Delete transaction
export async function deleteTransaction(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting transaction:', error)
      return { success: false, error: 'Erro ao excluir transação' }
    }

    revalidatePath('/financeiro')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteTransaction:', error)
    return { success: false, error: 'Erro ao excluir transação' }
  }
}

// Mark transaction as paid
export async function markTransactionAsPaid(
  id: string, 
  paymentDate: string, 
  paymentMethod: string
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'paid',
        payment_date: paymentDate,
        payment_method: paymentMethod,
      })
      .eq('id', id)

    if (error) {
      console.error('Error marking transaction as paid:', error)
      return { success: false, error: 'Erro ao marcar como pago' }
    }

    revalidatePath('/financeiro')

    return { success: true }
  } catch (error) {
    console.error('Error in markTransactionAsPaid:', error)
    return { success: false, error: 'Erro ao marcar como pago' }
  }
}

// Cancel transaction
export async function cancelTransaction(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      console.error('Error cancelling transaction:', error)
      return { success: false, error: 'Erro ao cancelar transação' }
    }

    revalidatePath('/financeiro')

    return { success: true }
  } catch (error) {
    console.error('Error in cancelTransaction:', error)
    return { success: false, error: 'Erro ao cancelar transação' }
  }
}
