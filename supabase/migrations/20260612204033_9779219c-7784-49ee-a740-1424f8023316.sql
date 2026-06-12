
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.feedbacks;

CREATE POLICY "Authenticated users can read feedback"
  ON public.feedbacks
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.feedbacks FROM anon;
