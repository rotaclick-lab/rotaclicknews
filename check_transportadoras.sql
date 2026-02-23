-- Verificar se as rotas têm transportadoras associadas
-- Execute esta query para ver o problema

SELECT 
    fr.id as rota_id,
    fr.origin_zip,
    fr.dest_zip,
    fr.carrier_id,
    p.id as profile_id,
    p.role,
    p.company_id,
    c.nome_fantasia,
    c.razao_social,
    c.name,
    CASE 
        WHEN p.id IS NULL THEN 'SEM PROFILE'
        WHEN p.role != 'transportadora' THEN 'ROLE INVALIDO'
        WHEN p.company_id IS NULL THEN 'SEM COMPANY'
        WHEN c.id IS NULL THEN 'COMPANY NAO ENCONTRADA'
        ELSE 'OK'
    END as status
FROM freight_routes fr
LEFT JOIN profiles p ON fr.carrier_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE fr.origin_zip = '07000-000' 
  AND fr.dest_zip = '01310-000'
  AND (fr.is_active IS NULL OR fr.is_active = true);

-- Verificar todas as transportadoras ativas
SELECT 
    p.id,
    p.role,
    p.company_id,
    c.nome_fantasia,
    COUNT(fr.id) as total_rotas
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN freight_routes fr ON fr.carrier_id = p.id 
  AND (fr.is_active IS NULL OR fr.is_active = true)
WHERE p.role = 'transportadora'
GROUP BY p.id, p.role, p.company_id, c.nome_fantasia
ORDER BY total_rotas DESC;
