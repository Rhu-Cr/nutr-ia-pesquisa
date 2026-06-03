
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exp SMALLINT NOT NULL CHECK (exp BETWEEN 1 AND 5),
  use SMALLINT NOT NULL CHECK (use BETWEEN 1 AND 5),
  ia SMALLINT NOT NULL CHECK (ia BETWEEN 1 AND 5),
  conf SMALLINT NOT NULL CHECK (conf BETWEEN 1 AND 5),
  adoption TEXT NOT NULL CHECK (adoption IN ('sim','talvez','nao')),
  liked TEXT,
  improve TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedbacks TO anon;
GRANT SELECT, INSERT ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.feedbacks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read feedback"
  ON public.feedbacks FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
