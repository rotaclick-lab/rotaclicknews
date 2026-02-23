-- Verificar rotas disponíveis para teste
-- CEPs testados: 07115-363 (Guarulhos) → 01301-050 (São Paulo)

-- 1. Verificar se existem rotas para os CEPs representativos
SELECT 
    'ROTAS EXATAS' as tipo,
    fr.*,
    p.name as carrier_name,
    c.company_name
FROM freight_routes fr
LEFT JOIN profiles p ON fr.carrier_id = p.id 
LEFT JOIN companies c ON p.company_id = c.id
WHERE fr.origin_zip IN ('07000-000', '01310-000')
  AND fr.dest_zip IN ('07000-000', '01310-000')
  AND fr.is_active = true;

-- 2. Verificar todas as rotas ativas
SELECT 
    'TODAS AS ROTAS ATIVAS' as tipo,
    COUNT(*) as total,
    STRING_AGG(DISTINCT origin_zip || ' → ' || dest_zip, ', ') as rotas
FROM freight_routes 
WHERE is_active = true;

-- 3. Verificar transportadoras ativas
SELECT 
    'TRANSPORTADORAS ATIVAS' as tipo,
    COUNT(*) as total,
    STRING_AGG(p.name, ', ') as nomes
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.user_type = 'carrier'
  AND p.status = 'approved'
  AND c.is_active = true;

-- 4. Verificar regiões de entrega
SELECT 
    'REGIÕES DE ENTREGA' as tipo,
    name,
    city,
    state,
    representative_cep,
    cep_start,
    cep_end
FROM shipping_regions 
WHERE is_active = true
ORDER BY city, state;
