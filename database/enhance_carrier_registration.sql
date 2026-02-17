-- ============================================
-- MIGRATION: Reformulação Completa do Cadastro de Transportadora
-- ============================================

-- ============================================
-- 1. TABELA: term_acceptances (Aceites de Termos com Versionamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.term_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  term_type VARCHAR(50) NOT NULL, -- 'terms_of_use', 'privacy_policy', 'communications', 'credit_analysis'
  term_version VARCHAR(20) NOT NULL, -- '1.0', '1.1', etc
  accepted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_term_acceptances_user_id ON public.term_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_term_acceptances_term_type ON public.term_acceptances(term_type);

COMMENT ON TABLE public.term_acceptances IS 'Registro de aceites de termos com versionamento e auditoria';

-- ============================================
-- 2. ADICIONAR COLUNAS EM profiles
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(11),
ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS whatsapp_permission BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accept_communications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accept_credit_analysis BOOLEAN DEFAULT false;

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

COMMENT ON COLUMN public.profiles.cpf IS 'CPF do responsável (apenas números)';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone celular (formato: 11999999999)';
COMMENT ON COLUMN public.profiles.whatsapp_permission IS 'Permissão para contato via WhatsApp';

-- ============================================
-- 3. ADICIONAR COLUNAS EM companies
-- ============================================
ALTER TABLE public.companies 
-- Dados da Receita Federal (armazenamento completo)
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
ADD COLUMN IF NOT EXISTS cnae_principal VARCHAR(10),
ADD COLUMN IF NOT EXISTS cnae_secundarios JSONB,
ADD COLUMN IF NOT EXISTS natureza_juridica VARCHAR(10),
ADD COLUMN IF NOT EXISTS porte VARCHAR(50),
ADD COLUMN IF NOT EXISTS capital_social DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS data_abertura DATE,
ADD COLUMN IF NOT EXISTS situacao_cadastral VARCHAR(50),
ADD COLUMN IF NOT EXISTS endereco_completo JSONB, -- {logradouro, numero, complemento, bairro, municipio, uf, cep}
ADD COLUMN IF NOT EXISTS socios JSONB, -- Array de sócios com dados completos

-- Dados Operacionais Obrigatórios
ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20),
ADD COLUMN IF NOT EXISTS rntrc VARCHAR(12),
ADD COLUMN IF NOT EXISTS tipo_veiculo_principal VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_carroceria_principal VARCHAR(50),
ADD COLUMN IF NOT EXISTS capacidade_carga_toneladas INTEGER,
ADD COLUMN IF NOT EXISTS regioes_atendimento JSONB, -- ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
ADD COLUMN IF NOT EXISTS raio_atuacao VARCHAR(20), -- 'Municipal', 'Estadual', 'Regional', 'Nacional'

-- Dados Operacionais Opcionais
ADD COLUMN IF NOT EXISTS consumo_medio_diesel DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS numero_eixos INTEGER,
ADD COLUMN IF NOT EXISTS possui_rastreamento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS possui_seguro_carga BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_apolice_seguro VARCHAR(50);

-- Índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_inscricao_estadual ON public.companies(inscricao_estadual);
CREATE INDEX IF NOT EXISTS idx_companies_rntrc ON public.companies(rntrc);
CREATE INDEX IF NOT EXISTS idx_companies_raio_atuacao ON public.companies(raio_atuacao);
CREATE INDEX IF NOT EXISTS idx_companies_situacao_cadastral ON public.companies(situacao_cadastral);

-- Comentários
COMMENT ON COLUMN public.companies.inscricao_estadual IS 'Inscrição Estadual da transportadora';
COMMENT ON COLUMN public.companies.rntrc IS 'Registro Nacional de Transportadores Rodoviários de Carga (8 a 12 dígitos)';
COMMENT ON COLUMN public.companies.tipo_veiculo_principal IS 'Tipo principal de veículo da frota';
COMMENT ON COLUMN public.companies.tipo_carroceria_principal IS 'Tipo principal de carroceria';
COMMENT ON COLUMN public.companies.capacidade_carga_toneladas IS 'Capacidade média de carga em toneladas';
COMMENT ON COLUMN public.companies.regioes_atendimento IS 'Regiões do Brasil que a transportadora atende';
COMMENT ON COLUMN public.companies.raio_atuacao IS 'Raio de atuação: Municipal, Estadual, Regional ou Nacional';

-- ============================================
-- 4. ENUMS/CONSTRAINTS
-- ============================================

-- Constraint para raio_atuacao
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS companies_raio_atuacao_check;

ALTER TABLE public.companies 
ADD CONSTRAINT companies_raio_atuacao_check 
CHECK (raio_atuacao IN ('Municipal', 'Estadual', 'Regional', 'Nacional'));

-- Constraint para tipo_veiculo_principal
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS companies_tipo_veiculo_check;

ALTER TABLE public.companies 
ADD CONSTRAINT companies_tipo_veiculo_check 
CHECK (tipo_veiculo_principal IN (
  'Caminhão Toco',
  'Caminhão Truck',
  'Caminhão Bitruck',
  'Carreta',
  'Bitrem',
  'Rodotrem',
  'Van',
  'VUC',
  'Utilitário'
));

-- Constraint para tipo_carroceria_principal
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS companies_tipo_carroceria_check;

ALTER TABLE public.companies 
ADD CONSTRAINT companies_tipo_carroceria_check 
CHECK (tipo_carroceria_principal IN (
  'Baú',
  'Sider',
  'Graneleiro',
  'Refrigerado',
  'Tanque',
  'Cegonha',
  'Prancha',
  'Basculante',
  'Container',
  'Aberta'
));

-- ============================================
-- 5. RLS POLICIES para term_acceptances
-- ============================================
ALTER TABLE public.term_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own term acceptances"
  ON public.term_acceptances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own term acceptances"
  ON public.term_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTION: Validar CPF
-- ============================================
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sum INTEGER := 0;
  remainder INTEGER;
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remove caracteres não numéricos
  cpf := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Verifica se tem 11 dígitos
  IF length(cpf) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se todos os dígitos são iguais
  IF cpf ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum := sum + (substring(cpf, i, 1)::INTEGER * (11 - i));
  END LOOP;
  
  remainder := (sum * 10) % 11;
  IF remainder = 10 THEN
    remainder := 0;
  END IF;
  
  digit1 := substring(cpf, 10, 1)::INTEGER;
  IF digit1 != remainder THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula segundo dígito verificador
  sum := 0;
  FOR i IN 1..10 LOOP
    sum := sum + (substring(cpf, i, 1)::INTEGER * (12 - i));
  END LOOP;
  
  remainder := (sum * 10) % 11;
  IF remainder = 10 THEN
    remainder := 0;
  END IF;
  
  digit2 := substring(cpf, 11, 1)::INTEGER;
  IF digit2 != remainder THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_cpf IS 'Valida CPF brasileiro com dígitos verificadores';

-- ============================================
-- 7. DADOS INICIAIS: Versões de Termos
-- ============================================
CREATE TABLE IF NOT EXISTS public.term_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(term_type, version)
);

INSERT INTO public.term_versions (term_type, version, content, effective_date, is_current)
VALUES 
  ('terms_of_use', '1.0', 'Termos de Uso da RotaClick versão 1.0', CURRENT_DATE, true),
  ('privacy_policy', '1.0', 'Política de Privacidade da RotaClick versão 1.0', CURRENT_DATE, true)
ON CONFLICT (term_type, version) DO NOTHING;

COMMENT ON TABLE public.term_versions IS 'Versionamento de termos e políticas';
