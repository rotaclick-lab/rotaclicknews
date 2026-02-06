'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReportRequest } from '@/types/reports.types'
import {
  generateFreightReportData,
  generateFinancialReportData,
  generateCustomerReportData,
  generateDriverReportData,
  generateVehicleReportData,
  generateExecutiveReportData,
} from './report-data-actions'

// Generate CSV Export
export async function generateCSVExport(request: ReportRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, companies(name)')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return { success: false, error: 'Empresa não encontrada' }
    }

    // Get report data based on type
    let reportData: any
    switch (request.type) {
      case 'freights':
        const freightResult = await generateFreightReportData(request.filters)
        if (!freightResult.success) return freightResult
        reportData = freightResult.data
        break
      case 'financial':
        const financialResult = await generateFinancialReportData(request.filters)
        if (!financialResult.success) return financialResult
        reportData = financialResult.data
        break
      case 'customers':
        const customerResult = await generateCustomerReportData(request.filters)
        if (!customerResult.success) return customerResult
        reportData = customerResult.data
        break
      case 'drivers':
        const driverResult = await generateDriverReportData(request.filters)
        if (!driverResult.success) return driverResult
        reportData = driverResult.data
        break
      case 'vehicles':
        const vehicleResult = await generateVehicleReportData(request.filters)
        if (!vehicleResult.success) return vehicleResult
        reportData = vehicleResult.data
        break
      case 'executive':
        const executiveResult = await generateExecutiveReportData(request.filters)
        if (!executiveResult.success) return executiveResult
        reportData = executiveResult.data
        break
      default:
        return { success: false, error: 'Tipo de relatório inválido' }
    }

    // Convert to CSV
    const csv = convertToCSV(reportData, request.type)
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${request.type}_${timestamp}.csv`
    
    return {
      success: true,
      data: {
        filename,
        content: csv,
        mime_type: 'text/csv',
      },
    }
  } catch (error) {
    console.error('Error generating CSV export:', error)
    return { success: false, error: 'Erro ao gerar exportação CSV' }
  }
}

// Helper: Convert data to CSV
function convertToCSV(data: any, type: string): string {
  let csv = ''
  
  if (type === 'freights' && data.freights) {
    csv += 'Número,Cliente,Origem,Destino,Status,Valor,Data\n'
    
    data.freights.forEach((freight: any) => {
      csv += `${freight.freight_number || ''},`
      csv += `${freight.customers?.name || ''},`
      csv += `"${freight.origin_city}/${freight.origin_state}",`
      csv += `"${freight.destination_city}/${freight.destination_state}",`
      csv += `${freight.status},`
      csv += `${freight.total_value || 0},`
      csv += `${new Date(freight.created_at).toLocaleDateString('pt-BR')}\n`
    })
  } else if (type === 'financial' && data.transactions) {
    csv += 'Data,Tipo,Categoria,Descrição,Valor,Status\n'
    
    data.transactions.forEach((t: any) => {
      csv += `${new Date(t.due_date).toLocaleDateString('pt-BR')},`
      csv += `${t.type === 'income' ? 'Receita' : 'Despesa'},`
      csv += `${t.transaction_categories?.name || 'Sem categoria'},`
      csv += `"${t.description}",`
      csv += `${t.amount},`
      csv += `${t.status}\n`
    })
  }
  
  return csv
}

// Download export file
export async function downloadExport(request: ReportRequest) {
  try {
    if (request.format !== 'csv') {
      return { success: false, error: 'Apenas CSV está disponível no momento. Excel e PDF em breve!' }
    }

    const result = await generateCSVExport(request)

    if (!result.success) {
      return result
    }

    return {
      success: true,
      data: {
        filename: result.data!.filename,
        content: result.data!.content,
        mime_type: result.data!.mime_type,
      },
    }
  } catch (error) {
    console.error('Error downloading export:', error)
    return { success: false, error: 'Erro ao baixar arquivo' }
  }
}
