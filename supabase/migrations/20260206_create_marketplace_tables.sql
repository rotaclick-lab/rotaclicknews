-- Migration: Create Marketplace Tables (return_freights and proposals)
-- Created: 2026-02-06

-- =============================================================================
-- 1. CREATE TABLE: return_freights
-- =============================================================================

CREATE TABLE IF NOT EXISTS return_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Origem
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL CHECK (length(origin_state) = 2),
  origin_postal_code TEXT,
  
  -- Destino
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL CHECK (length(destination_state) = 2),
  destination_postal_code TEXT,
  
  -- Veículo
  vehicle_type TEXT NOT NULL,
  
  -- Datas
  available_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'in_negotiation', 'accepted', 'expired', 'cancelled')
  ),
  
  -- Preços
  suggested_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  
  -- Carga
  cargo_type TEXT,
  cargo_weight DECIMAL(10, 2),
  cargo_volume DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  
  -- Configurações
  notes TEXT,
  auto_accept_best BOOLEAN DEFAULT FALSE,
  allow_counter_offers BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (available_date < expiry_date),
  CONSTRAINT valid_prices CHECK (
    suggested_price IS NULL OR max_price IS NULL OR suggested_price <= max_price
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_return_freights_company ON return_freights(company_id);
CREATE INDEX IF NOT EXISTS idx_return_freights_status ON return_freights(status);
CREATE INDEX IF NOT EXISTS idx_return_freights_dates ON return_freights(available_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_return_freights_origin ON return_freights(origin_state, origin_city);
CREATE INDEX IF NOT EXISTS idx_return_freights_destination ON return_freights(destination_state, destination_city);
CREATE INDEX IF NOT EXISTS idx_return_freights_vehicle_type ON return_freights(vehicle_type);

-- =============================================================================
-- 2. CREATE TABLE: proposals
-- =============================================================================

CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_freight_id UUID NOT NULL REFERENCES return_freights(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  
  -- Proposta
  proposed_price DECIMAL(10, 2) NOT NULL CHECK (proposed_price > 0),
  estimated_delivery_days INTEGER NOT NULL CHECK (estimated_delivery_days > 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'counter', 'withdrawn')
  ),
  
  -- Detalhes
  message TEXT,
  valid_until DATE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_valid_until CHECK (valid_until >= CURRENT_DATE)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_return_freight ON proposals(return_freight_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company ON proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_price ON proposals(proposed_price);

-- =============================================================================
-- 3. TRIGGERS para updated_at
-- =============================================================================

-- Criar função se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para return_freights
DROP TRIGGER IF EXISTS update_return_freights_updated_at ON return_freights;
CREATE TRIGGER update_return_freights_updated_at
  BEFORE UPDATE ON return_freights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para proposals
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) - Desabilitado temporariamente
-- =============================================================================

-- RLS será configurado após verificar estrutura de autenticação
-- ALTER TABLE return_freights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SUCCESS!
-- =============================================================================
