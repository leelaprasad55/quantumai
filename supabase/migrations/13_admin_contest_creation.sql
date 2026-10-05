-- Contest creation is performed only by the authenticated FastAPI admin route.
-- The backend's service-role RPC creates the contest and its first problem in
-- one transaction, including the private reference circuit used for scoring.
CREATE OR REPLACE FUNCTION public.admin_create_contest_with_problem(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contest_row public.contests;
  problem_row public.contest_problems;
  problem_payload jsonb;
  problem_rows jsonb := '[]'::jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: backend service role required';
  END IF;

  IF jsonb_typeof(payload->'problems') <> 'array'
     OR jsonb_array_length(payload->'problems') < 1
     OR jsonb_array_length(payload->'problems') > 10 THEN
    RAISE EXCEPTION 'A contest must contain between 1 and 10 problems';
  END IF;

  INSERT INTO public.contests(title, description, start_time, end_time, is_rated)
  VALUES (
    payload->>'title',
    payload->>'description',
    (payload->>'start_time')::timestamptz,
    (payload->>'end_time')::timestamptz,
    COALESCE((payload->>'is_rated')::boolean, true)
  )
  RETURNING * INTO contest_row;

  FOR problem_payload IN
    SELECT value FROM jsonb_array_elements(payload->'problems') AS problems(value)
  LOOP
    INSERT INTO public.contest_problems(
      contest_id, title, statement, contest_type, framework, qubit_budget,
      gate_budget, par_gates, par_depth, pass_threshold, order_index, reference_ops
    )
    VALUES (
      contest_row.id,
      problem_payload->>'title',
      problem_payload->>'statement',
      problem_payload->>'contest_type',
      NULLIF(problem_payload->>'framework', ''),
      (problem_payload->>'qubit_budget')::integer,
      NULLIF(problem_payload->>'gate_budget', '')::integer,
      (problem_payload->>'par_gates')::integer,
      (problem_payload->>'par_depth')::integer,
      COALESCE((problem_payload->>'pass_threshold')::numeric, 0.95),
      COALESCE((problem_payload->>'order_index')::integer, 0),
      COALESCE(problem_payload->'reference_ops', '[]'::jsonb)
    )
    RETURNING * INTO problem_row;

    problem_rows := problem_rows || jsonb_build_array(to_jsonb(problem_row));
  END LOOP;

  RETURN jsonb_build_object(
    'contest', to_jsonb(contest_row),
    'problems', problem_rows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_contest_with_problem(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_contest_with_problem(jsonb) TO service_role;