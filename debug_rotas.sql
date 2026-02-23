-- Verificar rotas disponíveis para simulação de cotação
-- Execute este SELECT no Supabase SQL Editor para ver quais rotas existem

SELECT 
    fr.id,
    fr.origin_zip,
    fr.dest_zip,
    fr.origin_zip_end,
    fr.dest_zip_end,
    fr.price_per_kg,
    fr.min_price,
    fr.deadline_days,
    fr.is_active,
    fr.source_file,
    fr.created_at,
    -- Dados da transportadora
    p.full_name,
    p.role,
    c.nome_fantasia,
    c.razao_social,
    c.name as company_name
FROM freight_routes fr
LEFT JOIN profiles p ON fr.carrier_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE fr.is_active IS NOT FALSE
ORDER BY fr.created_at DESC
LIMIT 10;

-- Verificar se há rotas com faixa de CEP
SELECT 
    'ROTAS COM FAIXA DE CEP' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT origin_zip || '-' || COALESCE(origin_zip_end, 'fim'), ', ') as exemplos
FROM freight_routes 
WHERE origin_zip_end IS NOT NULL OR dest_zip_end IS NOT NULL

UNION ALL

SELECT 
    'ROTAS COM CEP ÚNICO' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT origin_zip || ' -> ' || dest_zip, ', ') as exemplos
FROM freight_routes 
WHERE origin_zip_end IS NULL AND dest_zip_end IS NULL;

-- Exemplo de CEPs para testar (baseado nas rotas existentes)
SELECT 
    'USE ESTES CEPs PARA TESTAR' as instrucao,
    origin_zip as cep_origem,
    dest_zip as cep_destino,
    deadline_days as prazo_dias,
    price_per_kg as preco_por_kg
FROM freight_routes 
WHERE is_active IS NOT FALSE
ORDER BY created_at DESC
LIMIT 5;
