-- Migration: Create Financial Tables (transactions and transaction_categories)
-- Created: 2026-02-06

-- =============================================================================
-- 1. CREATE TABLE: transaction_categories
-- =============================================================================

CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  
  -- Aparência
  color TEXT,
  icon TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_category_per_company UNIQUE (company_id, name, type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transaction_categories_company ON transaction_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(type);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_active ON transaction_categories(is_active);

-- =============================================================================
-- 2. CREATE TABLE: transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo e Categoria
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE RESTRICT,
  
  -- Informações básicas
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date DATE,
  
  -- Pagamento
  payment_method TEXT CHECK (
    payment_method IS NULL OR 
    payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'boleto', 'check', 'other')
  ),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'overdue', 'cancelled')
  ),
  
  -- Relacionamentos (opcionais)
  freight_id UUID REFERENCES freights(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Informações adicionais
  supplier_name TEXT,
  reference_number TEXT,
  notes TEXT,
  attachment_url TEXT,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval TEXT CHECK (
    recurrence_interval IS NULL OR 
    recurrence_interval IN ('monthly', 'quarterly', 'yearly')
  ),
  recurrence_count INTEGER CHECK (recurrence_count IS NULL OR recurrence_count > 0),
  parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_payment CHECK (
    (status = 'paid' AND payment_date IS NOT NULL AND payment_method IS NOT NULL) OR
    (status != 'paid')
  ),
  CONSTRAINT valid_recurrence CHECK (
    (is_recurring = TRUE AND recurrence_interval IS NOT NULL AND recurrence_count IS NOT NULL) OR
    (is_recurring = FALSE OR is_recurring IS NULL)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_freight ON transactions(freight_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_type ON transactions(company_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_company_status ON transactions(company_id, status);

-- =============================================================================
-- 3. TRIGGERS
-- =============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para transaction_categories
DROP TRIGGER IF EXISTS update_transaction_categories_updated_at ON transaction_categories;
CREATE TRIGGER update_transaction_categories_updated_at
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar status vencido
CREATE OR REPLACE FUNCTION update_transaction_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE transactions
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar transações vencidas
DROP TRIGGER IF EXISTS check_overdue_transactions ON transactions;
CREATE TRIGGER check_overdue_transactions
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_transaction_overdue_status();

-- =============================================================================
-- 4. VIEWS (Opcional - Melhora Performance)
-- =============================================================================

-- View: Resumo Financeiro por Mês
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  company_id,
  DATE_TRUNC('month', due_date) AS month,
  type,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_amount,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_amount,
  SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) AS overdue_amount,
  COUNT(*) AS transaction_count
FROM transactions
GROUP BY company_id, DATE_TRUNC('month', due_date), type;

-- View: Total por Categoria
CREATE OR REPLACE VIEW category_totals AS
SELECT 
  t.company_id,
  t.category_id,
  tc.name AS category_name,
  tc.type,
  SUM(t.amount) AS total_amount,
  COUNT(t.id) AS transaction_count
FROM transactions t
JOIN transaction_categories tc ON t.category_id = tc.id
WHERE t.status != 'cancelled'
GROUP BY t.company_id, t.category_id, tc.name, tc.type;

-- =============================================================================
-- SUCCESS!
-- =============================================================================
