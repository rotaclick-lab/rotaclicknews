import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  DollarSign, 
  Users, 
  Truck, 
  Car,
  BarChart3,
  Download,
  Calendar
} from 'lucide-react'

export default async function RelatoriosPage() {
  const reportTypes = [
    {
      title: 'Relatório de Fretes',
      description: 'Análise completa de fretes realizados, valores e estatísticas',
      icon: FileText,
      href: '/relatorios/fretes',
      color: 'text-brand-600',
      bgColor: 'bg-brand-50',
    },
    {
      title: 'Relatório Financeiro',
      description: 'Receitas, despesas, fluxo de caixa e análise por categoria',
      icon: DollarSign,
      href: '/relatorios/financeiro',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Relatório de Clientes',
      description: 'Análise de clientes, top clientes e distribuição geográfica',
      icon: Users,
      href: '/relatorios/clientes',
      color: 'text-brand-700',
      bgColor: 'bg-brand-100',
    },
    {
      title: 'Relatório de Motoristas',
      description: 'Performance de motoristas, documentação e disponibilidade',
      icon: Truck,
      href: '/relatorios/motoristas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Relatório de Veículos',
      description: 'Utilização de frota, manutenções e documentação',
      icon: Car,
      href: '/relatorios/veiculos',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Relatório Executivo',
      description: 'Visão estratégica com KPIs e análises consolidadas',
      icon: BarChart3,
      href: '/relatorios/executivo',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-800">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios completos com gráficos e análises detalhadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-brand-200 text-brand-700 hover:bg-brand-50">
            <Link href="/relatorios/historico">
              <Calendar className="mr-2 h-4 w-4" />
              Histórico
            </Link>
          </Button>
          <Button asChild className="bg-brand-500 hover:bg-brand-600 text-white">
            <Link href="/relatorios/exportar">
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Link>
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Link key={report.href} href={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-brand-100">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50">
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card className="border-brand-100">
        <CardHeader>
          <CardTitle className="text-brand-800">Acesso Rápido</CardTitle>
          <CardDescription>Informações importantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exportações Hoje</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Este Mês</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
