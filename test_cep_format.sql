-- Verificar formatos de CEP exatos no banco
-- Execute esta query para ver como os CEPs estão armazenados

SELECT 
    origin_zip,
    dest_zip,
    'FORMATO EXATO' as teste,
    CASE 
        WHEN origin_zip = '07000-000' THEN 'ORIGEM OK'
        WHEN origin_zip = '07000000' THEN 'ORIGEM SEM HIFEN'
        ELSE 'ORIGEM DIFERENTE'
    END as origem_check,
    CASE 
        WHEN dest_zip = '01310-000' THEN 'DESTINO OK'
        WHEN dest_zip = '01310000' THEN 'DESTINO SEM HIFEN'
        ELSE 'DESTINO DIFERENTE'
    END as destino_check
FROM freight_routes 
WHERE origin_zip LIKE '07000%' OR dest_zip LIKE '01310%'
LIMIT 5;

-- Testar a query exata que a API usa
SELECT 
    'TESTE API - COM HIFEN' as tipo,
    COUNT(*) as encontradas
FROM freight_routes 
WHERE origin_zip IN ('07000-000', '07000000')
  AND dest_zip IN ('01310-000', '01310000')
  AND (is_active IS NULL OR is_active = true);

-- Testar sem hífen
SELECT 
    'TESTE API - SEM HIFEN' as tipo,
    COUNT(*) as encontradas
FROM freight_routes 
WHERE origin_zip IN ('07000000')
  AND dest_zip IN ('01310000')
  AND (is_active IS NULL OR is_active = true);

-- Verificar todos os formatos de CEP na tabela
SELECT 
    DISTINCT 
    CASE 
        WHEN LENGTH(origin_zip) = 9 AND SUBSTRING(origin_zip, 6, 1) = '-' THEN 'COM_HIFEN'
        WHEN LENGTH(origin_zip) = 8 THEN 'SEM_HIFEN'
        ELSE 'OUTRO_FORMATO'
    END as formato_origem,
    CASE 
        WHEN LENGTH(dest_zip) = 9 AND SUBSTRING(dest_zip, 6, 1) = '-' THEN 'COM_HIFEN'
        WHEN LENGTH(dest_zip) = 8 THEN 'SEM_HIFEN'
        ELSE 'OUTRO_FORMATO'
    END as formato_destino,
    COUNT(*) as total
FROM freight_routes
GROUP BY formato_origem, formato_destino
ORDER BY total DESC;
