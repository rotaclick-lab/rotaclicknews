import { redirect } from 'next/navigation'
import { TransactionForm } from '@/components/financeiro/transaction-form'
import { listTransactionCategories } from '@/app/actions/transaction-category-actions'
import { createClient } from '@/lib/supabase/server'

interface NovaTransacaoPageProps {
  searchParams: {
    type?: 'income' | 'expense'
  }
}

export default async function NovaTransacaoPage({ searchParams }: NovaTransacaoPageProps) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/dashboard')
  }

  // Get categories
  const categoriesResult = await listTransactionCategories('all')
  const categories = categoriesResult.success ? categoriesResult.data : []

  const defaultType = searchParams.type || 'expense'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Transação</h1>
        <p className="text-muted-foreground">
          Registre uma nova receita ou despesa
        </p>
      </div>

      <TransactionForm
        categories={categories || []}
        defaultType={defaultType}
      />
    </div>
  )
}
