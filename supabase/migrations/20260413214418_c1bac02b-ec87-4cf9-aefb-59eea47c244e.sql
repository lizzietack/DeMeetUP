
DROP POLICY "Companion images are publicly accessible" ON storage.objects;

CREATE POLICY "Companion images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'companion-images' AND auth.role() = 'authenticated');
