-- Bucket para upload temporário de CSVs RNTRC (bypassa limite da Vercel)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rntrc-uploads',
  'rntrc-uploads',
  false,
  209715200, -- 200MB
  ARRAY['text/csv', 'text/plain', 'application/octet-stream', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Apenas admins podem fazer upload
CREATE POLICY "Admins can upload RNTRC CSVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rntrc-uploads'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Apenas admins podem ler
CREATE POLICY "Admins can read RNTRC uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rntrc-uploads'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Apenas admins podem deletar
CREATE POLICY "Admins can delete RNTRC uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rntrc-uploads'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
