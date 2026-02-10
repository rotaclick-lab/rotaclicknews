import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function ExportarDadosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/relatorios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exportar Dados</h1>
            <p className="text-muted-foreground">
              Exporte seus dados em diferentes formatos
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Exportar para Excel</CardTitle>
                <CardDescription>
                  Formato XLSX para análise em planilhas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selecione os dados</label>
                <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                  <option>Todos os dados</option>
                  <option>Apenas fretes</option>
                  <option>Apenas clientes</option>
                  <option>Apenas motoristas</option>
                  <option>Apenas veículos</option>
                  <option>Apenas financeiro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Período</label>
                <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                  <option>Últimos 30 dias</option>
                  <option>Últimos 3 meses</option>
                  <option>Últimos 6 meses</option>
                  <option>Este ano</option>
                  <option>Todo o período</option>
                </select>
              </div>
              <Button className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel (em breve)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle>Exportar para PDF</CardTitle>
                <CardDescription>
                  Relatório formatado para impressão
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de relatório</label>
                <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                  <option>Relatório completo</option>
                  <option>Relatório de fretes</option>
                  <option>Relatório financeiro</option>
                  <option>Relatório de motoristas</option>
                  <option>Relatório de veículos</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Período</label>
                <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                  <option>Últimos 30 dias</option>
                  <option>Últimos 3 meses</option>
                  <option>Últimos 6 meses</option>
                  <option>Este ano</option>
                  <option>Todo o período</option>
                </select>
              </div>
              <Button className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF (em breve)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Os dados exportados respeitam as permissões de acesso da sua empresa
          </p>
          <p>
            • Você pode exportar até 10.000 registros por vez
          </p>
          <p>
            • Os arquivos ficam disponíveis para download por 24 horas
          </p>
          <p>
            • Exportações maiores podem levar alguns minutos para processar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
