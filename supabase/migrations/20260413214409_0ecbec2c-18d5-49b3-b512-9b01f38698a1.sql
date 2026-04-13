
-- Create companion_profiles table
CREATE TABLE public.companion_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hourly_rate NUMERIC(10,2),
  overnight_rate NUMERIC(10,2),
  custom_packages JSONB DEFAULT '[]'::jsonb,
  services TEXT[] DEFAULT '{}',
  gender TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  availability JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companion profiles are viewable by everyone"
  ON public.companion_profiles FOR SELECT USING (true);

CREATE POLICY "Users can create their own companion profile"
  ON public.companion_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companion profile"
  ON public.companion_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companion profile"
  ON public.companion_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_companion_profiles_updated_at
  BEFORE UPDATE ON public.companion_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create companion_images table
CREATE TABLE public.companion_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  companion_profile_id UUID NOT NULL REFERENCES public.companion_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companion images are viewable by everyone"
  ON public.companion_images FOR SELECT USING (true);

CREATE POLICY "Profile owners can insert images"
  ON public.companion_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companion_profiles
      WHERE id = companion_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Profile owners can update images"
  ON public.companion_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_profiles
      WHERE id = companion_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Profile owners can delete images"
  ON public.companion_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_profiles
      WHERE id = companion_profile_id AND user_id = auth.uid()
    )
  );

-- Create storage bucket for companion images
INSERT INTO storage.buckets (id, name, public) VALUES ('companion-images', 'companion-images', true);

CREATE POLICY "Companion images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'companion-images');

CREATE POLICY "Authenticated users can upload companion images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'companion-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own companion images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'companion-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own companion images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'companion-images' AND auth.uid()::text = (storage.foldername(name))[1]);
