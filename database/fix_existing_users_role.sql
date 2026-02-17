-- ============================================
-- SCRIPT: Corrigir role de usuários existentes
-- ============================================

-- 1. Verificar usuários sem profile ou com role incorreta
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'company_name' as company_name,
  u.raw_user_meta_data->>'cnpj' as cnpj,
  p.role as current_role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
ORDER BY u.created_at DESC;

-- 2. Atualizar role para 'transportadora' para usuários com CNPJ
UPDATE profiles
SET 
  role = 'transportadora',
  updated_at = now()
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
)
AND role != 'transportadora';

-- 3. Criar profiles faltantes para usuários com CNPJ
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  'transportadora'
FROM auth.users u
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE
SET 
  role = 'transportadora',
  updated_at = now();

-- 4. Verificar resultado
SELECT 
  u.id,
  u.email,
  p.role,
  p.company_id,
  c.name as company_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
ORDER BY u.created_at DESC;
