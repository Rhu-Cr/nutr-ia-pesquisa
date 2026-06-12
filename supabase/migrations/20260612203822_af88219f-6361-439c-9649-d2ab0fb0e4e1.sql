
CREATE TABLE public.dashboard_allowed_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX dashboard_allowed_emails_email_lower_key
  ON public.dashboard_allowed_emails (lower(email));

GRANT SELECT ON public.dashboard_allowed_emails TO authenticated;
GRANT ALL ON public.dashboard_allowed_emails TO service_role;

ALTER TABLE public.dashboard_allowed_emails ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only see their own row (to self-check access)
CREATE POLICY "Users can read their own allowlist entry"
  ON public.dashboard_allowed_emails
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));

CREATE OR REPLACE FUNCTION public.is_dashboard_allowed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dashboard_allowed_emails
    WHERE lower(email) = lower(_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_dashboard_allowed(text) TO authenticated, anon;
