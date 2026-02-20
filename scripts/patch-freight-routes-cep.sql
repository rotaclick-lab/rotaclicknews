-- ============================================================
-- PATCH: Atualiza CEPs das rotas existentes para 07115-700 -> 15550-700
-- Execute no Supabase SQL Editor se você já rodou o seed com CEPs antigos
-- ============================================================

UPDATE public.freight_routes
SET origin_zip = '07115-700', dest_zip = '15550-700'
WHERE origin_zip = '07115-070' AND dest_zip = '15500-700';
