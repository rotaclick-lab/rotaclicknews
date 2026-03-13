-- =============================================================
-- Solução definitiva: lookup de rotas por faixa de CEP
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_range
  ON public.freight_routes (origin_zip, origin_zip_end)
  WHERE is_active IS NOT FALSE;

CREATE INDEX IF NOT EXISTS idx_freight_routes_dest_range
  ON public.freight_routes (dest_zip, dest_zip_end)
  WHERE is_active IS NOT FALSE;

CREATE OR REPLACE FUNCTION public.match_freight_routes(
  p_origin_zip TEXT,
  p_dest_zip   TEXT
)
RETURNS TABLE (
  id             UUID,
  carrier_id     TEXT,
  origin_zip     TEXT,
  origin_zip_end TEXT,
  dest_zip       TEXT,
  dest_zip_end   TEXT,
  origin_uf      TEXT,
  dest_uf        TEXT,
  origin_region  TEXT,
  dest_region    TEXT,
  min_price      NUMERIC,
  price_per_kg   NUMERIC,
  deadline_days  INT,
  rate_card      JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    fr.id,
    fr.carrier_id,
    fr.origin_zip,
    fr.origin_zip_end,
    fr.dest_zip,
    fr.dest_zip_end,
    fr.origin_uf,
    fr.dest_uf,
    fr.origin_region,
    fr.dest_region,
    fr.min_price,
    fr.price_per_kg,
    fr.deadline_days,
    fr.rate_card
  FROM public.freight_routes fr
  WHERE
    (fr.is_active IS NOT FALSE)
    AND fr.origin_zip <= p_origin_zip
    AND (fr.origin_zip_end IS NULL OR fr.origin_zip_end >= p_origin_zip)
    AND fr.dest_zip <= p_dest_zip
    AND (fr.dest_zip_end IS NULL OR fr.dest_zip_end >= p_dest_zip)
  ORDER BY
    (COALESCE(fr.origin_zip_end, fr.origin_zip)) ASC,
    (COALESCE(fr.dest_zip_end,   fr.dest_zip))   ASC;
$$;

GRANT EXECUTE ON FUNCTION public.match_freight_routes(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_freight_routes(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.match_freight_routes(TEXT, TEXT) TO authenticated;
