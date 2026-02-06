'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReportFilterForm } from '@/components/relatorios/report-filter-form'
import { FinancialComparisonChart } from '@/components/relatorios/financial-comparison-chart'
import { CategoryPieChart } from '@/components/relatorios/category-pie-chart'
import { generateFinancialReportData } from '@/app/actions/report-data-actions'
import { downloadExport } from '@/app/actions/export-actions'
import { formatCurrency } from '@/lib/utils'
import { formatDateRange } from '@/lib/utils/date-range'
import type { ReportFiltersFormData } from '@/lib/validations/reports.schema'
import type { FinancialReportData } from '@/types/reports.types'
import { Download, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function RelatorioFinanceiroPage() {
  const [reportData, setReportData] = useState<FinancialReportData | null>(null)
  const [filters, setFilters] = useState<ReportFiltersFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleGenerateReport = async (filterData: ReportFiltersFormData) => {
    setIsLoading(true)
    setFilters(filterData)

    const result = await generateFinancialReportData(filterData)

    if (result.success) {
      setReportData(result.data)
      toast.success('Relatório gerado com sucesso!')
    } else {
      toast.error(result.error || 'Erro ao gerar relatório')
    }

    setIsLoading(false)
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!filters) return

    setIsExporting(true)

    const result = await downloadExport({
      type: 'financial',
      format,
      filters,
      include_charts: true,
      include_details: true,
    })

    if (result.success && result.data) {
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
      toast.error(result.error || 'Erro ao exportar relatório')
    }

    setIsExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório Financeiro</h1>
          <p className="text-muted-foreground">
            Análise de receitas, despesas e fluxo de caixa
          </p>
        </div>
        {reportData && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <ReportFilterForm onSubmit={handleGenerateReport} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <FinancialLoadingSkeleton />
          ) : reportData ? (
            <>
              {filters && filters.start_date && filters.end_date && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Relatório gerado para o período: <strong>{formatDateRange(filters.start_date, filters.end_date)}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.total_income)}
                    </div>
                    <p className="text-xs text-muted-foreground">Receitas pagas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.total_expense)}
                    </div>
                    <p className="text-xs text-muted-foreground">Despesas pagas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${reportData.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.net_balance)}
                    </div>
                    <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
                  </CardContent>
                </Card>
              </div>

              {reportData.cash_flow.length > 0 && (
                <FinancialComparisonChart data={reportData.cash_flow} />
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {reportData.by_category_income.length > 0 && (
                  <CategoryPieChart
                    data={reportData.by_category_income}
                    title="Receitas por Categoria"
                    description="Distribuição das receitas"
                    colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']}
                  />
                )}

                {reportData.by_category_expense.length > 0 && (
                  <CategoryPieChart
                    data={reportData.by_category_expense}
                    title="Despesas por Categoria"
                    description="Distribuição das despesas"
                    colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']}
                  />
                )}
              </div>

              {reportData.by_status.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Por Status</CardTitle>
                    <CardDescription>Distribuição por status das transações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.by_status.map((item) => (
                        <div key={item.status} className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium capitalize">{item.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Receitas</p>
                            <p className="font-bold text-green-600">{formatCurrency(item.income)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Despesas</p>
                            <p className="font-bold text-red-600">{formatCurrency(item.expense)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum relatório gerado</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure os filtros e clique em "Gerar Relatório"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function FinancialLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[400px]" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  )
}
