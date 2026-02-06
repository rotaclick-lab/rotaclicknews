'use server'

import { createClient } from '@/lib/supabase/server'
import type { FinancialStats } from '@/types/financial.types'

// Get financial statistics
export async function getFinancialStats(startDate?: string, endDate?: string) {
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
      .from('transactions')
      .select('type, status, amount')
      .eq('company_id', profile.company_id)

    if (startDate) {
      query = query.gte('due_date', startDate)
    }

    if (endDate) {
      query = query.lte('due_date', endDate)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching financial stats:', error)
      return { success: false, error: 'Erro ao buscar estatísticas' }
    }

    // Calculate stats
    const stats: FinancialStats = {
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
      pending_income: 0,
      pending_expense: 0,
      overdue_income: 0,
      overdue_expense: 0,
      paid_income: 0,
      paid_expense: 0,
      income_count: 0,
      expense_count: 0,
    }

    transactions?.forEach((t: any) => {
      if (t.type === 'income') {
        stats.income_count++
        stats.total_income += t.amount
        
        if (t.status === 'paid') {
          stats.paid_income += t.amount
        } else if (t.status === 'pending') {
          stats.pending_income += t.amount
        } else if (t.status === 'overdue') {
          stats.overdue_income += t.amount
        }
      } else if (t.type === 'expense') {
        stats.expense_count++
        stats.total_expense += t.amount
        
        if (t.status === 'paid') {
          stats.paid_expense += t.amount
        } else if (t.status === 'pending') {
          stats.pending_expense += t.amount
        } else if (t.status === 'overdue') {
          stats.overdue_expense += t.amount
        }
      }
    })

    stats.net_balance = stats.paid_income - stats.paid_expense

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error in getFinancialStats:', error)
    return { success: false, error: 'Erro ao buscar estatísticas' }
  }
}

// Get complete financial dashboard data
export async function getFinancialDashboard() {
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

    // Date ranges
    const today = new Date()
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get stats
    const statsResult = await getFinancialStats(currentMonthStart, currentMonthEnd)
    
    if (!statsResult.success) return statsResult

    // Get upcoming and overdue payments
    const { data: upcomingPayments } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_categories(id, name, type, color)
      `)
      .eq('company_id', profile.company_id)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString().split('T')[0])
      .order('due_date')
      .limit(5)

    const { data: overduePayments } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_categories(id, name, type, color)
      `)
      .eq('company_id', profile.company_id)
      .eq('status', 'overdue')
      .order('due_date')
      .limit(5)

    const dashboard = {
      stats: statsResult.data!,
      upcoming_payments: upcomingPayments || [],
      overdue_payments: overduePayments || [],
    }

    return { success: true, data: dashboard }
  } catch (error) {
    console.error('Error in getFinancialDashboard:', error)
    return { success: false, error: 'Erro ao buscar dashboard financeiro' }
  }
}
