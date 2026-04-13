
-- Create image status enum
CREATE TYPE public.image_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS trust_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged_for_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selfie_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_verified boolean NOT NULL DEFAULT false;

-- Create image_moderation table
CREATE TABLE public.image_moderation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  image_type text NOT NULL DEFAULT 'gallery',
  status public.image_status NOT NULL DEFAULT 'pending_review',
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_moderation ENABLE ROW LEVEL SECURITY;

-- Users can view their own images
CREATE POLICY "Users can view their own images"
  ON public.image_moderation FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert their own images"
  ON public.image_moderation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending images
CREATE POLICY "Users can update their own images"
  ON public.image_moderation FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON public.image_moderation FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all images
CREATE POLICY "Admins can view all images"
  ON public.image_moderation FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all images (approve/reject)
CREATE POLICY "Admins can update all images"
  ON public.image_moderation FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_image_moderation_updated_at
  BEFORE UPDATE ON public.image_moderation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
