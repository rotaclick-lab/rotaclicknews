-- ============================================
-- ROTACLICK - SCRIPT SQL COMPLETO
-- Tabelas Faltantes para o Sistema
-- Database: PostgreSQL (Supabase)
-- ============================================

-- ============================================
-- 1. TABELA: notifications
-- Sistema de Notificações
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Trigger para updated_at em notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- RLS (Row Level Security) para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE notifications IS 'Sistema de notificações em tempo real';

-- ============================================
-- 2. TABELA: audit_logs
-- Sistema de Auditoria e Logs
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Índice composto para queries frequentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created 
  ON audit_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_action 
  ON audit_logs(company_id, action);

-- RLS (Row Level Security) para audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company audit logs"
  ON audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Audit logs nunca devem ser atualizados ou deletados (compliance)
-- Apenas SELECT e INSERT são permitidos

COMMENT ON TABLE audit_logs IS 'Logs de auditoria para conformidade e segurança (LGPD)';
COMMENT ON COLUMN audit_logs.before_data IS 'Estado anterior dos dados (para updates)';
COMMENT ON COLUMN audit_logs.after_data IS 'Estado posterior dos dados (para creates/updates)';
COMMENT ON COLUMN audit_logs.metadata IS 'Metadados adicionais (ex: campos alterados)';

-- ============================================
-- 3. TABELA: notification_preferences
-- Preferências de Notificação por Usuário
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  freight_notifications BOOLEAN DEFAULT true,
  financial_notifications BOOLEAN DEFAULT true,
  document_notifications BOOLEAN DEFAULT true,
  marketplace_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Trigger para updated_at
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- RLS para notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';

-- ============================================
-- 4. FUNÇÃO: Criar preferências automáticas
-- ============================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar preferências ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- 5. VIEWS ÚTEIS
-- ============================================

-- View: Notificações não lidas por usuário
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY user_id;

-- View: Estatísticas de auditoria por empresa (últimos 30 dias)
CREATE OR REPLACE VIEW audit_stats_last_30_days AS
SELECT 
  company_id,
  COUNT(*) as total_logs,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE action = 'create') as creates,
  COUNT(*) FILTER (WHERE action = 'update') as updates,
  COUNT(*) FILTER (WHERE action = 'delete') as deletes,
  COUNT(*) FILTER (WHERE action = 'login_failed') as failed_logins,
  COUNT(*) FILTER (WHERE action = 'permission_denied') as permission_denials
FROM audit_logs
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY company_id;

-- View: Atividades suspeitas (múltiplas falhas de login)
CREATE OR REPLACE VIEW suspicious_login_activity AS
SELECT 
  user_id,
  metadata->>'email' as email,
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE 
  action = 'login_failed' 
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY user_id, metadata->>'email', ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;

COMMENT ON VIEW unread_notifications_count IS 'Contagem de notificações não lidas por usuário';
COMMENT ON VIEW audit_stats_last_30_days IS 'Estatísticas de auditoria dos últimos 30 dias';
COMMENT ON VIEW suspicious_login_activity IS 'Detecta atividades suspeitas de login';

-- ============================================
-- 6. FUNÇÃO: Limpar logs antigos (opcional)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deleta logs mais antigos que X dias (exceto logs críticos)
  DELETE FROM audit_logs
  WHERE 
    created_at < now() - (days_to_keep || ' days')::INTERVAL
    AND action NOT IN ('delete', 'permission_denied', 'login_failed')
  RETURNING id INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Limpa logs de auditoria antigos (mantém logs críticos)';

-- ============================================
-- 7. FUNÇÃO: Criar notificação automática
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_company_id UUID;
BEGIN
  -- Busca company_id do usuário
  SELECT company_id INTO user_company_id
  FROM profiles
  WHERE id = p_user_id;

  -- Insere notificação
  INSERT INTO notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    p_user_id,
    user_company_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_notification IS 'Cria uma notificação para um usuário';

-- ============================================
-- 8. EXEMPLO DE TRIGGERS DE AUDITORIA
-- ============================================

-- Exemplo: Auditar exclusões de fretes
CREATE OR REPLACE FUNCTION audit_freight_delete()
RETURNS TRIGGER AS $$
DECLARE
  user_company UUID;
BEGIN
  SELECT company_id INTO user_company
  FROM profiles
  WHERE id = auth.uid();

  INSERT INTO audit_logs (
    user_id,
    company_id,
    action,
    resource_type,
    resource_id,
    description,
    before_data
  ) VALUES (
    auth.uid(),
    user_company,
    'delete',
    'freight',
    OLD.id::TEXT,
    'Frete excluído: ' || OLD.origin_city || ' → ' || OLD.destination_city,
    to_jsonb(OLD)
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar trigger (descomente se quiser ativar)
-- CREATE TRIGGER freight_delete_audit
--   BEFORE DELETE ON freights
--   FOR EACH ROW
--   EXECUTE FUNCTION audit_freight_delete();

-- ============================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('notifications'),
      ('audit_logs'),
      ('notification_preferences')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = expected.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE 'Tabelas faltando: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as tabelas foram criadas com sucesso!';
  END IF;
END $$;

-- ============================================
-- 10. GRANT PERMISSIONS (se necessário)
-- ============================================

-- Garante que authenticated users possam acessar as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para executar este script no Supabase:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole este script completo
-- 4. Clique em "Run"
-- 5. Verifique os logs para confirmar sucesso

-- Notas importantes:
-- • RLS está ativado em todas as tabelas para segurança
-- • Índices foram criados para performance
-- • Triggers automáticos para updated_at
-- • Views úteis para queries frequentes
-- • Funções helper para criar notificações
-- • Exemplo de trigger de auditoria incluído
-- • Conformidade com LGPD (audit_logs read-only)
