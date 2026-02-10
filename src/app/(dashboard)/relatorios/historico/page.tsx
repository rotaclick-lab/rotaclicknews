import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default async function HistoricoRelatoriosPage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Relatórios</h1>
            <p className="text-muted-foreground">
              Acesse relatórios gerados anteriormente
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre por período, tipo de relatório ou status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Período</label>
              <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Últimos 3 meses</option>
                <option>Este ano</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Tipo</label>
              <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2">
                <option>Todos</option>
                <option>Fretes</option>
                <option>Financeiro</option>
                <option>Motoristas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Relatório de Fretes - Janeiro 2026
              </CardTitle>
              <CardDescription>
                Gerado em 05/02/2026 às 14:30
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Relatório Financeiro - Dezembro 2025
              </CardTitle>
              <CardDescription>
                Gerado em 02/01/2026 às 09:15
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Relatório de Motoristas - 4º Trimestre 2025
              </CardTitle>
              <CardDescription>
                Gerado em 20/12/2025 às 16:45
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </CardHeader>
        </Card>
      </div>

      {/* Empty State (commented for now) */}
      {/* 
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não gerou nenhum relatório
          </p>
          <Button asChild>
            <Link href="/relatorios">
              Gerar Relatório
            </Link>
          </Button>
        </CardContent>
      </Card>
      */}
    </div>
  )
}
