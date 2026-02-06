-- ============================================
-- ROTACLICK - DIAGNÓSTICO DO SISTEMA
-- Script para verificar configuração antes de inserir dados
-- ============================================

-- ============================================
-- 1. VERIFICAR USUÁRIO LOGADO
-- ============================================

DO $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Você NÃO está logado!';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUÇÃO:';
    RAISE NOTICE '1. Feche o SQL Editor';
    RAISE NOTICE '2. Faça login no Supabase Dashboard';
    RAISE NOTICE '3. Abra o SQL Editor novamente';
    RAISE NOTICE '4. Execute este script';
  ELSE
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    RAISE NOTICE '✅ Você está logado!';
    RAISE NOTICE '   User ID: %', current_user_id;
    RAISE NOTICE '   Email: %', user_email;
  END IF;
END $$;

-- ============================================
-- 2. VERIFICAR SE PROFILE EXISTE
-- ============================================

DO $$
DECLARE
  current_user_id UUID;
  profile_exists BOOLEAN;
  user_company_id UUID;
  company_name TEXT;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = current_user_id) INTO profile_exists;
    
    IF profile_exists THEN
      SELECT company_id INTO user_company_id FROM profiles WHERE id = current_user_id;
      
      IF user_company_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Seu profile existe mas company_id está NULL!';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUÇÃO:';
        RAISE NOTICE 'Execute o script de correção no final deste arquivo.';
      ELSE
        SELECT name INTO company_name FROM companies WHERE id = user_company_id;
        RAISE NOTICE '✅ Profile encontrado!';
        RAISE NOTICE '   Company ID: %', user_company_id;
        RAISE NOTICE '   Company Name: %', company_name;
      END IF;
    ELSE
      RAISE NOTICE '❌ ERRO: Profile não encontrado!';
      RAISE NOTICE '';
      RAISE NOTICE 'SOLUÇÃO:';
      RAISE NOTICE 'Execute o script de correção no final deste arquivo.';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. VERIFICAR EMPRESAS EXISTENTES
-- ============================================

DO $$
DECLARE
  companies_count INT;
BEGIN
  SELECT COUNT(*) INTO companies_count FROM companies;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 EMPRESAS NO SISTEMA:';
  
  IF companies_count = 0 THEN
    RAISE NOTICE '   ❌ Nenhuma empresa cadastrada!';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUÇÃO:';
    RAISE NOTICE 'Execute o script de correção no final deste arquivo.';
  ELSE
    RAISE NOTICE '   ✅ % empresa(s) encontrada(s)', companies_count;
  END IF;
END $$;

-- Listar empresas
SELECT id, name, cnpj, created_at 
FROM companies 
ORDER BY created_at DESC;

-- ============================================
-- 4. VERIFICAR PROFILES EXISTENTES
-- ============================================

DO $$
DECLARE
  profiles_count INT;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '👥 PROFILES NO SISTEMA:';
  RAISE NOTICE '   Total: % profile(s)', profiles_count;
END $$;

-- Listar profiles
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.company_id,
  c.name as company_name,
  p.created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN companies c ON c.id = p.company_id
ORDER BY p.created_at DESC;

-- ============================================
-- 5. VERIFICAR CATEGORIAS PADRÃO
-- ============================================

DO $$
DECLARE
  current_user_id UUID;
  user_company_id UUID;
  categories_count INT;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    SELECT company_id INTO user_company_id FROM profiles WHERE id = current_user_id;
    
    IF user_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO categories_count 
      FROM categories 
      WHERE company_id = user_company_id;
      
      RAISE NOTICE '';
      RAISE NOTICE '🏷️  CATEGORIAS DA SUA EMPRESA:';
      
      IF categories_count = 0 THEN
        RAISE NOTICE '   ❌ Nenhuma categoria encontrada!';
        RAISE NOTICE '';
        RAISE NOTICE 'PROBLEMA:';
        RAISE NOTICE '   O trigger de categorias padrão não funcionou.';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUÇÃO:';
        RAISE NOTICE '   Execute: INSERT INTO categories manualmente';
        RAISE NOTICE '   Ou recrie a empresa';
      ELSE
        RAISE NOTICE '   ✅ % categoria(s) encontrada(s)', categories_count;
      END IF;
    END IF;
  END IF;
END $$;

-- Listar categorias
SELECT 
  c.id,
  c.name,
  c.type,
  co.name as company_name
FROM categories c
LEFT JOIN companies co ON co.id = c.company_id
WHERE c.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1)
ORDER BY c.type, c.name;

-- ============================================
-- 6. RESUMO FINAL
-- ============================================

DO $$
DECLARE
  current_user_id UUID;
  profile_exists BOOLEAN;
  user_company_id UUID;
  all_ok BOOLEAN := true;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📋 RESUMO DO DIAGNÓSTICO:';
  RAISE NOTICE '════════════════════════════════════════';
  
  -- Check 1: Usuário logado
  IF current_user_id IS NULL THEN
    RAISE NOTICE '❌ Você NÃO está logado';
    all_ok := false;
  ELSE
    RAISE NOTICE '✅ Você está logado';
  END IF;
  
  -- Check 2: Profile existe
  IF current_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = current_user_id) INTO profile_exists;
    IF NOT profile_exists THEN
      RAISE NOTICE '❌ Profile não existe';
      all_ok := false;
    ELSE
      RAISE NOTICE '✅ Profile existe';
    END IF;
  END IF;
  
  -- Check 3: Company ID preenchido
  IF current_user_id IS NOT NULL AND profile_exists THEN
    SELECT company_id INTO user_company_id FROM profiles WHERE id = current_user_id;
    IF user_company_id IS NULL THEN
      RAISE NOTICE '❌ Company ID está NULL';
      all_ok := false;
    ELSE
      RAISE NOTICE '✅ Company ID preenchido';
    END IF;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
  
  IF all_ok THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TUDO CERTO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Você pode executar o script:';
    RAISE NOTICE '   database/insert_test_data.sql';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PROBLEMAS ENCONTRADOS!';
    RAISE NOTICE '';
    RAISE NOTICE 'Execute o script de correção abaixo.';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- 7. SCRIPT DE CORREÇÃO AUTOMÁTICA
-- ============================================

-- DESCOMENTE AS LINHAS ABAIXO SE HOUVER PROBLEMAS

/*
-- CRIAR EMPRESA (se não existir)
INSERT INTO companies (name, cnpj, email)
VALUES ('Minha Empresa', '00.000.000/0001-00', 'contato@minhaempresa.com')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- CRIAR OU ATUALIZAR PROFILE (se necessário)
INSERT INTO profiles (id, full_name, company_id)
VALUES (
  auth.uid(),
  'Nome do Usuário',
  (SELECT id FROM companies ORDER BY created_at DESC LIMIT 1)
)
ON CONFLICT (id) DO UPDATE
SET company_id = (SELECT id FROM companies ORDER BY created_at DESC LIMIT 1)
WHERE profiles.company_id IS NULL
RETURNING id, full_name, company_id;

-- VERIFICAR
SELECT 
  p.id,
  p.full_name,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.id = auth.uid();
*/

-- ============================================
-- FIM DO DIAGNÓSTICO
-- ============================================
