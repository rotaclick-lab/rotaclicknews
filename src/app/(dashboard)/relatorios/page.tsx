'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReportFilterForm } from '@/components/relatorios/report-filter-form'
import { generateFreightReportData, generateFinancialReportData } from '@/app/actions/report-data-actions'
import { downloadExport } from '@/app/actions/export-actions'
import { formatCurrency } from '@/lib/utils'
import { REPORT_TYPE_LABELS, EXPORT_FORMAT_LABELS } from '@/types/reports.types'
import type { ReportType, ExportFormat, ReportFiltersFormData } from '@/types/reports.types'
import { BarChart3, Download, FileText, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function RelatoriosPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('freights')
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleGenerateReport = async (filters: ReportFiltersFormData) => {
    setIsLoading(true)
    setReportData(null)

    try {
      let result
      if (selectedType === 'freights') {
        result = await generateFreightReportData(filters)
      } else if (selectedType === 'financial') {
        result = await generateFinancialReportData(filters)
      } else {
        toast.error('Tipo de relatório ainda não implementado')
        setIsLoading(false)
        return
      }

      if (result.success) {
        setReportData(result.data)
        toast.success('Relatório gerado com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Erro ao gerar relatório')
    }

    setIsLoading(false)
  }

  const handleExport = async () => {
    if (!reportData) {
      toast.error('Gere um relatório primeiro')
      return
    }

    setIsExporting(true)

    try {
      const result = await downloadExport({
        type: selectedType,
        format: selectedFormat,
        filters: { period: 'this_month' },
        include_charts: false,
        include_details: true,
      })

      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data.content], { type: result.data.mime_type })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success('Arquivo baixado com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao exportar')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Erro ao exportar relatório')
    }

    setIsExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios personalizados e exporte em diversos formatos
          </p>
        </div>
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar - Filters */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipo de Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} disabled={value !== 'csv'}>
                      {label} {value !== 'csv' && '(em breve)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <ReportFilterForm
            onSubmit={handleGenerateReport}
            showCustomerFilter={selectedType === 'freights'}
            showDriverFilter={selectedType === 'freights' || selectedType === 'drivers'}
            showVehicleFilter={selectedType === 'freights' || selectedType === 'vehicles'}
            showCategoryFilter={selectedType === 'financial'}
          />

          {reportData && (
            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : `Exportar ${EXPORT_FORMAT_LABELS[selectedFormat]}`}
            </Button>
          )}
        </div>

        {/* Main Content - Report View */}
        <div className="space-y-4">
          {!reportData && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum relatório gerado</p>
                <p className="text-sm text-muted-foreground text-center">
                  Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-sm text-muted-foreground">Gerando relatório...</p>
              </CardContent>
            </Card>
          )}

          {reportData && selectedType === 'freights' && (
            <FreightReportView data={reportData} />
          )}

          {reportData && selectedType === 'financial' && (
            <FinancialReportView data={reportData} />
          )}
        </div>
      </div>
    </div>
  )
}

function FreightReportView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Fretes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_freights}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.total_value)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.average_value)}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.by_status && data.by_status.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fretes por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.by_status.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium capitalize">{item.status}</p>
                    <p className="text-sm text-muted-foreground">{item.count} fretes</p>
                  </div>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FinancialReportView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.total_income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.total_expense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.net_balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Relatório financeiro gerado com sucesso. Use o botão "Exportar CSV" para baixar os dados completos.
        </AlertDescription>
      </Alert>
    </div>
  )
}
