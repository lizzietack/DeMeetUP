
CREATE TABLE public.saved_companions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  companion_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, companion_profile_id)
);

ALTER TABLE public.saved_companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved companions"
  ON public.saved_companions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save companions"
  ON public.saved_companions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave companions"
  ON public.saved_companions FOR DELETE
  USING (auth.uid() = user_id);
