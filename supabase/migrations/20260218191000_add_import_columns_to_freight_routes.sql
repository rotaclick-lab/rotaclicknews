-- Add import/read-only presentation columns to freight_routes
ALTER TABLE public.freight_routes
  ADD COLUMN IF NOT EXISTS source_file TEXT,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rate_card JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_freight_routes_imported_at
  ON public.freight_routes (imported_at DESC);
