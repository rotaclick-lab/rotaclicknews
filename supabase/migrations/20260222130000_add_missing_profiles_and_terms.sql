-- Adiciona colunas faltantes na tabela profiles para o cadastro de transportadoras
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS accept_communications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accept_credit_analysis BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_permission BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cliente';

-- Cria tabela term_acceptances se não existir
CREATE TABLE IF NOT EXISTS public.term_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_type TEXT NOT NULL,
  term_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_term_acceptances_user_id ON public.term_acceptances(user_id);

ALTER TABLE public.term_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own term acceptances" ON public.term_acceptances;
CREATE POLICY "Users can view own term acceptances"
  ON public.term_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access term_acceptances" ON public.term_acceptances;
CREATE POLICY "Service role full access term_acceptances"
  ON public.term_acceptances FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
