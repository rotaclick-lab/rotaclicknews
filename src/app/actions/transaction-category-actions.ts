'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transactionCategorySchema, type TransactionCategoryFormData } from '@/lib/validations/financial.schema'

// List transaction categories
export async function listTransactionCategories(type?: 'income' | 'expense' | 'all') {
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

    let query = supabase
      .from('transaction_categories')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('name')

    if (error) {
      console.error('Error listing categories:', error)
      return { success: false, error: 'Erro ao buscar categorias' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in listTransactionCategories:', error)
    return { success: false, error: 'Erro ao buscar categorias' }
  }
}

// Create transaction category
export async function createTransactionCategory(formData: TransactionCategoryFormData) {
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

    const validatedData = transactionCategorySchema.parse(formData)

    const { data, error } = await supabase
      .from('transaction_categories')
      .insert({
        ...validatedData,
        company_id: profile.company_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { success: false, error: 'Erro ao criar categoria' }
    }

    revalidatePath('/financeiro')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in createTransactionCategory:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar categoria' }
  }
}

// Update transaction category
export async function updateTransactionCategory(id: string, formData: TransactionCategoryFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const validatedData = transactionCategorySchema.parse(formData)

    const { data, error } = await supabase
      .from('transaction_categories')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return { success: false, error: 'Erro ao atualizar categoria' }
    }

    revalidatePath('/financeiro')

    return { success: true, data }
  } catch (error: any) {
    console.error('Error in updateTransactionCategory:', error)
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar categoria' }
  }
}

// Delete transaction category
export async function deleteTransactionCategory(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { error } = await supabase
      .from('transaction_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: 'Erro ao excluir categoria' }
    }

    revalidatePath('/financeiro')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteTransactionCategory:', error)
    return { success: false, error: 'Erro ao excluir categoria' }
  }
}
