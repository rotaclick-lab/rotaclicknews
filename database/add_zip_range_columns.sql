-- ============================================
-- MIGRATION: Adicionar suporte para blocos de CEPs
-- ============================================

-- Adicionar colunas para faixas de CEP
ALTER TABLE public.freight_routes 
ADD COLUMN IF NOT EXISTS origin_zip_end TEXT,
ADD COLUMN IF NOT EXISTS dest_zip_end TEXT;

-- Adicionar índices para melhor performance em queries de faixas
CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_range 
ON public.freight_routes(origin_zip, origin_zip_end) 
WHERE origin_zip_end IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_freight_routes_dest_range 
ON public.freight_routes(dest_zip, dest_zip_end) 
WHERE dest_zip_end IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.freight_routes.origin_zip_end IS 'CEP final da faixa de origem (opcional, para blocos de CEPs)';
COMMENT ON COLUMN public.freight_routes.dest_zip_end IS 'CEP final da faixa de destino (opcional, para blocos de CEPs)';
