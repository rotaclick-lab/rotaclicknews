// Types from database (will be generated from Supabase)
export type Transaction = {
  id: string
  company_id: string
  type: 'income' | 'expense'
  category_id: string
  description: string
  amount: number
  due_date: string
  payment_date?: string | null
  payment_method?: string | null
  status: string
  freight_id?: string | null
  customer_id?: string | null
  supplier_name?: string | null
  reference_number?: string | null
  notes?: string | null
  is_recurring?: boolean
  recurrence_interval?: string | null
  recurrence_count?: number | null
  attachment_url?: string | null
  created_at: string
  updated_at: string
}

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
export type TransactionUpdate = Partial<TransactionInsert>

export type TransactionCategory = {
  id: string
  company_id: string
  name: string
  type: 'income' | 'expense'
  description?: string | null
  color?: string | null
  icon?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TransactionCategoryInsert = Omit<TransactionCategory, 'id' | 'created_at' | 'updated_at'>
export type TransactionCategoryUpdate = Partial<TransactionCategoryInsert>

// Enums
export const TRANSACTION_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export type TransactionTypeEnum = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE]

export const TRANSACTION_TYPE_LABELS: Record<TransactionTypeEnum, string> = {
  income: 'Receita',
  expense: 'Despesa',
}

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS]

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  paid: 'text-green-700 bg-green-50 border-green-200',
  overdue: 'text-red-700 bg-red-50 border-red-200',
  cancelled: 'text-gray-700 bg-gray-50 border-gray-200',
}

export const PAYMENT_METHOD = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PIX: 'pix',
  BOLETO: 'boleto',
  CHECK: 'check',
  OTHER: 'other',
} as const

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  bank_transfer: 'Transferência Bancária',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
  check: 'Cheque',
  other: 'Outro',
}

// Extended types with relations
export interface TransactionWithRelations extends Transaction {
  transaction_categories?: TransactionCategory
  freights?: {
    id: string
    freight_number: string
    origin_city: string
    destination_city: string
  }
  customers?: {
    id: string
    name: string
    document: string
  }
}

// Form data types
export interface TransactionFormData {
  type: TransactionTypeEnum
  category_id: string
  description: string
  amount: number
  due_date: string
  payment_date?: string | null
  payment_method?: PaymentMethod | null
  status: TransactionStatus
  freight_id?: string | null
  customer_id?: string | null
  supplier_name?: string | null
  reference_number?: string | null
  notes?: string | null
  is_recurring?: boolean
  recurrence_interval?: 'monthly' | 'quarterly' | 'yearly' | null
  recurrence_count?: number | null
  attachment_url?: string | null
}

// Filter types
export interface TransactionFilters {
  type?: TransactionTypeEnum | 'all'
  status?: TransactionStatus | 'all'
  category_id?: string
  payment_method?: PaymentMethod
  freight_id?: string
  customer_id?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
}

// List params
export interface TransactionListParams {
  page?: number
  per_page?: number
  order_by?: string
  order?: 'asc' | 'desc'
  filters?: TransactionFilters
  search?: string
}

// Financial stats
export interface FinancialStats {
  total_income: number
  total_expense: number
  net_balance: number
  pending_income: number
  pending_expense: number
  overdue_income: number
  overdue_expense: number
  paid_income: number
  paid_expense: number
  income_count: number
  expense_count: number
}

// Cash flow data
export interface CashFlowData {
  date: string
  income: number
  expense: number
  balance: number
}

// Category stats
export interface CategoryStats {
  category_id: string
  category_name: string
  total_amount: number
  transaction_count: number
  percentage: number
}

// Period comparison
export interface PeriodComparison {
  current_period: {
    start_date: string
    end_date: string
    income: number
    expense: number
    balance: number
  }
  previous_period: {
    start_date: string
    end_date: string
    income: number
    expense: number
    balance: number
  }
  income_growth: number
  expense_growth: number
  balance_growth: number
}

// Dashboard data
export interface FinancialDashboard {
  stats: FinancialStats
  cash_flow: CashFlowData[]
  income_by_category: CategoryStats[]
  expense_by_category: CategoryStats[]
  upcoming_payments: TransactionWithRelations[]
  overdue_payments: TransactionWithRelations[]
  period_comparison: PeriodComparison
}
