-- ============================================
-- ROTACLICK - VINCULAR USUÁRIO À EMPRESA
-- Corrige profile sem company_id
-- ============================================

-- ============================================
-- PROBLEMA:
-- O usuário está logado mas seu profile não tem company_id
-- Por isso o dashboard não carrega
-- ============================================

-- ============================================
-- SOLUÇÃO: Vincular usuário à empresa
-- ============================================

-- PASSO 1: Verificar usuário atual
DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_profile_company_id UUID;
BEGIN
  -- Pegar o usuário atual (você deve estar logado)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Nenhum usuário encontrado!';
    RAISE NOTICE 'Faça login primeiro no sistema.';
    RETURN;
  END IF;
  
  RAISE NOTICE '👤 Usuário encontrado: %', v_user_id;
  
  -- Verificar se profile existe
  SELECT company_id INTO v_profile_company_id 
  FROM profiles 
  WHERE id = v_user_id;
  
  IF v_profile_company_id IS NOT NULL THEN
    RAISE NOTICE '✅ Profile já tem company_id: %', v_profile_company_id;
    RETURN;
  END IF;
  
  RAISE NOTICE '⚠️  Profile existe mas company_id é NULL';
  
  -- Pegar a primeira empresa
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '❌ Nenhuma empresa encontrada!';
    RAISE NOTICE 'Execute: database/setup_complete.sql primeiro';
    RETURN;
  END IF;
  
  RAISE NOTICE '🏢 Empresa encontrada: %', v_company_id;
  
  -- Atualizar profile com company_id
  UPDATE profiles
  SET company_id = v_company_id
  WHERE id = v_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ PROFILE ATUALIZADO COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '   Usuário ID: %', v_user_id;
  RAISE NOTICE '   Company ID: %', v_company_id;
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Agora você pode acessar o dashboard!';
  RAISE NOTICE '';
END $$;

-- ============================================
-- PASSO 2: VERIFICAR SE FUNCIONOU
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Pegar último usuário
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  -- Pegar company_id do profile
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_company_id IS NULL THEN
    RAISE NOTICE '❌ Ainda não funcionou!';
    RAISE NOTICE 'Tente executar o script novamente.';
    RETURN;
  END IF;
  
  -- Pegar nome da empresa
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = v_company_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICAÇÃO FINAL';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Usuário: %', v_user_id;
  RAISE NOTICE '🏢 Empresa: % (%)', v_company_name, v_company_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tudo configurado corretamente!';
  RAISE NOTICE '';
  RAISE NOTICE 'Recarregue o dashboard agora!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
