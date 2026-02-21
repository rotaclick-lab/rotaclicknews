-- Bucket para documentos das transportadoras (apólices de seguro, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('carrier-documents', 'carrier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Política: service_role tem acesso total (server actions usam service_role)
DROP POLICY IF EXISTS "service_role full access carrier-documents" ON storage.objects;
CREATE POLICY "service_role full access carrier-documents"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'carrier-documents')
  WITH CHECK (bucket_id = 'carrier-documents');

-- Política: admin pode visualizar
DROP POLICY IF EXISTS "admin read carrier-documents" ON storage.objects;
CREATE POLICY "admin read carrier-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'carrier-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
