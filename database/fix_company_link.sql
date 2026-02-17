-- ============================================
-- SCRIPT: Vincular usuários às suas empresas
-- ============================================

-- 1. Verificar usuários e seus dados de empresa nos metadados
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'company_name' as company_name,
  u.raw_user_meta_data->>'cnpj' as cnpj,
  p.role,
  p.company_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
ORDER BY u.created_at DESC;

-- 2. Criar empresas para usuários que não têm (baseado nos metadados)
INSERT INTO companies (name, document, email, created_at)
SELECT 
  COALESCE(u.raw_user_meta_data->>'company_name', 'Empresa - ' || u.email),
  u.raw_user_meta_data->>'cnpj',
  u.email,
  u.created_at
FROM auth.users u
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.document = u.raw_user_meta_data->>'cnpj'
  )
ON CONFLICT (document) DO NOTHING;

-- 3. Vincular profiles às empresas correspondentes
UPDATE profiles p
SET 
  company_id = c.id,
  updated_at = now()
FROM auth.users u
JOIN companies c ON c.document = u.raw_user_meta_data->>'cnpj'
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'cnpj' IS NOT NULL
  AND p.company_id IS NULL;

-- 4. Verificar resultado final
SELECT 
  u.id,
  u.email,
  p.role,
  p.company_id,
  c.name as company_name,
  c.document as cnpj
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN companies c ON c.id = p.company_id
WHERE u.raw_user_meta_data->>'cnpj' IS NOT NULL
ORDER BY u.created_at DESC;
