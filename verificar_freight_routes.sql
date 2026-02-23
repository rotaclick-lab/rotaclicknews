-- Verificar estrutura e dados de freight_routes

-- 1. Estrutura da tabela freight_routes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'freight_routes'
ORDER BY ordinal_position;

-- 2. Verificar se existem rotas cadastradas
SELECT 
    'TOTAL ROTAS' as info,
    COUNT(*) as total
FROM freight_routes;

-- 3. Verificar dados das rotas (se existirem)
SELECT 
    'ROTAS EXISTENTES' as info,
    id,
    carrier_id,
    origin_zip,
    dest_zip,
    is_active
FROM freight_routes
LIMIT 5;

-- 4. Verificar companies para identificar transportadoras
SELECT 
    'COMPANIES' as info,
    id,
    name,
    is_active
FROM companies
WHERE is_active = true
LIMIT 5;

-- 5. Verificar profiles com companies
SELECT 
    'PROFILES COM COMPANIES' as info,
    p.id as profile_id,
    p.name as profile_name,
    c.id as company_id,
    c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE c.id IS NOT NULL
LIMIT 5;
