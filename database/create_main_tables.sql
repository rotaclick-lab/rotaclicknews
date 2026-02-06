-- ============================================
-- ROTACLICK - TABELAS PRINCIPAIS DO SISTEMA
-- Script completo para criar todas as tabelas necessárias
-- Database: PostgreSQL (Supabase)
-- ============================================

-- ============================================
-- 1. TABELA: freights (Fretes)
-- ============================================

CREATE TABLE IF NOT EXISTS freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Informações de origem
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_address TEXT,
  origin_postal_code TEXT,
  
  -- Informações de destino
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_address TEXT,
  destination_postal_code TEXT,
  
  -- Informações da carga
  cargo_type TEXT,
  cargo_weight DECIMAL(10,2),
  cargo_value DECIMAL(15,2),
  
  -- Informações de distância e valor
  distance_km DECIMAL(10,2),
  freight_value DECIMAL(15,2) NOT NULL,
  
  -- Datas
  pickup_date DATE,
  delivery_date DATE,
  pickup_time TIME,
  delivery_time TIME,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para freights
CREATE INDEX IF NOT EXISTS idx_freights_company ON freights(company_id);
CREATE INDEX IF NOT EXISTS idx_freights_customer ON freights(customer_id);
CREATE INDEX IF NOT EXISTS idx_freights_driver ON freights(driver_id);
CREATE INDEX IF NOT EXISTS idx_freights_vehicle ON freights(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_freights_status ON freights(status);
CREATE INDEX IF NOT EXISTS idx_freights_pickup_date ON freights(pickup_date);
CREATE INDEX IF NOT EXISTS idx_freights_created_at ON freights(created_at DESC);

-- RLS para freights
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company freights" ON freights
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company freights" ON freights
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company freights" ON freights
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company freights" ON freights
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE freights IS 'Tabela de fretes do sistema';

-- ============================================
-- 2. TABELA: customers (Clientes)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  cpf_cnpj TEXT UNIQUE NOT NULL,
  
  -- Contato
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Endereço
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_cpf_cnpj ON customers(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- RLS para customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company customers" ON customers
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company customers" ON customers
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company customers" ON customers
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company customers" ON customers
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE customers IS 'Tabela de clientes (Pessoa Física e Jurídica)';

-- ============================================
-- 3. TABELA: drivers (Motoristas)
-- ============================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações pessoais
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  birth_date DATE,
  
  -- Contato
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Endereço
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Documentos
  cnh_number TEXT UNIQUE NOT NULL,
  cnh_category TEXT,
  cnh_expiry_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para drivers
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_cpf ON drivers(cpf);
CREATE INDEX IF NOT EXISTS idx_drivers_cnh ON drivers(cnh_number);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_cnh_expiry ON drivers(cnh_expiry_date);

-- RLS para drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company drivers" ON drivers
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company drivers" ON drivers
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company drivers" ON drivers
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company drivers" ON drivers
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE drivers IS 'Tabela de motoristas';

-- ============================================
-- 4. TABELA: vehicles (Veículos)
-- ============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações do veículo
  plate TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  brand TEXT,
  year INTEGER,
  color TEXT,
  
  -- Tipo de veículo
  type TEXT NOT NULL CHECK (type IN ('truck', 'van', 'car', 'motorcycle', 'other')),
  
  -- Capacidade
  capacity_kg DECIMAL(10,2),
  capacity_m3 DECIMAL(10,2),
  
  -- Documentos
  renavam TEXT,
  chassis TEXT,
  
  -- Datas de documentos
  crlv_expiry_date DATE,
  inspection_expiry_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- RLS para vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company vehicles" ON vehicles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company vehicles" ON vehicles
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company vehicles" ON vehicles
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company vehicles" ON vehicles
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE vehicles IS 'Tabela de veículos';

-- ============================================
-- 5. TABELA: categories (Categorias Financeiras)
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da categoria
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  icon TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_company ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company categories" ON categories
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company categories" ON categories
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company categories" ON categories
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company categories" ON categories
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE categories IS 'Categorias financeiras (receitas e despesas)';

-- ============================================
-- 6. TABELA: transactions (Transações Financeiras)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  freight_id UUID REFERENCES freights(id) ON DELETE SET NULL,
  
  -- Tipo e informações básicas
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  
  -- Método de pagamento
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'check', 'other')),
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_count INTEGER,
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_freight ON transactions(freight_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company transactions" ON transactions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert company transactions" ON transactions
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update company transactions" ON transactions
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete company transactions" ON transactions
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE transactions IS 'Transações financeiras (receitas e despesas)';

-- ============================================
-- 7. TABELA: marketplace_routes (Rotas do Marketplace)
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Informações da rota
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  
  -- Disponibilidade
  available_date DATE NOT NULL,
  return_date DATE,
  
  -- Capacidade disponível
  available_weight DECIMAL(10,2),
  available_volume DECIMAL(10,2),
  
  -- Preço sugerido
  suggested_price DECIMAL(15,2),
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'cancelled')),
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para marketplace_routes
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_company ON marketplace_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_driver ON marketplace_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_vehicle ON marketplace_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_status ON marketplace_routes(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_available_date ON marketplace_routes(available_date);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_origin ON marketplace_routes(origin_city, origin_state);
CREATE INDEX IF NOT EXISTS idx_marketplace_routes_destination ON marketplace_routes(destination_city, destination_state);

-- RLS para marketplace_routes
ALTER TABLE marketplace_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view available routes" ON marketplace_routes
  FOR SELECT USING (status = 'available');

CREATE POLICY "Users can manage own routes" ON marketplace_routes
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE marketplace_routes IS 'Rotas disponíveis no marketplace de retorno';

-- ============================================
-- 8. TABELA: marketplace_proposals (Propostas do Marketplace)
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES marketplace_routes(id) ON DELETE CASCADE NOT NULL,
  proposer_company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da proposta
  proposed_price DECIMAL(15,2) NOT NULL,
  cargo_description TEXT,
  cargo_weight DECIMAL(10,2),
  cargo_volume DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  
  -- Resposta
  response_message TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  
  -- Observações
  notes TEXT,
  
  -- Metadados
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para marketplace_proposals
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_route ON marketplace_proposals(route_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_company ON marketplace_proposals(proposer_company_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_status ON marketplace_proposals(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_created_at ON marketplace_proposals(created_at DESC);

-- RLS para marketplace_proposals
ALTER TABLE marketplace_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals for their routes" ON marketplace_proposals
  FOR SELECT USING (
    route_id IN (
      SELECT id FROM marketplace_routes 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
    OR proposer_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create proposals" ON marketplace_proposals
  FOR INSERT WITH CHECK (
    proposer_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Route owners can update proposals" ON marketplace_proposals
  FOR UPDATE USING (
    route_id IN (
      SELECT id FROM marketplace_routes 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

COMMENT ON TABLE marketplace_proposals IS 'Propostas para rotas do marketplace';

-- ============================================
-- 9. TRIGGERS para updated_at
-- ============================================

-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
CREATE TRIGGER update_freights_updated_at
  BEFORE UPDATE ON freights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_routes_updated_at
  BEFORE UPDATE ON marketplace_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_proposals_updated_at
  BEFORE UPDATE ON marketplace_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. CATEGORIAS PADRÃO
-- ============================================

-- Inserir categorias padrão para cada empresa
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Categorias de Receita
  INSERT INTO categories (company_id, name, type, color, icon) VALUES
    (NEW.id, 'Frete', 'income', '#10b981', 'truck'),
    (NEW.id, 'Serviço Extra', 'income', '#3b82f6', 'plus-circle'),
    (NEW.id, 'Outras Receitas', 'income', '#8b5cf6', 'dollar-sign');
  
  -- Categorias de Despesa
  INSERT INTO categories (company_id, name, type, color, icon) VALUES
    (NEW.id, 'Combustível', 'expense', '#ef4444', 'fuel'),
    (NEW.id, 'Manutenção', 'expense', '#f59e0b', 'wrench'),
    (NEW.id, 'Pedágio', 'expense', '#ec4899', 'road'),
    (NEW.id, 'Salário', 'expense', '#6366f1', 'users'),
    (NEW.id, 'Outras Despesas', 'expense', '#64748b', 'minus-circle');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar categorias ao criar empresa
DROP TRIGGER IF EXISTS on_company_created ON companies;

CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- ============================================
-- 11. VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('freights'),
      ('customers'),
      ('drivers'),
      ('vehicles'),
      ('categories'),
      ('transactions'),
      ('marketplace_routes'),
      ('marketplace_proposals')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE '⚠️  Tabelas faltando: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ TODAS AS 8 TABELAS PRINCIPAIS FORAM CRIADAS COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABELAS CRIADAS:';
    RAISE NOTICE '   1. freights (fretes)';
    RAISE NOTICE '   2. customers (clientes)';
    RAISE NOTICE '   3. drivers (motoristas)';
    RAISE NOTICE '   4. vehicles (veículos)';
    RAISE NOTICE '   5. categories (categorias financeiras)';
    RAISE NOTICE '   6. transactions (transações)';
    RAISE NOTICE '   7. marketplace_routes (rotas)';
    RAISE NOTICE '   8. marketplace_proposals (propostas)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
    RAISE NOTICE '🔄 Triggers de updated_at configurados';
    RAISE NOTICE '📁 Categorias padrão serão criadas automaticamente';
  END IF;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
