ALTER TABLE public.companion_profiles
  ADD CONSTRAINT companion_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;