-- A stable, database-backed contest for demonstrations.  The app service also
-- verifies this seed at runtime, so a restored/empty database recovers safely.
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS demo_key text;
ALTER TABLE public.contest_problems ADD COLUMN IF NOT EXISTS demo_key text;

CREATE UNIQUE INDEX IF NOT EXISTS contests_demo_key_unique
  ON public.contests(demo_key) WHERE demo_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS contest_problems_demo_key_unique
  ON public.contest_problems(demo_key) WHERE demo_key IS NOT NULL;

INSERT INTO public.contests (id, demo_key, title, description, start_time, end_time, is_rated, is_demo)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'quantumlearn-ai-sample-contest-v1',
  'QuantumLearn AI — Sample Contest',
  'Permanent demonstration contest for testing the QuantumLearn AI contest platform.',
  '2024-01-01T00:00:00Z', '2100-01-01T00:00:00Z', false, true
)
ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO UPDATE
SET title = EXCLUDED.title, description = EXCLUDED.description, is_demo = true;

INSERT INTO public.contest_problems (demo_key, contest_id, title, statement, contest_type, qubit_budget, gate_budget, par_gates, par_depth, reference_ops, pass_threshold, order_index)
SELECT item.demo_key, contest.id, item.title, item.statement, 'circuit_building', item.qubit_budget, item.gate_budget, item.par_gates, item.par_depth, item.reference_ops::jsonb, .95, item.order_index
FROM public.contests contest
CROSS JOIN (VALUES
  ('quantumlearn-sample-superposition-v1', 'Qubit and superposition', 'Put one qubit into an equal superposition using one gate.', 1, 1, 1, 1, '[{"gate":"H","target":0,"col":0}]', 0),
  ('quantumlearn-sample-bit-flip-v1', 'Quantum gate fundamentals', 'Transform |0⟩ to |1⟩ with the appropriate single-qubit gate.', 1, 1, 1, 1, '[{"gate":"X","target":0,"col":0}]', 1),
  ('quantumlearn-sample-bell-v1', 'Bell state entanglement', 'Create the Bell state (|00⟩ + |11⟩) / √2.', 2, 2, 2, 2, '[{"gate":"H","target":0,"col":0},{"gate":"CNOT","control":0,"target":1,"col":1}]', 2),
  ('quantumlearn-sample-uniform-v1', 'Two-qubit superposition', 'Prepare an equal distribution across all two-qubit basis states.', 2, 2, 2, 1, '[{"gate":"H","target":0,"col":0},{"gate":"H","target":1,"col":0}]', 3),
  ('quantumlearn-sample-ghz-v1', 'Basic quantum algorithm', 'Prepare a three-qubit GHZ state using a compact circuit.', 3, 3, 3, 3, '[{"gate":"H","target":0,"col":0},{"gate":"CNOT","control":0,"target":1,"col":1},{"gate":"CNOT","control":1,"target":2,"col":2}]', 4)
) AS item(demo_key, title, statement, qubit_budget, gate_budget, par_gates, par_depth, reference_ops, order_index)
WHERE contest.demo_key = 'quantumlearn-ai-sample-contest-v1'
ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO NOTHING;
