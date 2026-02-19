-- Improve CEP pair lookup performance for quote calculation
CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_dest
  ON public.freight_routes (origin_zip, dest_zip);
