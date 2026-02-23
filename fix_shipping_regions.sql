-- Migration corrigida para shipping_regions
-- Verifica se tabela e policies já existem antes de criar

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.shipping_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  representative_cep TEXT NOT NULL,
  cep_start TEXT NOT NULL,
  cep_end TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_shipping_regions_cep_range ON public.shipping_regions(cep_start, cep_end, is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_regions_city_state ON public.shipping_regions(city, state, is_active);

-- Inserir regiões principais se não existirem
INSERT INTO public.shipping_regions (name, city, state, representative_cep, cep_start, cep_end) 
SELECT 
    'São Paulo - Centro', 'São Paulo', 'SP', '01310-000', '01000-000', '01999-999'
WHERE NOT EXISTS (
    SELECT 1 FROM public.shipping_regions 
    WHERE city = 'São Paulo' AND state = 'SP' AND representative_cep = '01310-000'
) LIMIT 1;

INSERT INTO public.shipping_regions (name, city, state, representative_cep, cep_start, cep_end) 
SELECT 
    'Guarulhos - Centro', 'Guarulhos', 'SP', '07000-000', '07000-000', '07999-999'
WHERE NOT EXISTS (
    SELECT 1 FROM public.shipping_regions 
    WHERE city = 'Guarulhos' AND state = 'SP' AND representative_cep = '07000-000'
) LIMIT 1;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.shipping_regions ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes para recriar
DROP POLICY IF EXISTS "Public read shipping regions" ON public.shipping_regions;
DROP POLICY IF EXISTS "Admin full access shipping regions" ON public.shipping_regions;

-- Criar policies
CREATE POLICY "Public read shipping regions"
  ON public.shipping_regions FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admin full access shipping regions"
  ON public.shipping_regions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verificar se está tudo certo
SELECT 
    'VERIFICACAO FINAL' as status,
    COUNT(*) as total_regioes,
    STRING_AGG(name, ', ') as regioes_cadastradas
FROM public.shipping_regions 
WHERE is_active = true;
