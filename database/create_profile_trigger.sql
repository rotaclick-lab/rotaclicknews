-- ============================================
-- TRIGGER: Criar profile automaticamente ao criar usuário
-- ============================================

-- Função para criar profile com role baseada nos metadados do usuário
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
    -- Criar empresa
    INSERT INTO companies (name, cnpj, type, status)
    VALUES (
      user_company_name,
      user_cnpj,
      'carrier',
      'active'
    )
    ON CONFLICT (cnpj) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO company_uuid;
    
    -- Criar profile vinculado à empresa
    INSERT INTO profiles (id, company_id, name, email, role)
    VALUES (
      NEW.id,
      company_uuid,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      'transportadora'
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      company_id = EXCLUDED.company_id,
      role = 'transportadora',
      updated_at = now();
  ELSE
    -- Criar profile sem empresa (usuário comum)
    INSERT INTO profiles (id, name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      user_role
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      role = EXCLUDED.role,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Cria automaticamente profile e empresa para novos usuários';
