
CREATE TABLE public.feedback_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_rate_limits_ip_created_at_idx
  ON public.feedback_rate_limits (ip, created_at DESC);

GRANT ALL ON public.feedback_rate_limits TO service_role;
ALTER TABLE public.feedback_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) can read/write.

-- Stop letting the browser insert directly; the server function will use service_role.
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedbacks;
GRANT INSERT ON public.feedbacks TO service_role;
