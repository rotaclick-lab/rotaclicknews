-- ============================================
-- ROTACLICK - LIMPEZA E CORREÇÃO
-- Remove tabelas duplicadas e inconsistências
-- ============================================

-- ============================================
-- PROBLEMAS IDENTIFICADOS:
-- ============================================

/*
TABELAS DUPLICADAS:
1. ❌ transactions (nova) x financial_transactions (antiga)
   - Manter: transactions
   - Remover: financial_transactions

2. ❌ marketplace_offers x marketplace_proposals
   - Manter: marketplace_proposals
   - Remover: marketplace_offers

3. ❌ users (duplicado com auth.users)
   - Manter: profiles (que já existe)
   - Remover: users

RESUMO:
✅ Manter: 
   - customers, drivers, vehicles, freights
   - categories, transactions
   - marketplace_routes, marketplace_proposals
   - profiles, companies
   - notifications, audit_logs, notification_preferences

❌ Remover:
   - financial_transactions (substituído por transactions)
   - marketplace_offers (substituído por marketplace_proposals)
   - users (substituído por profiles)
*/

-- ============================================
-- PASSO 1: BACKUP DOS DADOS (OPCIONAL)
-- ============================================

-- Se houver dados importantes, faça backup primeiro!

/*
-- Backup de financial_transactions para transactions
INSERT INTO transactions (
  company_id, category_id, freight_id, type, description,
  amount, due_date, payment_date, status, payment_method,
  created_by, created_at, updated_at
)
SELECT 
  company_id, category_id, freight_id, type, description,
  amount, due_date, payment_date, status, payment_method,
  created_by, created_at, updated_at
FROM financial_transactions
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t 
  WHERE t.id = financial_transactions.id
);
*/

-- ============================================
-- PASSO 2: REMOVER TABELAS DUPLICADAS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '🗑️  REMOVENDO TABELAS DUPLICADAS';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Remover financial_transactions (substituído por transactions)
DROP TABLE IF EXISTS financial_transactions CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'financial_transactions'
  ) THEN
    RAISE NOTICE '✅ financial_transactions removida';
  END IF;
END $$;

-- Remover marketplace_offers (substituído por marketplace_proposals)
DROP TABLE IF EXISTS marketplace_offers CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'marketplace_offers'
  ) THEN
    RAISE NOTICE '✅ marketplace_offers removida';
  END IF;
END $$;

-- Remover users (substituído por profiles)
DROP TABLE IF EXISTS users CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE NOTICE '✅ users removida';
  END IF;
END $$;

-- ============================================
-- PASSO 3: VERIFICAR TABELAS FINAIS
-- ============================================

DO $$
DECLARE
  tabelas_esperadas TEXT[] := ARRAY[
    'companies',
    'profiles',
    'customers',
    'drivers',
    'vehicles',
    'freights',
    'categories',
    'transactions',
    'marketplace_routes',
    'marketplace_proposals',
    'notifications',
    'notification_preferences',
    'audit_logs'
  ];
  tabela TEXT;
  existe BOOLEAN;
  total_existentes INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📋 VERIFICANDO TABELAS FINAIS:';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  
  FOREACH tabela IN ARRAY tabelas_esperadas
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
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Total: % de 13 tabelas', total_existentes;
  
  IF total_existentes = 13 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TODAS AS TABELAS ESTÃO CORRETAS!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Faltam % tabelas!', (13 - total_existentes);
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- PASSO 4: LISTAR POLÍTICAS RLS FINAIS
-- ============================================

DO $$
DECLARE
  policies_count INT;
BEGIN
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  TOTAL DE POLÍTICAS RLS: %', policies_count;
END $$;

-- Listar policies por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- PASSO 5: RESUMO FINAL
-- ============================================

DO $$
DECLARE
  tabelas_count INT;
  policies_count INT;
  triggers_count INT;
  functions_count INT;
BEGIN
  -- Contar recursos
  SELECT COUNT(*) INTO tabelas_count
  FROM pg_tables WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO triggers_count
  FROM information_schema.triggers WHERE trigger_schema = 'public';
  
  SELECT COUNT(*) INTO functions_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO DO BANCO DE DADOS:';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Tabelas: %', tabelas_count;
  RAISE NOTICE '🛡️  Policies: %', policies_count;
  RAISE NOTICE '🔄 Triggers: %', triggers_count;
  RAISE NOTICE '⚙️  Functions: %', functions_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Limpeza concluída!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '   1. Execute: database/diagnostic.sql';
  RAISE NOTICE '   2. Execute: database/insert_test_data.sql';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- FIM DA LIMPEZA
-- ============================================
