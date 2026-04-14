
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Voice notes are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-notes');

CREATE POLICY "Users can upload voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own voice notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-notes'
    AND auth.role() = 'authenticated'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
