-- Phone verification codes for SMS confirmation flow
CREATE TABLE public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Only one active verification per user at a time
CREATE UNIQUE INDEX phone_verifications_user_id_unique ON public.phone_verifications(user_id);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
  ON public.phone_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
  ON public.phone_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications"
  ON public.phone_verifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verifications"
  ON public.phone_verifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_phone_verifications_updated_at
  BEFORE UPDATE ON public.phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();