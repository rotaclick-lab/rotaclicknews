'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReportRequest } from '@/types/reports.types'
import {
  generateFreightReportData,
  generateFinancialReportData,
} from './report-data-actions'
import * as XLSX from 'xlsx'

// Generate Excel Export
export async function generateExcelExport(request: ReportRequest) {
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

    // Get report data
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
      default:
        return { success: false, error: 'Tipo de relatório não suportado ainda' }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    if (request.type === 'freights' && reportData.freights) {
      // Summary sheet
      const summaryData = [
        ['RELATÓRIO DE FRETES'],
        ['Empresa', (profile.companies as any)?.name || ''],
        [''],
        ['RESUMO'],
        ['Total de Fretes', reportData.total_freights],
        ['Valor Total', reportData.total_value],
        ['Valor Médio', reportData.average_value],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

      // Freights data sheet
      const freightsData = reportData.freights.map((f: any) => ({
        'Número': f.freight_number || '',
        'Cliente': f.customers?.name || '',
        'Origem': `${f.origin_city}/${f.origin_state}`,
        'Destino': `${f.destination_city}/${f.destination_state}`,
        'Status': f.status,
        'Valor': f.total_value || 0,
        'Data': new Date(f.created_at).toLocaleDateString('pt-BR'),
      }))
      const freightsSheet = XLSX.utils.json_to_sheet(freightsData)
      XLSX.utils.book_append_sheet(workbook, freightsSheet, 'Fretes')

      // By status sheet
      if (reportData.by_status && reportData.by_status.length > 0) {
        const statusData = reportData.by_status.map((item: any) => ({
          'Status': item.status,
          'Quantidade': item.count,
          'Valor Total': item.total,
        }))
        const statusSheet = XLSX.utils.json_to_sheet(statusData)
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Por Status')
      }
    } else if (request.type === 'financial' && reportData.transactions) {
      // Summary sheet
      const summaryData = [
        ['RELATÓRIO FINANCEIRO'],
        ['Empresa', (profile.companies as any)?.name || ''],
        [''],
        ['RESUMO'],
        ['Total Receitas', reportData.total_income],
        ['Total Despesas', reportData.total_expense],
        ['Saldo', reportData.net_balance],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')

      // Transactions sheet
      const transactionsData = reportData.transactions.map((t: any) => ({
        'Data': new Date(t.due_date).toLocaleDateString('pt-BR'),
        'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
        'Categoria': t.transaction_categories?.name || 'Sem categoria',
        'Descrição': t.description,
        'Valor': t.amount,
        'Status': t.status,
      }))
      const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transações')
    }

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    const base64 = excelBuffer.toString('base64')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${request.type}_${timestamp}.xlsx`

    return {
      success: true,
      data: {
        filename,
        content: base64,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    }
  } catch (error) {
    console.error('Error generating Excel export:', error)
    return { success: false, error: 'Erro ao gerar exportação Excel' }
  }
}
