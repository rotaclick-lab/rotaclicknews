-- Bucket público para imagens de campanhas/banners

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaigns', 'campaigns', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das imagens
DROP POLICY IF EXISTS "Public read campaign images" ON storage.objects;
CREATE POLICY "Public read campaign images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaigns');

-- Upload apenas para admins
DROP POLICY IF EXISTS "Admin upload campaign images" ON storage.objects;
CREATE POLICY "Admin upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaigns'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Update apenas para admins
DROP POLICY IF EXISTS "Admin update campaign images" ON storage.objects;
CREATE POLICY "Admin update campaign images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaigns'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Delete apenas para admins
DROP POLICY IF EXISTS "Admin delete campaign images" ON storage.objects;
CREATE POLICY "Admin delete campaign images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaigns'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
