-- Verificar estrutura real das tabelas

-- 1. Estrutura da tabela profiles
SELECT 
    'PROFILES COLUMNS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Estrutura da tabela companies
SELECT 
    'COMPANIES COLUMNS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- 3. Estrutura da tabela freight_routes
SELECT 
    'FREIGHT_ROUTES COLUMNS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'freight_routes'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes (sem filtros)
SELECT 
    'DADOS FREIGHT_ROUTES' as tipo,
    COUNT(*) as total_registros
FROM freight_routes;

SELECT 
    'DADOS PROFILES' as tipo,
    COUNT(*) as total_registros
FROM profiles;

SELECT 
    'DADOS COMPANIES' as tipo,
    COUNT(*) as total_registros
FROM companies;
