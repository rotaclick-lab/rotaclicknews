-- Bucket para comprovantes de entrega (fotos/scans)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-proofs',
  'delivery-proofs',
  false,
  20971520, -- 20MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Transportadora pode fazer upload do comprovante do próprio frete
DROP POLICY IF EXISTS "Carrier upload delivery proof" ON storage.objects;
CREATE POLICY "Carrier upload delivery proof"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-proofs'
    AND auth.role() = 'authenticated'
  );

-- Transportadora e embarcador (dono do frete) podem ver o comprovante
DROP POLICY IF EXISTS "Freight parties read delivery proof" ON storage.objects;
CREATE POLICY "Freight parties read delivery proof"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'delivery-proofs');

-- Somente service_role pode deletar
DROP POLICY IF EXISTS "Service role delete delivery proof" ON storage.objects;
CREATE POLICY "Service role delete delivery proof"
  ON storage.objects FOR DELETE
  TO service_role
  USING (true);

-- Coluna para armazenar até 3 URLs de comprovante por frete
ALTER TABLE public.freights
  ADD COLUMN IF NOT EXISTS proof_urls  TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_freights_proof ON public.freights(id) WHERE proof_urls IS NOT NULL AND array_length(proof_urls, 1) > 0;
