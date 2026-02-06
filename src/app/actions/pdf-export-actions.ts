'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReportRequest } from '@/types/reports.types'
import {
  generateFreightReportData,
  generateFinancialReportData,
} from './report-data-actions'

// NOTE: jsPDF needs to run on client-side due to browser APIs
// This action prepares the data, actual PDF generation happens on client

export async function preparePDFData(request: ReportRequest) {
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

    return {
      success: true,
      data: {
        reportData,
        companyName: (profile.companies as any)?.name || 'Empresa',
        reportType: request.type,
        filters: request.filters,
      },
    }
  } catch (error) {
    console.error('Error preparing PDF data:', error)
    return { success: false, error: 'Erro ao preparar dados para PDF' }
  }
}
