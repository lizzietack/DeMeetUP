ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS body_type TEXT,
  ADD COLUMN IF NOT EXISTS ethnicity TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_body_type ON public.profiles(body_type);
CREATE INDEX IF NOT EXISTS idx_profiles_ethnicity ON public.profiles(ethnicity);