-- Migration: Carrier approval flow
-- Adds approval_status, insurance document upload, and makes is_active default false

-- 1. Add approval fields to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS insurance_file_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 2. Set existing active companies as approved
UPDATE companies SET approval_status = 'approved', approved_at = NOW() WHERE is_active = true;

-- 3. New companies default to inactive pending approval
ALTER TABLE companies ALTER COLUMN is_active SET DEFAULT false;

-- 4. Add rntrc_number to companies if not exists (separate from carriers.rntrc)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rntrc_number TEXT;

-- 5. Backfill rntrc_number from existing rntrc column
UPDATE companies SET rntrc_number = rntrc WHERE rntrc IS NOT NULL AND rntrc_number IS NULL;

-- 6. Index for fast pending queries
CREATE INDEX IF NOT EXISTS idx_companies_approval_status ON companies(approval_status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- 7. Storage bucket for carrier documents (insurance policies, etc.)
-- Note: bucket creation must be done via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('carrier-documents', 'carrier-documents', false) ON CONFLICT DO NOTHING;
