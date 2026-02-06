'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDateRange } from '@/lib/utils/date-range'
import type { 
  ReportFilters,
  FreightReportData,
  FinancialReportData,
  CustomerReportData,
  DriverReportData,
  VehicleReportData,
  ExecutiveReportData
} from '@/types/reports.types'

// Generate Freight Report Data
export async function generateFreightReportData(filters: ReportFilters) {
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

    const dateRange = calculateDateRange(filters.period, filters.start_date, filters.end_date)

    let query = supabase
      .from('freights')
      .select(`
        *,
        customers(name),
        drivers(name),
        vehicles(plate)
      `)
      .eq('company_id', profile.company_id)
      .gte('created_at', dateRange.start_date)
      .lte('created_at', dateRange.end_date)

    if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
    if (filters.driver_id) query = query.eq('driver_id', filters.driver_id)
    if (filters.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id)
    if (filters.status) query = query.eq('status', filters.status)

    const { data: freights, error } = await query

    if (error) {
      console.error('Error fetching freight data:', error)
      return { success: false, error: 'Erro ao buscar dados de fretes' }
    }

    const reportData: FreightReportData = {
      total_freights: freights?.length || 0,
      total_value: freights?.reduce((sum, f) => sum + (f.total_value || 0), 0) || 0,
      average_value: freights?.length 
        ? freights.reduce((sum, f) => sum + (f.total_value || 0), 0) / freights.length 
        : 0,
      by_status: [],
      by_origin: [],
      by_destination: [],
      by_customer: [],
      by_driver: [],
      by_vehicle: [],
      timeline: [],
      freights: freights || [],
    }

    // Group by status
    const statusMap = new Map<string, { count: number; total: number }>()
    freights?.forEach(f => {
      const existing = statusMap.get(f.status) || { count: 0, total: 0 }
      statusMap.set(f.status, {
        count: existing.count + 1,
        total: existing.total + (f.total_value || 0),
      })
    })
    reportData.by_status = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      total: data.total,
    }))

    // Group by customer
    const customerMap = new Map<string, { count: number; total: number }>()
    freights?.forEach(f => {
      if (!f.customers) return
      const name = f.customers.name
      const existing = customerMap.get(name) || { count: 0, total: 0 }
      customerMap.set(name, {
        count: existing.count + 1,
        total: existing.total + (f.total_value || 0),
      })
    })
    reportData.by_customer = Array.from(customerMap.entries())
      .map(([customer_name, data]) => ({ customer_name, count: data.count, total: data.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Timeline
    const timelineMap = new Map<string, { count: number; total: number }>()
    freights?.forEach(f => {
      const date = f.created_at.split('T')[0]
      const existing = timelineMap.get(date) || { count: 0, total: 0 }
      timelineMap.set(date, {
        count: existing.count + 1,
        total: existing.total + (f.total_value || 0),
      })
    })
    reportData.timeline = Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, count: data.count, total: data.total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error in generateFreightReportData:', error)
    return { success: false, error: 'Erro ao gerar relatório de fretes' }
  }
}

// Generate Financial Report Data
export async function generateFinancialReportData(filters: ReportFilters) {
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

    const dateRange = calculateDateRange(filters.period, filters.start_date, filters.end_date)

    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_categories(name)
      `)
      .eq('company_id', profile.company_id)
      .gte('due_date', dateRange.start_date)
      .lte('due_date', dateRange.end_date)

    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.status) query = query.eq('status', filters.status)

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching financial data:', error)
      return { success: false, error: 'Erro ao buscar dados financeiros' }
    }

    const reportData: FinancialReportData = {
      total_income: 0,
      total_expense: 0,
      net_balance: 0,
      by_status: [],
      by_category_income: [],
      by_category_expense: [],
      by_payment_method: [],
      cash_flow: [],
      transactions: transactions || [],
    }

    transactions?.forEach(t => {
      if (t.type === 'income' && t.status === 'paid') {
        reportData.total_income += t.amount
      } else if (t.type === 'expense' && t.status === 'paid') {
        reportData.total_expense += t.amount
      }
    })
    reportData.net_balance = reportData.total_income - reportData.total_expense

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error in generateFinancialReportData:', error)
    return { success: false, error: 'Erro ao gerar relatório financeiro' }
  }
}

// Placeholders for other report generators
export async function generateCustomerReportData(filters: ReportFilters) {
  return { success: true, data: {} as CustomerReportData }
}

export async function generateDriverReportData(filters: ReportFilters) {
  return { success: true, data: {} as DriverReportData }
}

export async function generateVehicleReportData(filters: ReportFilters) {
  return { success: true, data: {} as VehicleReportData }
}

export async function generateExecutiveReportData(filters: ReportFilters) {
  return { success: true, data: {} as ExecutiveReportData }
}
