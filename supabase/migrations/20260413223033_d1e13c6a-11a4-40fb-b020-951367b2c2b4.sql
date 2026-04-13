
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_online_status boolean NOT NULL DEFAULT true;
