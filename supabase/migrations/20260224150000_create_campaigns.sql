-- Migration: create campaigns table
-- Tabela de campanhas, banners e destaques exibidos na home pública

CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'banner',     -- banner | featured_carrier | promo
  status          TEXT NOT NULL DEFAULT 'active',     -- active | inactive | scheduled
  image_url       TEXT,
  link_url        TEXT,
  link_label      TEXT,
  bg_color        TEXT DEFAULT '#2BBCB3',
  text_color      TEXT DEFAULT '#FFFFFF',
  carrier_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaigns_status   ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type     ON public.campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_position ON public.campaigns(position);

-- RLS: apenas admins gerenciam; público pode ler campanhas ativas
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active campaigns"
  ON public.campaigns
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admin full access on campaigns"
  ON public.campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();
