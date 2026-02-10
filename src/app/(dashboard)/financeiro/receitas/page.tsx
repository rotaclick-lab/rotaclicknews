import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionCard } from '@/components/financeiro/transaction-card'
import { listTransactions } from '@/app/actions/transaction-actions'
import { Plus } from 'lucide-react'

interface ReceitasPageProps {
  searchParams: {
    page?: string
    status?: string
  }
}

export default async function ReceitasPage({ searchParams }: ReceitasPageProps) {
  const page = Number(searchParams.page) || 1
  const status = searchParams.status || 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground">
            Contas a receber e receitas pagas
          </p>
        </div>
        <Button asChild>
          <Link href="/financeiro/transacoes/nova?type=income">
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ListLoadingSkeleton />}>
        <ReceitasList page={page} status={status} />
      </Suspense>
    </div>
  )
}

async function ReceitasList({ page, status }: { page: number; status: string }) {
  const result = await listTransactions({
    page,
    per_page: 12,
    filters: {
      type: 'income',
      status: status !== 'all' ? status as any : undefined,
    },
  })

  if (!result.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    )
  }

  const { transactions, total } = result.data

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma receita encontrada.
            </p>
            <Button asChild>
              <Link href="/financeiro/transacoes/nova?type=income">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Receita
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {transactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {total > 12 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" asChild disabled={page <= 1}>
            <Link href={`/financeiro/receitas?page=${page - 1}&status=${status}`}>
              Anterior
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {Math.ceil(total / 12)}
          </span>
          <Button variant="outline" asChild disabled={page >= Math.ceil(total / 12)}>
            <Link href={`/financeiro/receitas?page=${page + 1}&status=${status}`}>
              Próxima
            </Link>
          </Button>
        </div>
      )}
    </>
  )
}

function ListLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  )
}
