-- Invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  platform_role public.platform_role NOT NULL DEFAULT 'guest',
  grant_admin boolean NOT NULL DEFAULT false,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  accepted_at timestamptz,
  accepted_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX invitations_email_pending_idx
  ON public.invitations (lower(email))
  WHERE status = 'pending';

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- On new user signup, apply any pending invitation
CREATE OR REPLACE FUNCTION public.apply_invitation_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv record;
  _email text;
BEGIN
  _email := lower(NEW.email);
  SELECT * INTO _inv
  FROM public.invitations
  WHERE lower(email) = _email AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF _inv.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update the user's profile role (profile is created by handle_new_user)
  UPDATE public.profiles
  SET role = _inv.platform_role
  WHERE user_id = NEW.id;

  -- Grant admin role if requested
  IF _inv.grant_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = now(),
      accepted_user_id = NEW.id
  WHERE id = _inv.id;

  RETURN NEW;
END;
$$;

-- Run AFTER handle_new_user (which creates the profile)
CREATE TRIGGER apply_invitation_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.apply_invitation_on_signup();