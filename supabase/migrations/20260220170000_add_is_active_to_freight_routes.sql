-- Add is_active to freight_routes for admin enable/disable
ALTER TABLE public.freight_routes
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_freight_routes_is_active ON public.freight_routes(is_active) WHERE is_active = true;
