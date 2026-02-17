-- Pricing and ANTT compliance module

-- 1) Carriers registry (linked to auth user)
CREATE TABLE IF NOT EXISTS public.carriers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_name TEXT,
    rntrc TEXT,
    rntrc_status TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (rntrc_status IN ('UNKNOWN', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED')),
    rntrc_expires_at DATE,
    antt_registration_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (antt_registration_status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED')),
    civil_liability_insurance_valid_until DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carriers can view own carrier profile"
ON public.carriers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Carriers can insert own carrier profile"
ON public.carriers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Carriers can update own carrier profile"
ON public.carriers
FOR UPDATE
USING (auth.uid() = user_id);

-- 2) Vehicle types catalog
CREATE TABLE IF NOT EXISTS public.vehicle_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    default_axles INTEGER NOT NULL DEFAULT 2 CHECK (default_axles > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle types"
ON public.vehicle_types
FOR SELECT
USING (auth.role() = 'authenticated');

-- 3) Carrier cost parameters per vehicle type
CREATE TABLE IF NOT EXISTS public.carrier_cost_parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE NOT NULL,
    vehicle_type_id UUID REFERENCES public.vehicle_types(id) ON DELETE RESTRICT NOT NULL,
    diesel_price NUMERIC(12,4) NOT NULL CHECK (diesel_price >= 0),
    avg_consumption_km_l NUMERIC(12,4) NOT NULL CHECK (avg_consumption_km_l > 0),
    variable_cost_per_km NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (variable_cost_per_km >= 0),
    fixed_monthly_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fixed_monthly_cost >= 0),
    estimated_monthly_km NUMERIC(14,2) NOT NULL CHECK (estimated_monthly_km > 0),
    waiting_cost_per_hour NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (waiting_cost_per_hour >= 0),
    admin_fee_percent NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (admin_fee_percent >= 0),
    pickup_delivery_fixed_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (pickup_delivery_fixed_fee >= 0),
    empty_return_factor NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (empty_return_factor >= 0),
    vale_pedagio_required BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (carrier_id, vehicle_type_id)
);

ALTER TABLE public.carrier_cost_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carrier can view own cost params"
ON public.carrier_cost_parameters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = carrier_cost_parameters.carrier_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Carrier can manage own cost params"
ON public.carrier_cost_parameters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = carrier_cost_parameters.carrier_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = carrier_cost_parameters.carrier_id
      AND c.user_id = auth.uid()
  )
);

-- 4) Freight table header
CREATE TABLE IF NOT EXISTS public.freight_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.freight_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carrier can manage own freight tables"
ON public.freight_tables
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = freight_tables.carrier_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = freight_tables.carrier_id
      AND c.user_id = auth.uid()
  )
);

-- 5) Freight rules lines
CREATE TABLE IF NOT EXISTS public.freight_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freight_table_id UUID REFERENCES public.freight_tables(id) ON DELETE CASCADE NOT NULL,
    vehicle_type_id UUID REFERENCES public.vehicle_types(id) ON DELETE RESTRICT NOT NULL,
    pricing_model TEXT NOT NULL CHECK (pricing_model IN ('PER_KM', 'FIXED_ROUTE', 'CEP_RANGE', 'WEIGHT_BRACKET', 'VOLUME_BRACKET')),
    origin_zip_start TEXT,
    origin_zip_end TEXT,
    destination_zip_start TEXT,
    destination_zip_end TEXT,
    min_weight_kg NUMERIC(12,3),
    max_weight_kg NUMERIC(12,3),
    min_volume_m3 NUMERIC(12,4),
    max_volume_m3 NUMERIC(12,4),
    base_price NUMERIC(14,2) NOT NULL CHECK (base_price >= 0),
    per_km_price NUMERIC(14,4),
    min_charge NUMERIC(14,2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.freight_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carrier can manage own freight rules"
ON public.freight_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.freight_tables ft
    JOIN public.carriers c ON c.id = ft.carrier_id
    WHERE ft.id = freight_rules.freight_table_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.freight_tables ft
    JOIN public.carriers c ON c.id = ft.carrier_id
    WHERE ft.id = freight_rules.freight_table_id
      AND c.user_id = auth.uid()
  )
);

-- 6) Route estimates
CREATE TABLE IF NOT EXISTS public.route_estimates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    origin_zip TEXT,
    destination_zip TEXT,
    origin_city TEXT,
    destination_city TEXT,
    estimated_km NUMERIC(14,3) NOT NULL CHECK (estimated_km > 0),
    estimated_hours NUMERIC(10,3),
    estimated_toll NUMERIC(14,2),
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.route_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read route estimates"
ON public.route_estimates
FOR SELECT
USING (auth.role() = 'authenticated');

-- 7) ANTT reference snapshots (ingested from ANTT website)
CREATE TABLE IF NOT EXISTS public.antt_reference_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url TEXT NOT NULL,
    version_tag TEXT NOT NULL,
    effective_from DATE,
    effective_to DATE,
    diesel_reference_price NUMERIC(12,4),
    floor_formula_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    checksum TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(version_tag)
);

ALTER TABLE public.antt_reference_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ANTT references"
ON public.antt_reference_data
FOR SELECT
USING (auth.role() = 'authenticated');

-- 8) Ingestion run logs
CREATE TABLE IF NOT EXISTS public.antt_ingestion_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
    records_imported INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.antt_ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ingestion runs"
ON public.antt_ingestion_runs
FOR SELECT
USING (auth.role() = 'authenticated');

-- 9) Pricing analysis logs
CREATE TABLE IF NOT EXISTS public.pricing_analysis_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE NOT NULL,
    vehicle_type_id UUID REFERENCES public.vehicle_types(id) ON DELETE RESTRICT,
    pricing_model TEXT NOT NULL,
    input_payload JSONB NOT NULL,
    cost_breakdown JSONB NOT NULL,
    total_cost NUMERIC(14,2) NOT NULL,
    analyzed_price NUMERIC(14,2) NOT NULL,
    profit_value NUMERIC(14,2) NOT NULL,
    margin_percent NUMERIC(8,4) NOT NULL,
    classification TEXT NOT NULL,
    compliance_has_errors BOOLEAN NOT NULL DEFAULT false,
    compliance_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pricing_analysis_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carrier can read own analysis logs"
ON public.pricing_analysis_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = pricing_analysis_logs.carrier_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Carrier can insert own analysis logs"
ON public.pricing_analysis_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carriers c
    WHERE c.id = pricing_analysis_logs.carrier_id
      AND c.user_id = auth.uid()
  )
);

-- 10) Indexes
CREATE INDEX IF NOT EXISTS idx_carriers_user_id ON public.carriers(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_params_carrier_vehicle ON public.carrier_cost_parameters(carrier_id, vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_freight_tables_carrier ON public.freight_tables(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_rules_table ON public.freight_rules(freight_table_id);
CREATE INDEX IF NOT EXISTS idx_route_estimates_origin_dest ON public.route_estimates(origin_zip, destination_zip);
CREATE INDEX IF NOT EXISTS idx_pricing_logs_carrier_created ON public.pricing_analysis_logs(carrier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_antt_reference_effective ON public.antt_reference_data(effective_from DESC);

-- 11) Updated_at triggers
CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON public.carriers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicle_types_updated_at
    BEFORE UPDATE ON public.vehicle_types
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_carrier_cost_parameters_updated_at
    BEFORE UPDATE ON public.carrier_cost_parameters
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_freight_tables_updated_at
    BEFORE UPDATE ON public.freight_tables
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_freight_rules_updated_at
    BEFORE UPDATE ON public.freight_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_route_estimates_updated_at
    BEFORE UPDATE ON public.route_estimates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 12) Seed minimal vehicle types
INSERT INTO public.vehicle_types (code, name, default_axles)
VALUES
  ('VUC', 'VUC', 2),
  ('TOCO', 'Toco', 2),
  ('TRUCK', 'Truck', 3),
  ('CARRETA', 'Carreta', 5)
ON CONFLICT (code) DO NOTHING;
