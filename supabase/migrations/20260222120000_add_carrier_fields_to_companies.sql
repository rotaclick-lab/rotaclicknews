-- Adiciona campos de transportadora à tabela companies
-- Necessário para o fluxo de cadastro de transportadoras

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
  ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
  ADD COLUMN IF NOT EXISTS rntrc TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS endereco_completo JSONB,
  ADD COLUMN IF NOT EXISTS tipo_veiculo_principal TEXT,
  ADD COLUMN IF NOT EXISTS tipo_carroceria_principal TEXT,
  ADD COLUMN IF NOT EXISTS capacidade_carga_toneladas INTEGER,
  ADD COLUMN IF NOT EXISTS raio_atuacao TEXT,
  ADD COLUMN IF NOT EXISTS regioes_atendimento TEXT[],
  ADD COLUMN IF NOT EXISTS consumo_medio_diesel NUMERIC,
  ADD COLUMN IF NOT EXISTS numero_eixos INTEGER,
  ADD COLUMN IF NOT EXISTS possui_rastreamento BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS possui_seguro_carga BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_apolice_seguro TEXT,
  ADD COLUMN IF NOT EXISTS logo_base64 TEXT;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_city_state ON public.companies(city, state);
