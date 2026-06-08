-- Respondents table: each unique feedback link is tied to a respondent
CREATE TABLE public.respondents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.respondents TO anon, authenticated;
GRANT ALL ON public.respondents TO service_role;

ALTER TABLE public.respondents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read respondents"
  ON public.respondents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create respondents"
  ON public.respondents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Link feedback to respondent; UNIQUE enforces one submission per link
ALTER TABLE public.feedbacks
  ADD COLUMN respondent_id uuid UNIQUE REFERENCES public.respondents(id) ON DELETE CASCADE;
