-- Migration: Financial model for RotaClick intermediary
-- Adds margin/cost tracking on routes, payment terms on companies, repasse tracking on freights

-- 1. Payment term on companies (days until carrier receives payment)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS payment_term_days INTEGER NOT NULL DEFAULT 7
    CHECK (payment_term_days IN (7, 21, 28));

-- 2. Cost price and margin on freight_routes
ALTER TABLE freight_routes
  ADD COLUMN IF NOT EXISTS cost_price_per_kg NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_min_price NUMERIC(10,2);

-- 3. Repasse (payout) tracking on freights
ALTER TABLE freights
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS carrier_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS rotaclick_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_term_days INTEGER,
  ADD COLUMN IF NOT EXISTS repasse_due_date DATE,
  ADD COLUMN IF NOT EXISTS repasse_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (repasse_status IN ('pending', 'scheduled', 'paid')),
  ADD COLUMN IF NOT EXISTS repasse_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS repasse_paid_by UUID REFERENCES auth.users(id);

-- 4. Indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_freights_repasse_status ON freights(repasse_status);
CREATE INDEX IF NOT EXISTS idx_freights_repasse_due_date ON freights(repasse_due_date);
CREATE INDEX IF NOT EXISTS idx_freights_carrier_id ON freights(carrier_id);
