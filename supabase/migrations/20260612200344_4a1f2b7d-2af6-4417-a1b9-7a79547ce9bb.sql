
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS email text;

-- Normalize emails to lowercase for uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS feedbacks_email_unique_lower ON public.feedbacks (lower(email)) WHERE email IS NOT NULL;

-- Protect PII: anon/authenticated should not be able to read name/email via Data API.
-- Revoke broad SELECT and re-grant only non-PII columns.
REVOKE SELECT ON public.feedbacks FROM anon, authenticated;
GRANT SELECT (id, exp, use, ia, conf, adoption, liked, improve, created_at) ON public.feedbacks TO anon, authenticated;
GRANT ALL ON public.feedbacks TO service_role;
