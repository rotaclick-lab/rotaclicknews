-- Bucket para logotipos de empresas (transportadoras)
-- Criar via Dashboard se não existir: Storage > New bucket > company-logos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: leitura pública dos logos
DROP POLICY IF EXISTS "Public read company logos" ON storage.objects;
CREATE POLICY "Public read company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Política: upload apenas para pasta da própria empresa
DROP POLICY IF EXISTS "Users can upload company logo" ON storage.objects;
CREATE POLICY "Users can upload company logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.companies c
    JOIN public.profiles p ON p.company_id = c.id
    WHERE p.id = auth.uid()
  )
);

-- Política: update apenas para pasta da própria empresa
DROP POLICY IF EXISTS "Users can update company logo" ON storage.objects;
CREATE POLICY "Users can update company logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM public.companies c
    JOIN public.profiles p ON p.company_id = c.id
    WHERE p.id = auth.uid()
  )
);
