-- ============================================
-- ROTACLICK - VERIFICAÇÃO DO BANCO DE DADOS
-- Script para verificar se tudo foi criado corretamente
-- ============================================

-- ============================================
-- 1. VERIFICAR TABELAS
-- ============================================

SELECT 
  '=== TABELAS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Tabela' as tipo,
  tablename as nome,
  CASE 
    WHEN tablename IN ('companies', 'profiles', 'notifications', 'audit_logs', 'notification_preferences')
    THEN '✅ OK'
    ELSE '❓ Extra'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR COLUNAS DAS TABELAS
-- ============================================

SELECT 
  '=== COLUNAS - COMPANIES ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Coluna' as tipo,
  column_name as nome,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'companies'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== COLUNAS - PROFILES ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Coluna' as tipo,
  column_name as nome,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== COLUNAS - NOTIFICATIONS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Coluna' as tipo,
  column_name as nome,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== COLUNAS - AUDIT_LOGS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Coluna' as tipo,
  column_name as nome,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'audit_logs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== COLUNAS - NOTIFICATION_PREFERENCES ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Coluna' as tipo,
  column_name as nome,
  data_type as status
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 3. VERIFICAR ÍNDICES
-- ============================================

SELECT 
  '=== ÍNDICES ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Índice' as tipo,
  indexname as nome,
  tablename as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'profiles', 'notifications', 'audit_logs', 'notification_preferences')
ORDER BY tablename, indexname;

-- ============================================
-- 4. VERIFICAR TRIGGERS
-- ============================================

SELECT 
  '=== TRIGGERS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Trigger' as tipo,
  trigger_name as nome,
  event_object_table as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('notifications', 'notification_preferences')
ORDER BY event_object_table, trigger_name;

-- Verificar trigger em auth.users
SELECT 
  'Trigger Auth' as tipo,
  trigger_name as nome,
  event_object_table as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- ============================================
-- 5. VERIFICAR VIEWS
-- ============================================

SELECT 
  '=== VIEWS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'View' as tipo,
  viewname as nome,
  CASE 
    WHEN viewname IN ('unread_notifications_count', 'audit_stats_last_30_days', 'suspicious_login_activity')
    THEN '✅ OK'
    ELSE '❓ Extra'
  END as status
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- ============================================
-- 6. VERIFICAR FUNÇÕES
-- ============================================

SELECT 
  '=== FUNÇÕES ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Função' as tipo,
  routine_name as nome,
  CASE 
    WHEN routine_name IN (
      'update_notifications_updated_at',
      'create_default_notification_preferences',
      'create_notification',
      'cleanup_old_audit_logs',
      'audit_freight_delete'
    )
    THEN '✅ OK'
    ELSE '❓ Extra'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 7. VERIFICAR RLS (ROW LEVEL SECURITY)
-- ============================================

SELECT 
  '=== RLS STATUS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'RLS' as tipo,
  tablename as nome,
  CASE 
    WHEN rowsecurity = true THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'profiles', 'notifications', 'audit_logs', 'notification_preferences')
ORDER BY tablename;

-- ============================================
-- 8. VERIFICAR POLICIES (RLS)
-- ============================================

SELECT 
  '=== POLICIES (RLS) ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Policy' as tipo,
  policyname as nome,
  tablename as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'notifications', 'audit_logs', 'notification_preferences')
ORDER BY tablename, policyname;

-- ============================================
-- 9. CONTAGEM DE REGISTROS
-- ============================================

SELECT 
  '=== CONTAGEM DE REGISTROS ===' as tipo,
  '' as nome,
  '' as status;

SELECT 
  'Registros' as tipo,
  'companies' as nome,
  COUNT(*)::text as status
FROM companies;

SELECT 
  'Registros' as tipo,
  'profiles' as nome,
  COUNT(*)::text as status
FROM profiles;

SELECT 
  'Registros' as tipo,
  'notifications' as nome,
  COUNT(*)::text as status
FROM notifications;

SELECT 
  'Registros' as tipo,
  'audit_logs' as nome,
  COUNT(*)::text as status
FROM audit_logs;

SELECT 
  'Registros' as tipo,
  'notification_preferences' as nome,
  COUNT(*)::text as status
FROM notification_preferences;

-- ============================================
-- 10. RESUMO FINAL
-- ============================================

SELECT 
  '=== RESUMO FINAL ===' as tipo,
  '' as nome,
  '' as status;

DO $$
DECLARE
  tabelas_count INT;
  indices_count INT;
  triggers_count INT;
  views_count INT;
  funcoes_count INT;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO tabelas_count
  FROM pg_tables 
  WHERE schemaname = 'public'
    AND tablename IN ('companies', 'profiles', 'notifications', 'audit_logs', 'notification_preferences');
  
  -- Contar índices
  SELECT COUNT(*) INTO indices_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('companies', 'profiles', 'notifications', 'audit_logs', 'notification_preferences');
  
  -- Contar triggers
  SELECT COUNT(*) INTO triggers_count
  FROM information_schema.triggers
  WHERE (trigger_schema = 'public' AND event_object_table IN ('notifications', 'notification_preferences'))
     OR (trigger_schema = 'auth' AND event_object_table = 'users' AND trigger_name = 'on_auth_user_created');
  
  -- Contar views
  SELECT COUNT(*) INTO views_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('unread_notifications_count', 'audit_stats_last_30_days', 'suspicious_login_activity');
  
  -- Contar funções
  SELECT COUNT(*) INTO funcoes_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
      'update_notifications_updated_at',
      'create_default_notification_preferences',
      'create_notification',
      'cleanup_old_audit_logs',
      'audit_freight_delete'
    );
  
  RAISE NOTICE '📊 RESUMO:';
  RAISE NOTICE '   Tabelas: % / 5', tabelas_count;
  RAISE NOTICE '   Índices: %', indices_count;
  RAISE NOTICE '   Triggers: % / 3', triggers_count;
  RAISE NOTICE '   Views: % / 3', views_count;
  RAISE NOTICE '   Funções: % / 5', funcoes_count;
  RAISE NOTICE '';
  
  IF tabelas_count = 5 AND triggers_count = 3 AND views_count = 3 AND funcoes_count = 5 THEN
    RAISE NOTICE '✅ BANCO DE DADOS 100%% CONFIGURADO!';
  ELSE
    RAISE NOTICE '⚠️  Verifique os itens faltantes acima';
  END IF;
END $$;
