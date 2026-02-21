-- ============================================================
-- Expand freights table for full payment + status tracking
-- ============================================================
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS origin_zip TEXT;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS dest_zip TEXT;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS taxable_weight NUMERIC(10,2);
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS invoice_value NUMERIC(12,2);
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS carrier_name TEXT;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS deadline_days INTEGER;
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.freight_routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_freights_payment_status ON public.freights(payment_status);
CREATE INDEX IF NOT EXISTS idx_freights_carrier_id ON public.freights(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freights_user_id ON public.freights(user_id);
CREATE INDEX IF NOT EXISTS idx_freights_created_at ON public.freights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freights_stripe_session ON public.freights(stripe_session_id);

-- ============================================================
-- quotes table: registra cada cotação feita (mesmo sem pagar)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  origin_zip TEXT NOT NULL,
  dest_zip TEXT NOT NULL,
  taxable_weight NUMERIC(10,2),
  invoice_value NUMERIC(12,2),
  results_count INTEGER DEFAULT 0,
  selected_carrier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  selected_carrier_name TEXT,
  selected_price NUMERIC(12,2),
  converted_to_freight BOOLEAN DEFAULT false,
  freight_id UUID REFERENCES public.freights(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_carrier_id ON public.quotes(selected_carrier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_converted ON public.quotes(converted_to_freight);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert quotes" ON public.quotes;
CREATE POLICY "System can insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update quotes" ON public.quotes;
CREATE POLICY "System can update quotes"
  ON public.quotes FOR UPDATE
  USING (true);

-- ============================================================
-- profiles: add stripe_connect_id if not exists
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
