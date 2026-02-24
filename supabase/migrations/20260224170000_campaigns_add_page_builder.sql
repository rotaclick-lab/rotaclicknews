-- Adicionar slug e page_content na tabela campaigns para o page builder

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS page_content JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
