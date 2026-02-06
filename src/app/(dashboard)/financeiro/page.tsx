import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getFinancialDashboard } from '@/app/actions/financial-stats-actions'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, DollarSign } from 'lucide-react'

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle de receitas, despesas e fluxo de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/financeiro/receitas">Receitas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/financeiro/despesas">Despesas</Link>
          </Button>
          <Button asChild>
            <Link href="/financeiro/transacoes/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <FinancialDashboardContent />
      </Suspense>
    </div>
  )
}

async function FinancialDashboardContent() {
  const result = await getFinancialDashboard()

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    )
  }

  const { stats, upcoming_payments, overdue_payments } = result.data as any

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.net_balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas menos despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paid_income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.income_count} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.paid_expense)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.expense_count} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pending_income + stats.overdue_income)}
            </div>
            {stats.overdue_income > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Vencido: {formatCurrency(stats.overdue_income)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {overdue_payments.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem {overdue_payments.length} transação(ões) vencida(s)
          </AlertDescription>
        </Alert>
      )}

      {upcoming_payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming_payments.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                  <div>
                    <p className="font-medium">{t.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Vence: {new Date(t.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
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
  )
}
