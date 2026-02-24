-- Migration: Carrier Integrations
-- Tabela para armazenar integrações de TMS por transportadora
-- Gerenciada pelo admin do RotaClick após negociação com a transportadora

CREATE TABLE IF NOT EXISTS carrier_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('ssw', 'intelipost', 'mandae', 'correios', 'manual')),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Credenciais genéricas (usadas conforme o tipo)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- SSW: { dominio, cnpj_pagador, senha }
  -- Intelipost: { api_key, shipper_id }
  -- Correios: { usuario, senha, contrato, cartao_postagem }

  -- Metadados
  notes TEXT,
  negotiated_at DATE,
  negotiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carrier_integrations_company_id ON carrier_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_carrier_integrations_type ON carrier_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_carrier_integrations_active ON carrier_integrations(is_active);

-- Unique: uma integração por tipo por transportadora
CREATE UNIQUE INDEX IF NOT EXISTS idx_carrier_integrations_company_type
  ON carrier_integrations(company_id, integration_type);

-- RLS: apenas admins acessam
ALTER TABLE carrier_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on carrier_integrations"
  ON carrier_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_carrier_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_carrier_integrations_updated_at
  BEFORE UPDATE ON carrier_integrations
  FOR EACH ROW EXECUTE FUNCTION update_carrier_integrations_updated_at();

COMMENT ON TABLE carrier_integrations IS 'Integrações de TMS negociadas pelo RotaClick com cada transportadora';
COMMENT ON COLUMN carrier_integrations.config IS 'Credenciais do TMS em JSON. Campos variam por integration_type';
COMMENT ON COLUMN carrier_integrations.integration_type IS 'ssw | intelipost | mandae | correios | manual';
