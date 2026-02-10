-- Create freight_routes table
CREATE TABLE IF NOT EXISTS public.freight_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    origin_zip TEXT NOT NULL,
    dest_zip TEXT NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deadline_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.freight_routes ENABLE ROW LEVEL SECURITY;

-- Policies for freight_routes

-- 1. Carriers can view their own routes
CREATE POLICY "Carriers can view own routes" 
ON public.freight_routes 
FOR SELECT 
USING (auth.uid() = carrier_id);

-- 2. Carriers can insert their own routes
CREATE POLICY "Carriers can insert own routes" 
ON public.freight_routes 
FOR INSERT 
WITH CHECK (auth.uid() = carrier_id);

-- 3. Carriers can update their own routes
CREATE POLICY "Carriers can update own routes" 
ON public.freight_routes 
FOR UPDATE 
USING (auth.uid() = carrier_id);

-- 4. Carriers can delete their own routes
CREATE POLICY "Carriers can delete own routes" 
ON public.freight_routes 
FOR DELETE 
USING (auth.uid() = carrier_id);

-- 5. Public/Clients can view routes for quoting (optional, depending on how you want to query)
-- Note: In a real marketplace, we might want a service role or a specific function to query all routes
CREATE POLICY "Anyone can view routes for quoting" 
ON public.freight_routes 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_freight_routes_carrier_id ON public.freight_routes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_freight_routes_origin_dest ON public.freight_routes(origin_zip, dest_zip);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_freight_routes_updated_at
    BEFORE UPDATE ON public.freight_routes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
