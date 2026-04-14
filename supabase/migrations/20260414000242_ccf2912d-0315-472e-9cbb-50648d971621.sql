
-- Enable realtime for reports and image_moderation
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.image_moderation;
