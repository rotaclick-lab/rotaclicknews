-- ============================================
-- ATUALIZAÇÃO: Trigger handle_new_user para processar novos campos
-- ============================================

-- Drop do trigger e função existentes (CASCADE remove dependências)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Criar função atualizada
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_company_name TEXT;
  user_cnpj TEXT;
  company_uuid UUID;
BEGIN
  -- Extrair role dos metadados (se existir)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Extrair dados da empresa dos metadados
  user_company_name := NEW.raw_user_meta_data->>'company_name';
  user_cnpj := NEW.raw_user_meta_data->>'cnpj';
  
  -- Se for transportadora, criar empresa primeiro
  IF user_role = 'transportadora' AND user_company_name IS NOT NULL THEN
    -- Criar/atualizar empresa com TODOS os dados
    INSERT INTO companies (
      name, 
      document,
      email,
      razao_social,
      nome_fantasia,
      inscricao_estadual,
      rntrc,
      tipo_veiculo_principal,
      tipo_carroceria_principal,
      capacidade_carga_toneladas,
      regioes_atendimento,
      raio_atuacao,
      consumo_medio_diesel,
      numero_eixos,
      possui_rastreamento,
      possui_seguro_carga,
      numero_apolice_seguro,
      created_at
    )
    VALUES (
      user_company_name,
      user_cnpj,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'razao_social', user_company_name),
      NEW.raw_user_meta_data->>'nome_fantasia',
      NEW.raw_user_meta_data->>'inscricao_estadual',
      NEW.raw_user_meta_data->>'rntrc',
      NEW.raw_user_meta_data->>'tipo_veiculo_principal',
      NEW.raw_user_meta_data->>'tipo_carroceria_principal',
      NULLIF(NEW.raw_user_meta_data->>'capacidade_carga_toneladas', '')::INTEGER,
      (NEW.raw_user_meta_data->'regioes_atendimento')::JSONB,
      NEW.raw_user_meta_data->>'raio_atuacao',
      NULLIF(NEW.raw_user_meta_data->>'consumo_medio_diesel', '')::DECIMAL,
      NULLIF(NEW.raw_user_meta_data->>'numero_eixos', '')::INTEGER,
      COALESCE((NEW.raw_user_meta_data->>'possui_rastreamento')::BOOLEAN, false),
      COALESCE((NEW.raw_user_meta_data->>'possui_seguro_carga')::BOOLEAN, false),
      NEW.raw_user_meta_data->>'numero_apolice_seguro',
      NEW.created_at
    )
    ON CONFLICT (document) DO UPDATE SET 
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      razao_social = EXCLUDED.razao_social,
      nome_fantasia = EXCLUDED.nome_fantasia,
      inscricao_estadual = EXCLUDED.inscricao_estadual,
      rntrc = EXCLUDED.rntrc,
      tipo_veiculo_principal = EXCLUDED.tipo_veiculo_principal,
      tipo_carroceria_principal = EXCLUDED.tipo_carroceria_principal,
      capacidade_carga_toneladas = EXCLUDED.capacidade_carga_toneladas,
      regioes_atendimento = EXCLUDED.regioes_atendimento,
      raio_atuacao = EXCLUDED.raio_atuacao,
      consumo_medio_diesel = EXCLUDED.consumo_medio_diesel,
      numero_eixos = EXCLUDED.numero_eixos,
      possui_rastreamento = EXCLUDED.possui_rastreamento,
      possui_seguro_carga = EXCLUDED.possui_seguro_carga,
      numero_apolice_seguro = EXCLUDED.numero_apolice_seguro,
      updated_at = now()
    RETURNING id INTO company_uuid;
    
    -- Criar profile vinculado à empresa com TODOS os dados
    INSERT INTO profiles (
      id, 
      company_id, 
      name, 
      email, 
      role,
      cpf,
      phone,
      whatsapp_permission,
      accept_communications,
      accept_credit_analysis
    )
    VALUES (
      NEW.id,
      company_uuid,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      'transportadora',
      NEW.raw_user_meta_data->>'cpf',
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'whatsapp_permission')::BOOLEAN, true),
      COALESCE((NEW.raw_user_meta_data->>'accept_communications')::BOOLEAN, false),
      COALESCE((NEW.raw_user_meta_data->>'accept_credit_analysis')::BOOLEAN, false)
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      company_id = EXCLUDED.company_id,
      role = 'transportadora',
      cpf = EXCLUDED.cpf,
      phone = EXCLUDED.phone,
      whatsapp_permission = EXCLUDED.whatsapp_permission,
      accept_communications = EXCLUDED.accept_communications,
      accept_credit_analysis = EXCLUDED.accept_credit_analysis,
      updated_at = now();
  ELSE
    -- Criar profile sem empresa (usuário comum)
    INSERT INTO profiles (
      id, 
      name, 
      email, 
      role,
      cpf,
      phone,
      whatsapp_permission
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      user_role,
      NEW.raw_user_meta_data->>'cpf',
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'whatsapp_permission')::BOOLEAN, true)
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      role = EXCLUDED.role,
      cpf = EXCLUDED.cpf,
      phone = EXCLUDED.phone,
      whatsapp_permission = EXCLUDED.whatsapp_permission,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Cria automaticamente profile e empresa com todos os dados estratégicos para novos usuários';
