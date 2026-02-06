-- =====================================================
-- ROTACLICK DATABASE SCHEMA
-- Versão: 1.0.0
-- Data: 2026-02-06
-- Descrição: Schema completo para gestão de fretes
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Status do frete
CREATE TYPE freight_status AS ENUM (
  'pending',        -- Pendente
  'in_transit',     -- Em trânsito
  'delivered',      -- Entregue
  'cancelled'       -- Cancelado
);

-- Tipo de transação financeira
CREATE TYPE transaction_type AS ENUM (
  'income',         -- Receita
  'expense'         -- Despesa
);

-- Status de pagamento
CREATE TYPE payment_status AS ENUM (
  'pending',        -- Pendente
  'paid',           -- Pago
  'overdue',        -- Atrasado
  'cancelled'       -- Cancelado
);

-- Status do veículo
CREATE TYPE vehicle_status AS ENUM (
  'active',         -- Ativo
  'maintenance',    -- Em manutenção
  'inactive'        -- Inativo
);

-- Tipo de veículo
CREATE TYPE vehicle_type AS ENUM (
  'van',
  'truck',
  'semi_truck',
  'motorcycle',
  'car'
);

-- Role do usuário
CREATE TYPE user_role AS ENUM (
  'owner',          -- Proprietário
  'admin',          -- Administrador
  'manager',        -- Gerente
  'driver',         -- Motorista
  'client'          -- Cliente
);

-- Método de pagamento
CREATE TYPE payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'pix',
  'bank_slip'
);

-- =====================================================
-- TABELA: companies (Transportadoras)
-- =====================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) UNIQUE NOT NULL, -- CNPJ
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB, -- {street, number, complement, neighborhood, city, state, zipCode, latitude, longitude}
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb, -- Configurações da empresa
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: users (Usuários - Estende auth.users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: drivers (Motoristas)
-- =====================================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cnh VARCHAR(20) NOT NULL,
  cnh_category VARCHAR(5) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: vehicles (Veículos)
-- =====================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_plate VARCHAR(10) UNIQUE NOT NULL,
  type vehicle_type NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  capacity_kg DECIMAL(10, 2) NOT NULL, -- Capacidade em kg
  capacity_m3 DECIMAL(10, 2), -- Capacidade em m³
  status vehicle_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: customers (Clientes)
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL, -- CPF ou CNPJ
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, document)
);

-- =====================================================
-- TABELA: freights (Fretes)
-- =====================================================
CREATE TABLE freights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Informações do frete
  code VARCHAR(50) UNIQUE NOT NULL, -- Código único do frete
  status freight_status DEFAULT 'pending',
  
  -- Origem e Destino
  origin JSONB NOT NULL, -- {street, number, city, state, zipCode, latitude, longitude}
  destination JSONB NOT NULL, -- {street, number, city, state, zipCode, latitude, longitude}
  distance_km DECIMAL(10, 2),
  
  -- Carga
  weight_kg DECIMAL(10, 2) NOT NULL,
  volume_m3 DECIMAL(10, 2),
  description TEXT,
  
  -- Valores
  freight_value DECIMAL(10, 2) NOT NULL,
  additional_costs DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_value DECIMAL(10, 2) GENERATED ALWAYS AS (
    freight_value + additional_costs - discount
  ) STORED,
  
  -- Datas
  scheduled_date TIMESTAMPTZ NOT NULL,
  pickup_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  
  -- Observações
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: freight_items (Itens do Frete)
-- =====================================================
CREATE TABLE freight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(10, 2),
  volume_m3 DECIMAL(10, 2),
  value DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: marketplace_offers (Ofertas de Retorno)
-- =====================================================
CREATE TABLE marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
  offering_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Informações da oferta
  offered_value DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  
  -- Datas
  valid_until TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: financial_transactions (Transações Financeiras)
-- =====================================================
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  freight_id UUID REFERENCES freights(id) ON DELETE SET NULL,
  
  type transaction_type NOT NULL,
  category VARCHAR(100) NOT NULL, -- Ex: Frete, Combustível, Manutenção, etc.
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Pagamento
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  
  -- Referências
  reference_code VARCHAR(100),
  invoice_url TEXT,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: freight_tracking (Rastreamento de Frete)
-- =====================================================
CREATE TABLE freight_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_id UUID NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
  
  status freight_status NOT NULL,
  location JSONB, -- {latitude, longitude, address}
  message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Companies
CREATE INDEX idx_companies_document ON companies(document);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Users
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Drivers
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
CREATE INDEX idx_drivers_cpf ON drivers(cpf);
CREATE INDEX idx_drivers_is_active ON drivers(is_active);

-- Vehicles
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- Customers
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_document ON customers(document);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- Freights
CREATE INDEX idx_freights_company_id ON freights(company_id);
CREATE INDEX idx_freights_customer_id ON freights(customer_id);
CREATE INDEX idx_freights_driver_id ON freights(driver_id);
CREATE INDEX idx_freights_vehicle_id ON freights(vehicle_id);
CREATE INDEX idx_freights_status ON freights(status);
CREATE INDEX idx_freights_code ON freights(code);
CREATE INDEX idx_freights_scheduled_date ON freights(scheduled_date);
CREATE INDEX idx_freights_created_at ON freights(created_at DESC);

-- Freight Items
CREATE INDEX idx_freight_items_freight_id ON freight_items(freight_id);

-- Marketplace Offers
CREATE INDEX idx_marketplace_offers_freight_id ON marketplace_offers(freight_id);
CREATE INDEX idx_marketplace_offers_company_id ON marketplace_offers(offering_company_id);
CREATE INDEX idx_marketplace_offers_status ON marketplace_offers(status);

-- Financial Transactions
CREATE INDEX idx_transactions_company_id ON financial_transactions(company_id);
CREATE INDEX idx_transactions_freight_id ON financial_transactions(freight_id);
CREATE INDEX idx_transactions_type ON financial_transactions(type);
CREATE INDEX idx_transactions_status ON financial_transactions(payment_status);
CREATE INDEX idx_transactions_due_date ON financial_transactions(due_date);
CREATE INDEX idx_transactions_created_at ON financial_transactions(created_at DESC);

-- Freight Tracking
CREATE INDEX idx_tracking_freight_id ON freight_tracking(freight_id);
CREATE INDEX idx_tracking_created_at ON freight_tracking(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user (criar registro em users quando criar em auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Gerar código único de frete
CREATE OR REPLACE FUNCTION generate_freight_code()
RETURNS TRIGGER AS $$
DECLARE
  code_prefix TEXT := 'FRT';
  code_number TEXT;
  new_code TEXT;
BEGIN
  -- Gerar número sequencial
  SELECT LPAD((COUNT(*) + 1)::TEXT, 8, '0')
  INTO code_number
  FROM freights
  WHERE company_id = NEW.company_id;
  
  new_code := code_prefix || '-' || code_number;
  NEW.code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calcular custo do frete (exemplo simples)
CREATE OR REPLACE FUNCTION calculate_freight_cost(
  p_distance_km DECIMAL,
  p_weight_kg DECIMAL,
  p_vehicle_type vehicle_type
)
RETURNS DECIMAL AS $$
DECLARE
  base_cost DECIMAL := 50.00;
  cost_per_km DECIMAL := 2.50;
  cost_per_kg DECIMAL := 0.15;
  vehicle_multiplier DECIMAL := 1.0;
  total_cost DECIMAL;
BEGIN
  -- Multiplicador baseado no tipo de veículo
  CASE p_vehicle_type
    WHEN 'motorcycle' THEN vehicle_multiplier := 0.7;
    WHEN 'car' THEN vehicle_multiplier := 0.8;
    WHEN 'van' THEN vehicle_multiplier := 1.0;
    WHEN 'truck' THEN vehicle_multiplier := 1.5;
    WHEN 'semi_truck' THEN vehicle_multiplier := 2.0;
    ELSE vehicle_multiplier := 1.0;
  END CASE;
  
  -- Cálculo do custo
  total_cost := base_cost + 
                (p_distance_km * cost_per_km) + 
                (p_weight_kg * cost_per_kg);
  
  total_cost := total_cost * vehicle_multiplier;
  
  RETURN ROUND(total_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: updated_at em companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em drivers
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em customers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em freights
CREATE TRIGGER update_freights_updated_at
  BEFORE UPDATE ON freights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em marketplace_offers
CREATE TRIGGER update_marketplace_offers_updated_at
  BEFORE UPDATE ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at em financial_transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Gerar código do frete
CREATE TRIGGER generate_freight_code_trigger
  BEFORE INSERT ON freights
  FOR EACH ROW
  WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION generate_freight_code();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_tracking ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: companies
-- =====================================================

CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- POLICIES: users
-- =====================================================

CREATE POLICY "Users can view users from same company"
  ON users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can insert users in own company"
  ON users FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update users in own company"
  ON users FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- POLICIES: drivers
-- =====================================================

CREATE POLICY "Users can view drivers from own company"
  ON drivers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert drivers"
  ON drivers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Managers can update drivers"
  ON drivers FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete drivers"
  ON drivers FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: vehicles
-- =====================================================

CREATE POLICY "Users can view vehicles from own company"
  ON vehicles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Managers can update vehicles"
  ON vehicles FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete vehicles"
  ON vehicles FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: customers
-- =====================================================

CREATE POLICY "Users can view customers from own company"
  ON customers FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers"
  ON customers FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete customers"
  ON customers FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: freights
-- =====================================================

CREATE POLICY "Users can view freights from own company"
  ON freights FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert freights"
  ON freights FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update freights"
  ON freights FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete freights"
  ON freights FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: freight_items
-- =====================================================

CREATE POLICY "Users can view freight items from own company"
  ON freight_items FOR SELECT
  USING (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert freight items"
  ON freight_items FOR INSERT
  WITH CHECK (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update freight items"
  ON freight_items FOR UPDATE
  USING (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete freight items"
  ON freight_items FOR DELETE
  USING (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLICIES: marketplace_offers
-- =====================================================

CREATE POLICY "Users can view offers for own company freights"
  ON marketplace_offers FOR SELECT
  USING (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
    OR
    offering_company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert offers"
  ON marketplace_offers FOR INSERT
  WITH CHECK (
    offering_company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own offers"
  ON marketplace_offers FOR UPDATE
  USING (
    offering_company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    OR
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- POLICIES: financial_transactions
-- =====================================================

CREATE POLICY "Users can view transactions from own company"
  ON financial_transactions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions"
  ON financial_transactions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete transactions"
  ON financial_transactions FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: freight_tracking
-- =====================================================

CREATE POLICY "Users can view tracking from own company"
  ON freight_tracking FOR SELECT
  USING (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert tracking"
  ON freight_tracking FOR INSERT
  WITH CHECK (
    freight_id IN (
      SELECT id FROM freights WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Você pode adicionar dados de exemplo aqui
-- Por exemplo: categorias padrão, configurações, etc.

COMMENT ON TABLE companies IS 'Empresas transportadoras cadastradas no sistema';
COMMENT ON TABLE users IS 'Usuários do sistema (estende auth.users)';
COMMENT ON TABLE drivers IS 'Motoristas cadastrados';
COMMENT ON TABLE vehicles IS 'Veículos da frota';
COMMENT ON TABLE customers IS 'Clientes das transportadoras';
COMMENT ON TABLE freights IS 'Fretes realizados';
COMMENT ON TABLE freight_items IS 'Itens/cargas de cada frete';
COMMENT ON TABLE marketplace_offers IS 'Ofertas de fretes no marketplace';
COMMENT ON TABLE financial_transactions IS 'Transações financeiras (receitas e despesas)';
COMMENT ON TABLE freight_tracking IS 'Histórico de rastreamento dos fretes';
