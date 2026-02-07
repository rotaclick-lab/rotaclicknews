-- ============================================
-- ROTACLICK - POLICIES PARA TABELA COMPANIES
-- Adiciona políticas RLS que estão faltando
-- ============================================

-- ============================================
-- PROBLEMA IDENTIFICADO:
-- A tabela companies existe mas não tem policies RLS
-- ============================================

-- ============================================
-- 1. HABILITAR RLS NA TABELA COMPANIES
-- ============================================

-- Verificar se RLS já está habilitado
DO $$
BEGIN
  -- Habilitar RLS
  ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS habilitado na tabela companies';
END $$;

-- ============================================
-- 2. CRIAR POLICIES PARA COMPANIES
-- ============================================

-- Policy: Usuários podem ver sua própria empresa
DROP POLICY IF EXISTS "Users can view own company" ON companies;

CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Policy: Owners podem atualizar sua própria empresa
DROP POLICY IF EXISTS "Owners can update own company" ON companies;

CREATE POLICY "Owners can update own company" ON companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- 3. VERIFICAR POLICIES CRIADAS
-- ============================================

DO $$
DECLARE
  policies_count INT;
BEGIN
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'companies';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ POLICIES DE COMPANIES CRIADAS!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de policies: %', policies_count;
  RAISE NOTICE '';
  
  IF policies_count >= 2 THEN
    RAISE NOTICE '✅ Policies configuradas corretamente!';
  ELSE
    RAISE NOTICE '⚠️  Apenas % policy(ies) criada(s)', policies_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- Listar policies criadas
SELECT 
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
WHERE schemaname = 'public' AND tablename = 'companies'
ORDER BY policyname;

-- ============================================
-- 4. RESUMO FINAL
-- ============================================

DO $$
DECLARE
  total_tables INT;
  total_policies INT;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public';
  
  -- Contar policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO FINAL DO BANCO:';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Total de tabelas: %', total_tables;
  RAISE NOTICE '🛡️  Total de policies: %', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabela companies agora tem RLS!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
