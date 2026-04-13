
-- User interactions tracking table
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_profile_id UUID NOT NULL REFERENCES public.companion_profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_interactions_user ON public.user_interactions(user_id, interaction_type, created_at DESC);
CREATE INDEX idx_user_interactions_companion ON public.user_interactions(companion_profile_id);
