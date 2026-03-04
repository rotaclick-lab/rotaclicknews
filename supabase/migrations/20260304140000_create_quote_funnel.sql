-- Tabela de funil de vendas: captura silenciosa de leads na cotação
CREATE TABLE IF NOT EXISTS public.quote_funnel (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name     TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  origin_zip       TEXT,
  dest_zip         TEXT,
  origin_city      TEXT,
  dest_city        TEXT,
  taxable_weight   NUMERIC(10,2),
  invoice_value    NUMERIC(12,2),
  results_count    INTEGER DEFAULT 0,
  converted        BOOLEAN DEFAULT false,
  freight_id       UUID REFERENCES public.freights(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_funnel_created_at    ON public.quote_funnel(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_funnel_email         ON public.quote_funnel(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_funnel_converted     ON public.quote_funnel(converted);

ALTER TABLE public.quote_funnel ENABLE ROW LEVEL SECURITY;

-- Apenas service_role (admin) pode ler
DROP POLICY IF EXISTS "Admin read quote_funnel" ON public.quote_funnel;
CREATE POLICY "Admin read quote_funnel"
  ON public.quote_funnel FOR SELECT
  TO service_role
  USING (true);

-- Sistema pode inserir (authenticated ou anônimo via service_role)
DROP POLICY IF EXISTS "System insert quote_funnel" ON public.quote_funnel;
CREATE POLICY "System insert quote_funnel"
  ON public.quote_funnel FOR INSERT
  WITH CHECK (true);
