-- Allow admins to delete any companion profile (in addition to the existing owner-only delete policy)
CREATE POLICY "Admins can delete any companion profile"
ON public.companion_profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));