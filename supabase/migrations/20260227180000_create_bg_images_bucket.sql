-- Bucket público para imagens de fundo da home
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bg-images',
  'bg-images',
  true,
  20971520, -- 20MB
  ARRAY['image/webp', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read bg images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bg-images');

CREATE POLICY "Admins upload bg images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bg-images'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins delete bg images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bg-images'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
