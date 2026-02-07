-- ============================================
-- ROTACLICK - CHECKLIST DE CORREÇÕES
-- Lista de problemas encontrados e correções necessárias
-- ============================================

-- ============================================
-- RESUMO DOS PROBLEMAS IDENTIFICADOS:
-- ============================================

/*
1. ❌ diagnostic.sql - Usa auth.uid() que pode retornar NULL
   - Problema: Não funciona em SQL Editor sem autenticação
   - Solução: Precisa estar logado no Supabase

2. ❌ insert_test_data.sql - Depende de auth.uid()
   - Problema: Mesmo do item 1
   - Solução: Criar versão alternativa com ID manual

3. ✅ create_main_tables.sql - OK
   - Ordem correta das tabelas
   - RLS configurado
   - Triggers funcionando

4. ❓ Falta verificar estrutura da tabela profiles
   - Precisa confirmar colunas existentes
*/

-- ============================================
-- PASSO 1: VERIFICAR ESTRUTURA DA TABELA PROFILES
-- ============================================

SELECT 
  '📋 COLUNAS DA TABELA PROFILES:' as info,
  '' as column_name,
  '' as data_type;

SELECT 
  '' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- PASSO 2: VERIFICAR ESTRUTURA DA TABELA COMPANIES
-- ============================================

SELECT 
  '' as info,
  '' as column_name,
  '' as data_type;

SELECT 
  '📋 COLUNAS DA TABELA COMPANIES:' as info,
  '' as column_name,
  '' as data_type;

SELECT 
  '' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- ============================================
-- PASSO 3: LISTAR TODAS AS TABELAS
-- ============================================

SELECT 
  '' as info,
  '' as column_name,
  '' as data_type;

SELECT 
  '📊 TABELAS EXISTENTES NO SISTEMA:' as info,
  '' as column_name,
  '' as data_type;

SELECT 
  '' as info,
  tablename as table_name,
  '' as data_type
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- PASSO 4: VERIFICAR SE AS 8 TABELAS PRINCIPAIS EXISTEM
-- ============================================

DO $$
DECLARE
  tabelas_principais TEXT[] := ARRAY[
    'customers',
    'drivers',
    'vehicles',
    'freights',
    'categories',
    'transactions',
    'marketplace_routes',
    'marketplace_proposals'
  ];
  tabela TEXT;
  existe BOOLEAN;
  total_existentes INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📋 VERIFICAÇÃO DAS TABELAS PRINCIPAIS:';
  RAISE NOTICE '════════════════════════════════════════';
  
  FOREACH tabela IN ARRAY tabelas_principais
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = tabela
    ) INTO existe;
    
    IF existe THEN
      RAISE NOTICE '✅ % - OK', tabela;
      total_existentes := total_existentes + 1;
    ELSE
      RAISE NOTICE '❌ % - FALTANDO!', tabela;
    END IF;
  END LOOP;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Total: % de 8 tabelas', total_existentes;
  
  IF total_existentes = 8 THEN
    RAISE NOTICE '🎉 TODAS AS TABELAS PRINCIPAIS EXISTEM!';
  ELSE
    RAISE NOTICE '⚠️  FALTAM % TABELAS!', (8 - total_existentes);
    RAISE NOTICE '';
    RAISE NOTICE 'Execute: database/create_main_tables.sql';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- PASSO 5: VERIFICAR TRIGGERS
-- ============================================

DO $$
DECLARE
  triggers_count INT;
BEGIN
  SELECT COUNT(*) INTO triggers_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔄 TRIGGERS:';
  RAISE NOTICE '   Total: % trigger(s)', triggers_count;
END $$;

-- Listar triggers
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- PASSO 6: VERIFICAR FUNCTIONS
-- ============================================

DO $$
DECLARE
  functions_count INT;
BEGIN
  SELECT COUNT(*) INTO functions_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
  
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  FUNCTIONS:';
  RAISE NOTICE '   Total: % function(s)', functions_count;
END $$;

-- Listar functions
SELECT 
  routine_name as function_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- PASSO 7: VERIFICAR RLS (ROW LEVEL SECURITY)
-- ============================================

DO $$
DECLARE
  rls_enabled_count INT;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS (ROW LEVEL SECURITY):';
  RAISE NOTICE '   Tabelas com RLS: %', rls_enabled_count;
END $$;

-- Listar tabelas com RLS
SELECT 
  t.tablename,
  CASE 
    WHEN c.relrowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- ============================================
-- PASSO 8: VERIFICAR POLICIES
-- ============================================

DO $$
DECLARE
  policies_count INT;
BEGIN
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  POLICIES:';
  RAISE NOTICE '   Total: % policy(ies)', policies_count;
END $$;

-- Listar policies
SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE cmd::text
  END as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- PASSO 9: VERIFICAR ÍNDICES
-- ============================================

DO $$
DECLARE
  indexes_count INT;
BEGIN
  SELECT COUNT(*) INTO indexes_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '📑 ÍNDICES:';
  RAISE NOTICE '   Total: % índice(s)', indexes_count;
END $$;

-- ============================================
-- PASSO 10: RESUMO FINAL E PRÓXIMOS PASSOS
-- ============================================

DO $$
DECLARE
  tabelas_count INT;
  tabelas_principais_count INT;
  triggers_count INT;
  functions_count INT;
  rls_count INT;
  policies_count INT;
  tudo_ok BOOLEAN := true;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO tabelas_count
  FROM pg_tables
  WHERE schemaname = 'public';
  
  -- Contar tabelas principais
  SELECT COUNT(*) INTO tabelas_principais_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'customers', 'drivers', 'vehicles', 'freights',
      'categories', 'transactions',
      'marketplace_routes', 'marketplace_proposals'
    );
  
  -- Contar triggers
  SELECT COUNT(*) INTO triggers_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  -- Contar functions
  SELECT COUNT(*) INTO functions_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
  
  -- Contar RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
  
  -- Contar policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO FINAL DO BANCO DE DADOS:';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Tabelas: %', tabelas_count;
  RAISE NOTICE '📋 Tabelas principais: % de 8', tabelas_principais_count;
  RAISE NOTICE '🔄 Triggers: %', triggers_count;
  RAISE NOTICE '⚙️  Functions: %', functions_count;
  RAISE NOTICE '🔒 RLS habilitado: %', rls_count;
  RAISE NOTICE '🛡️  Policies: %', policies_count;
  RAISE NOTICE '';
  
  -- Verificar se está tudo OK
  IF tabelas_principais_count < 8 THEN
    RAISE NOTICE '❌ FALTAM TABELAS PRINCIPAIS!';
    RAISE NOTICE '   Execute: database/create_main_tables.sql';
    tudo_ok := false;
  END IF;
  
  IF triggers_count < 8 THEN
    RAISE NOTICE '❌ FALTAM TRIGGERS!';
    tudo_ok := false;
  END IF;
  
  IF functions_count < 2 THEN
    RAISE NOTICE '❌ FALTAM FUNCTIONS!';
    tudo_ok := false;
  END IF;
  
  IF tudo_ok THEN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 BANCO DE DADOS CONFIGURADO CORRETAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Próximos passos:';
    RAISE NOTICE '   1. Execute: database/diagnostic.sql';
    RAISE NOTICE '   2. Corrija problemas se houver';
    RAISE NOTICE '   3. Execute: database/insert_test_data.sql';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PROBLEMAS ENCONTRADOS!';
    RAISE NOTICE '';
    RAISE NOTICE 'Corrija os problemas acima antes de continuar.';
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- FIM DA VERIFICAÇÃO
-- ============================================
