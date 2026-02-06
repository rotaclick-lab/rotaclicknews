'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReportFilterForm } from '@/components/relatorios/report-filter-form'
import { FreightTimelineChart } from '@/components/relatorios/freight-timeline-chart'
import { generateFreightReportData } from '@/app/actions/report-data-actions'
import { downloadExport } from '@/app/actions/export-actions'
import { formatCurrency } from '@/lib/utils'
import { formatDateRange } from '@/lib/utils/date-range'
import type { ReportFiltersFormData } from '@/lib/validations/reports.schema'
import type { FreightReportData } from '@/types/reports.types'
import { Download, FileText, TrendingUp, MapPin, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function RelatorioFretesPage() {
  const [reportData, setReportData] = useState<FreightReportData | null>(null)
  const [filters, setFilters] = useState<ReportFiltersFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleGenerateReport = async (filterData: ReportFiltersFormData) => {
    setIsLoading(true)
    setFilters(filterData)

    const result = await generateFreightReportData(filterData)

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
      type: 'freights',
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
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Fretes</h1>
          <p className="text-muted-foreground">
            Análise completa de fretes, valores e estatísticas
          </p>
        </div>
        {reportData && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
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
            <LoadingSkeleton />
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
                    <CardTitle className="text-sm font-medium">Total de Fretes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.total_freights}</div>
                    <p className="text-xs text-muted-foreground">Fretes no período</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.total_value)}
                    </div>
                    <p className="text-xs text-muted-foreground">Receita total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.average_value)}
                    </div>
                    <p className="text-xs text-muted-foreground">Por frete</p>
                  </CardContent>
                </Card>
              </div>

              {reportData.timeline.length > 0 && (
                <FreightTimelineChart data={reportData.timeline} />
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {reportData.by_status.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Por Status</CardTitle>
                      <CardDescription>Distribuição por status do frete</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.by_status.map((item) => (
                          <div key={item.status} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{item.status}</p>
                              <p className="text-sm text-muted-foreground">{item.count} frete(s)</p>
                            </div>
                            <p className="font-bold">{formatCurrency(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {reportData.by_customer.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Clientes
                      </CardTitle>
                      <CardDescription>Clientes com maior volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.by_customer.slice(0, 5).map((item) => (
                          <div key={item.customer_name} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{item.count} frete(s)</p>
                            </div>
                            <p className="font-bold">{formatCurrency(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {reportData.by_origin.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Top Origens
                      </CardTitle>
                      <CardDescription>Estados com mais fretes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.by_origin.slice(0, 5).map((item) => (
                          <div key={item.state} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.state}</p>
                              <p className="text-sm text-muted-foreground">{item.count} frete(s)</p>
                            </div>
                            <p className="font-bold">{formatCurrency(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {reportData.by_destination.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Top Destinos
                      </CardTitle>
                      <CardDescription>Estados de destino</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.by_destination.slice(0, 5).map((item) => (
                          <div key={item.state} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.state}</p>
                              <p className="text-sm text-muted-foreground">{item.count} frete(s)</p>
                            </div>
                            <p className="font-bold">{formatCurrency(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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

function LoadingSkeleton() {
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
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  )
}
