-- Criar tabela de regiões de entrega para sistema de blocos
-- Permite que CEPs genéricos representem áreas inteiras

CREATE TABLE IF NOT EXISTS public.shipping_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  representative_cep TEXT NOT NULL, -- CEP que representa esta região
  cep_start TEXT NOT NULL, -- Primeiro CEP da região
  cep_end TEXT NOT NULL, -- Último CEP da região
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_shipping_regions_cep_range ON public.shipping_regions(cep_start, cep_end, is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_regions_representative ON public.shipping_regions(representative_cep, is_active);

-- Inserir regiões principais de São Paulo e Guarulhos
INSERT INTO public.shipping_regions (name, city, state, representative_cep, cep_start, cep_end) VALUES
  -- São Paulo - Centro
  ('São Paulo - Centro', 'São Paulo', 'SP', '01310-000', '01000-000', '01999-999'),
  ('São Paulo - Zona Norte', 'São Paulo', 'SP', '02000-000', '02000-000', '03999-999'),
  ('São Paulo - Zona Sul', 'São Paulo', 'SP', '04000-000', '04000-000', '05999-999'),
  ('São Paulo - Zona Leste', 'São Paulo', 'SP', '08000-000', '08000-000', '08999-999'),
  ('São Paulo - Zona Oeste', 'São Paulo', 'SP', '05000-000', '05000-000', '05999-999'),
  
  -- Guarulhos - Centro e principais áreas
  ('Guarulhos - Centro', 'Guarulhos', 'SP', '07000-000', '07000-000', '07299-999'),
  ('Guarulhos - Norte', 'Guarulhos', 'SP', '07300-000', '07300-000', '07499-999'),
  ('Guarulhos - Sul', 'Guarulhos', 'SP', '07500-000', '07500-000', '07999-999'),
  
  -- Outras cidades importantes
  ('Campinas - Centro', 'Campinas', 'SP', '13000-000', '13000-000', '13999-999'),
  ('Santo André - Centro', 'Santo André', 'SP', '09000-000', '09000-000', '09999-999'),
  ('Osasco - Centro', 'Osasco', 'SP', '06000-000', '06000-000', '06999-999'),
  ('Taboão da Serra - Centro', 'Taboão da Serra', 'SP', '06700-000', '06700-000', '06799-999'),
  ('Barueri - Centro', 'Barueri', 'SP', '06400-000', '06400-000', '06499-999'),
  ('Diadema - Centro', 'Diadema', 'SP', '09900-000', '09900-000', '09999-999');

-- Atualizar timestamp
UPDATE public.shipping_regions SET updated_at = NOW();

-- RLS policies
ALTER TABLE public.shipping_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read shipping regions" ON public.shipping_regions;
CREATE POLICY "Public read shipping regions"
  ON public.shipping_regions FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access shipping regions" ON public.shipping_regions;
CREATE POLICY "Admin full access shipping regions"
  ON public.shipping_regions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
