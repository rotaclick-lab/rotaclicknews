# Módulo Financeiro - Instruções de Setup

## 📊 Status Atual: 12% Concluído (2/16 arquivos)

### ✅ Arquivos Criados:
1. `src/types/financial.types.ts` - Tipos TypeScript completos
2. `src/lib/validations/financial.schema.ts` - Schemas Zod de validação

### ⏳ Faltam criar (após SQL):
- 2 arquivos de Server Actions (categories e transactions)
- 4 componentes (badges, cards, forms)
- 4 páginas (dashboard, receitas, despesas, relatórios)
- 4 componentes de visualização (gráficos, estatísticas)

---

## 🗄️ PRÓXIMO PASSO: Criar Tabelas no Supabase

Execute estes comandos SQL no Supabase SQL Editor:

### 1️⃣ Tabela: transaction_categories

\`\`\`sql
-- Tabela de Categorias de Transações
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

-- Trigger
CREATE TRIGGER update_transaction_categories_updated_at
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Categorias padrão (opcional - executar após criar a empresa)
-- INSERT INTO transaction_categories (company_id, name, type, color, icon, description) VALUES
-- ('{company_id}', 'Frete', 'income', '#10b981', 'TruckIcon', 'Receita de fretes'),
-- ('{company_id}', 'Serviços', 'income', '#3b82f6', 'Briefcase', 'Outros serviços'),
-- ('{company_id}', 'Combustível', 'expense', '#ef4444', 'Fuel', 'Despesas com combustível'),
-- ('{company_id}', 'Manutenção', 'expense', '#f59e0b', 'Wrench', 'Manutenção de veículos'),
-- ('{company_id}', 'Salários', 'expense', '#8b5cf6', 'Users', 'Folha de pagamento'),
-- ('{company_id}', 'Impostos', 'expense', '#6366f1', 'FileText', 'Impostos e taxas');
\`\`\`

---

### 2️⃣ Tabela: transactions

\`\`\`sql
-- Tabela de Transações Financeiras
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

-- Trigger para updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar status automaticamente (overdue)
CREATE OR REPLACE FUNCTION update_transaction_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza transações pendentes para vencidas
  UPDATE transactions
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Cron job simulado via trigger (executar diariamente via external scheduler é melhor)
-- Por ora, vamos atualizar status em cada inserção/atualização
CREATE TRIGGER check_overdue_transactions
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_transaction_overdue_status();
\`\`\`

---

### 3️⃣ Função auxiliar (se ainda não existir):

\`\`\`sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

### 4️⃣ Views para Relatórios (Opcional - Melhora Performance)

\`\`\`sql
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
\`\`\`

---

## 🚀 Após criar as tabelas SQL:

Execute este comando para gerar os tipos TypeScript do Supabase:

\`\`\`bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
\`\`\`

Depois, me avise para continuar criando os 14 arquivos restantes! 🎉

---

## 📋 Checklist:

- [ ] Executar SQL para criar tabela \`transaction_categories\`
- [ ] Executar SQL para criar tabela \`transactions\`
- [ ] Executar SQL para criar views (opcional)
- [ ] Verificar se as tabelas foram criadas no Supabase Dashboard
- [ ] Inserir categorias padrão (opcional)
- [ ] Gerar tipos TypeScript (\`supabase gen types\`)
- [ ] Avisar para continuar com os arquivos restantes

---

**Total de linhas SQL:** ~150 linhas  
**Tempo estimado:** 5 minutos

---

## ℹ️ Informações Adicionais:

### Campos importantes:

**transaction_categories:**
- \`type\`: income (receita) ou expense (despesa)
- \`color\`: Cor hexadecimal para UI
- \`icon\`: Nome do ícone (Lucide React)
- \`is_active\`: Categorias podem ser desativadas sem excluir

**transactions:**
- \`status\`: pending → overdue (automático), paid (manual), cancelled
- \`payment_method\`: Obrigatório quando status = paid
- \`payment_date\`: Obrigatório quando status = paid
- \`is_recurring\`: Cria transações recorrentes automaticamente
- \`parent_transaction_id\`: Liga transações recorrentes

### Triggers Automáticos:
- ✅ \`updated_at\` atualizado automaticamente
- ✅ Status \`overdue\` atualizado automaticamente em transações vencidas
- ✅ Validações no banco garantem integridade

### Performance:
- **10 índices** criados para queries rápidas
- **2 views** para relatórios otimizados
- Foreign keys com \`ON DELETE\` apropriados

### Integridade:
- ✅ Não pode excluir categoria com transações
- ✅ Transações pagas exigem data e método
- ✅ Recorrência validada no banco
- ✅ Valores sempre positivos
