-- One server-managed settings record.  Secrets never belong in this table.
CREATE TABLE IF NOT EXISTS public.admin_settings (
  setting_key text PRIMARY KEY CHECK (setting_key = 'platform'),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_settings_admin_read" ON public.admin_settings
  FOR SELECT USING (public.is_admin());

INSERT INTO public.admin_settings (setting_key, value)
VALUES ('platform', '{"contest_submission_limit":10,"allow_contest_resubmissions":true,"maintenance_message":""}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Add a real code-editor challenge to the permanent sample contest.  Its
-- expected state is still kept private and scored by the backend service.
INSERT INTO public.contest_problems
  (demo_key, contest_id, title, statement, contest_type, framework, qubit_budget, gate_budget, par_gates, par_depth, reference_ops, pass_threshold, order_index)
SELECT
  'quantumlearn-sample-code-bell-v1', id,
  'Code a Bell state',
  'Using Qiskit, write a two-qubit circuit that prepares the Bell state (|00⟩ + |11⟩) / √2.',
  'coding', 'qiskit', 2, 2, 2, 2,
  '[{"gate":"H","target":0,"col":0},{"gate":"CNOT","control":0,"target":1,"col":1}]'::jsonb,
  .95, 5
FROM public.contests
WHERE demo_key = 'quantumlearn-ai-sample-contest-v1'
ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO NOTHING;
