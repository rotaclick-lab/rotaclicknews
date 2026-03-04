-- Adicionar suporte a cotação por UF e macro-região nas rotas de frete
ALTER TABLE public.freight_routes
  ADD COLUMN IF NOT EXISTS origin_uf     TEXT,
  ADD COLUMN IF NOT EXISTS dest_uf       TEXT,
  ADD COLUMN IF NOT EXISTS origin_region TEXT,
  ADD COLUMN IF NOT EXISTS dest_region   TEXT;

CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_uf     ON public.freight_routes(origin_uf)     WHERE origin_uf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_routes_dest_uf       ON public.freight_routes(dest_uf)       WHERE dest_uf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_region ON public.freight_routes(origin_region) WHERE origin_region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_freight_routes_dest_region   ON public.freight_routes(dest_region)   WHERE dest_region IS NOT NULL;

-- Preencher UF a partir da faixa de CEP (Correios)
UPDATE public.freight_routes SET origin_uf = CASE
  WHEN origin_zip BETWEEN '01000000' AND '19999999' THEN 'SP'
  WHEN origin_zip BETWEEN '20000000' AND '28999999' THEN 'RJ'
  WHEN origin_zip BETWEEN '29000000' AND '29999999' THEN 'ES'
  WHEN origin_zip BETWEEN '30000000' AND '39999999' THEN 'MG'
  WHEN origin_zip BETWEEN '40000000' AND '48999999' THEN 'BA'
  WHEN origin_zip BETWEEN '49000000' AND '49999999' THEN 'SE'
  WHEN origin_zip BETWEEN '50000000' AND '56999999' THEN 'PE'
  WHEN origin_zip BETWEEN '57000000' AND '57999999' THEN 'AL'
  WHEN origin_zip BETWEEN '58000000' AND '58999999' THEN 'PB'
  WHEN origin_zip BETWEEN '59000000' AND '59999999' THEN 'RN'
  WHEN origin_zip BETWEEN '60000000' AND '63999999' THEN 'CE'
  WHEN origin_zip BETWEEN '64000000' AND '64999999' THEN 'PI'
  WHEN origin_zip BETWEEN '65000000' AND '65999999' THEN 'MA'
  WHEN origin_zip BETWEEN '66000000' AND '68899999' THEN 'PA'
  WHEN origin_zip BETWEEN '68900000' AND '68999999' THEN 'AP'
  WHEN origin_zip BETWEEN '69000000' AND '69299999' THEN 'AM'
  WHEN origin_zip BETWEEN '69300000' AND '69399999' THEN 'RR'
  WHEN origin_zip BETWEEN '69400000' AND '69899999' THEN 'AM'
  WHEN origin_zip BETWEEN '69900000' AND '69999999' THEN 'AC'
  WHEN origin_zip BETWEEN '70000000' AND '73699999' THEN 'DF'
  WHEN origin_zip BETWEEN '73700000' AND '76799999' THEN 'GO'
  WHEN origin_zip BETWEEN '76800000' AND '76999999' THEN 'RO'
  WHEN origin_zip BETWEEN '77000000' AND '77999999' THEN 'TO'
  WHEN origin_zip BETWEEN '78000000' AND '78999999' THEN 'MT'
  WHEN origin_zip BETWEEN '79000000' AND '79999999' THEN 'MS'
  WHEN origin_zip BETWEEN '80000000' AND '87999999' THEN 'PR'
  WHEN origin_zip BETWEEN '88000000' AND '89999999' THEN 'SC'
  WHEN origin_zip BETWEEN '90000000' AND '99999999' THEN 'RS'
  ELSE NULL END
WHERE origin_uf IS NULL;

UPDATE public.freight_routes SET dest_uf = CASE
  WHEN dest_zip BETWEEN '01000000' AND '19999999' THEN 'SP'
  WHEN dest_zip BETWEEN '20000000' AND '28999999' THEN 'RJ'
  WHEN dest_zip BETWEEN '29000000' AND '29999999' THEN 'ES'
  WHEN dest_zip BETWEEN '30000000' AND '39999999' THEN 'MG'
  WHEN dest_zip BETWEEN '40000000' AND '48999999' THEN 'BA'
  WHEN dest_zip BETWEEN '49000000' AND '49999999' THEN 'SE'
  WHEN dest_zip BETWEEN '50000000' AND '56999999' THEN 'PE'
  WHEN dest_zip BETWEEN '57000000' AND '57999999' THEN 'AL'
  WHEN dest_zip BETWEEN '58000000' AND '58999999' THEN 'PB'
  WHEN dest_zip BETWEEN '59000000' AND '59999999' THEN 'RN'
  WHEN dest_zip BETWEEN '60000000' AND '63999999' THEN 'CE'
  WHEN dest_zip BETWEEN '64000000' AND '64999999' THEN 'PI'
  WHEN dest_zip BETWEEN '65000000' AND '65999999' THEN 'MA'
  WHEN dest_zip BETWEEN '66000000' AND '68899999' THEN 'PA'
  WHEN dest_zip BETWEEN '68900000' AND '68999999' THEN 'AP'
  WHEN dest_zip BETWEEN '69000000' AND '69299999' THEN 'AM'
  WHEN dest_zip BETWEEN '69300000' AND '69399999' THEN 'RR'
  WHEN dest_zip BETWEEN '69400000' AND '69899999' THEN 'AM'
  WHEN dest_zip BETWEEN '69900000' AND '69999999' THEN 'AC'
  WHEN dest_zip BETWEEN '70000000' AND '73699999' THEN 'DF'
  WHEN dest_zip BETWEEN '73700000' AND '76799999' THEN 'GO'
  WHEN dest_zip BETWEEN '76800000' AND '76999999' THEN 'RO'
  WHEN dest_zip BETWEEN '77000000' AND '77999999' THEN 'TO'
  WHEN dest_zip BETWEEN '78000000' AND '78999999' THEN 'MT'
  WHEN dest_zip BETWEEN '79000000' AND '79999999' THEN 'MS'
  WHEN dest_zip BETWEEN '80000000' AND '87999999' THEN 'PR'
  WHEN dest_zip BETWEEN '88000000' AND '89999999' THEN 'SC'
  WHEN dest_zip BETWEEN '90000000' AND '99999999' THEN 'RS'
  ELSE NULL END
WHERE dest_uf IS NULL;

-- Preencher macro-região
UPDATE public.freight_routes SET origin_region = CASE
  WHEN origin_uf IN ('SP','RJ','MG','ES') THEN 'sudeste'
  WHEN origin_uf IN ('PR','SC','RS')       THEN 'sul'
  WHEN origin_uf IN ('BA','SE','PE','AL','PB','RN','CE','PI','MA') THEN 'nordeste'
  WHEN origin_uf IN ('AM','PA','RR','AP','AC','RO','TO') THEN 'norte'
  WHEN origin_uf IN ('DF','GO','MT','MS')  THEN 'centro-oeste'
  ELSE NULL END
WHERE origin_uf IS NOT NULL AND origin_region IS NULL;

UPDATE public.freight_routes SET dest_region = CASE
  WHEN dest_uf IN ('SP','RJ','MG','ES') THEN 'sudeste'
  WHEN dest_uf IN ('PR','SC','RS')       THEN 'sul'
  WHEN dest_uf IN ('BA','SE','PE','AL','PB','RN','CE','PI','MA') THEN 'nordeste'
  WHEN dest_uf IN ('AM','PA','RR','AP','AC','RO','TO') THEN 'norte'
  WHEN dest_uf IN ('DF','GO','MT','MS')  THEN 'centro-oeste'
  ELSE NULL END
WHERE dest_uf IS NOT NULL AND dest_region IS NULL;
