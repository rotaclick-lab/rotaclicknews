-- ============================================================
-- Platform Settings: cores, logo, textos, configurações gerais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admin can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('brand_primary_color', '#2BBCB3', 'Cor primária da plataforma (hex)'),
  ('brand_secondary_color', '#F5921B', 'Cor secundária da plataforma (hex)'),
  ('brand_name', 'RotaClick', 'Nome da plataforma'),
  ('brand_tagline', 'Conectando cargas e transportadoras em todo o Brasil', 'Slogan da plataforma'),
  ('brand_logo_url', '', 'URL do logo principal'),
  ('brand_favicon_url', '', 'URL do favicon'),
  ('home_hero_title', 'Cotação de frete rápida e transparente', 'Título do hero da home'),
  ('home_hero_subtitle', 'Compare transportadoras e feche negócio em minutos', 'Subtítulo do hero da home'),
  ('home_hero_cta_label', 'Cotar agora', 'Label do botão CTA da home'),
  ('maintenance_mode', 'false', 'Modo manutenção (true/false)'),
  ('maintenance_message', 'Estamos em manutenção. Voltamos em breve!', 'Mensagem de manutenção'),
  ('platform_fee_percent', '10', 'Comissão da plataforma em % sobre cada frete'),
  ('max_file_size_mb', '5', 'Tamanho máximo de upload em MB'),
  ('contact_email', 'contato@rotaclick.com.br', 'Email de contato exibido na plataforma'),
  ('contact_phone', '', 'Telefone de contato exibido na plataforma'),
  ('footer_text', '© 2025 RotaClick. Todos os direitos reservados.', 'Texto do rodapé')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Campaigns: banners e destaques na home pública
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'banner', -- banner | featured_carrier | promo
  status TEXT NOT NULL DEFAULT 'active', -- active | inactive | scheduled
  image_url TEXT,
  link_url TEXT,
  link_label TEXT,
  bg_color TEXT DEFAULT '#2BBCB3',
  text_color TEXT DEFAULT '#FFFFFF',
  carrier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_position ON public.campaigns(position);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(starts_at, ends_at);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active campaigns" ON public.campaigns;
CREATE POLICY "Public can read active campaigns"
  ON public.campaigns FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Admin can manage campaigns" ON public.campaigns;
CREATE POLICY "Admin can manage campaigns"
  ON public.campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Expand audit_logs: adicionar campo description se não existir
-- ============================================================
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS before_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS after_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.audit_logs(session_id);
