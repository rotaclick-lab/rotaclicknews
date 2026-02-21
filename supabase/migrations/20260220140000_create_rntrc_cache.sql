-- Cache de transportadores RNTRC (fonte: Dados Abertos ANTT ou upload manual)
CREATE TABLE IF NOT EXISTS public.rntrc_cache (
  rntrc TEXT NOT NULL PRIMARY KEY,
  cpf_cnpj TEXT,
  razao_social TEXT,
  situacao TEXT NOT NULL DEFAULT 'UNKNOWN',
  categoria TEXT,
  uf TEXT,
  municipio TEXT,
  data_atualizacao_antt DATE,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rntrc_cache_cpf_cnpj ON public.rntrc_cache(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_rntrc_cache_situacao ON public.rntrc_cache(situacao);

ALTER TABLE public.rntrc_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rntrc_cache"
ON public.rntrc_cache FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage rntrc_cache"
ON public.rntrc_cache FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.rntrc_cache IS 'Cache de transportadores RNTRC para consulta rápida (fonte: ANTT Dados Abertos ou upload manual)';
