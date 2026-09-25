-- Contest data is written only by the authenticated FastAPI service using the
-- backend-only SUPABASE_SERVICE_ROLE_KEY. RLS still protects direct clients.
CREATE TABLE IF NOT EXISTS public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_rated boolean NOT NULL DEFAULT true,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.contest_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  title text NOT NULL,
  statement text NOT NULL,
  contest_type text NOT NULL CHECK (contest_type IN ('coding', 'circuit_building')),
  framework text CHECK (framework IN ('qiskit', 'pennylane', 'cirq')),
  qubit_budget integer NOT NULL CHECK (qubit_budget BETWEEN 1 AND 20),
  gate_budget integer CHECK (gate_budget > 0),
  par_gates integer CHECK (par_gates > 0),
  par_depth integer CHECK (par_depth > 0),
  reference_ops jsonb NOT NULL DEFAULT '[]'::jsonb,
  pass_threshold numeric NOT NULL DEFAULT .95 CHECK (pass_threshold BETWEEN 0 AND 1),
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES public.contest_problems(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_type text NOT NULL CHECK (submission_type IN ('code', 'ops')),
  submitted_code text,
  submitted_ops jsonb,
  correctness_score numeric CHECK (correctness_score BETWEEN 0 AND 1),
  efficiency_score numeric CHECK (efficiency_score BETWEEN 0 AND 1),
  fidelity_score numeric CHECK (fidelity_score BETWEEN 0 AND 1),
  fidelity_status text NOT NULL DEFAULT 'not_requested' CHECK (fidelity_status IN ('not_requested', 'queued', 'running', 'complete', 'unavailable', 'failed')),
  fidelity_job_id text,
  fidelity_error text,
  total_score numeric CHECK (total_score BETWEEN 0 AND 1),
  gates_used integer NOT NULL CHECK (gates_used >= 0),
  depth_used integer NOT NULL CHECK (depth_used >= 0),
  is_best_for_user boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((submission_type = 'code' AND submitted_code IS NOT NULL) OR (submission_type = 'ops' AND submitted_ops IS NOT NULL))
);

-- Also supports projects that ran an earlier draft of this migration.
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS finalized_at timestamptz;
ALTER TABLE public.contest_submissions ADD COLUMN IF NOT EXISTS fidelity_status text NOT NULL DEFAULT 'not_requested';
ALTER TABLE public.contest_submissions ADD COLUMN IF NOT EXISTS fidelity_job_id text;
ALTER TABLE public.contest_submissions ADD COLUMN IF NOT EXISTS fidelity_error text;

CREATE UNIQUE INDEX IF NOT EXISTS contest_best_submission_per_problem_user
  ON public.contest_submissions(problem_id, user_id) WHERE is_best_for_user;
CREATE INDEX IF NOT EXISTS contest_submissions_problem_user ON public.contest_submissions(problem_id, user_id);

CREATE TABLE IF NOT EXISTS public.user_ratings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_rating integer NOT NULL DEFAULT 1200,
  rating_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  contests_participated integer NOT NULL DEFAULT 0 CHECK (contests_participated >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contests_read" ON public.contests FOR SELECT USING (true);
-- reference_ops is deliberately never selected by the browser: the backend uses
-- its service role for scoring, while clients receive an explicit safe column list.
-- Problem details are delivered through the FastAPI safe-column endpoint so
-- reference_ops cannot be fetched directly by browser clients.
CREATE POLICY "contest_submissions_own_read" ON public.contest_submissions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "contest_submissions_own_insert" ON public.contest_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_ratings_own_read" ON public.user_ratings FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Contest authoring uses a security-definer RPC to preserve the existing admin pattern.
CREATE OR REPLACE FUNCTION public.admin_create_contest(payload jsonb)
RETURNS uuid AS $$
DECLARE contest_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied: User is not an admin'; END IF;
  INSERT INTO public.contests(title, description, start_time, end_time, is_rated)
  VALUES (payload->>'title', payload->>'description', (payload->>'start_time')::timestamptz, (payload->>'end_time')::timestamptz, COALESCE((payload->>'is_rated')::boolean, true))
  RETURNING id INTO contest_id;
  RETURN contest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_create_contest(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_contest(jsonb) TO authenticated;
