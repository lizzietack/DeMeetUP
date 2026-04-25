CREATE POLICY "Admins can delete companion images"
ON public.companion_images
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));