-- ==========================================
-- QUANTUMLEARN AI - CANONICAL DATABASE CONSTRAINTS
-- ==========================================

-- 1. Profiles Constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS xp_positive;
ALTER TABLE public.profiles ADD CONSTRAINT xp_positive CHECK (total_xp >= 0);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS streak_positive;
ALTER TABLE public.profiles ADD CONSTRAINT streak_positive CHECK (current_streak >= 0);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profile_score_range;
ALTER TABLE public.profiles ADD CONSTRAINT profile_score_range CHECK (knowledge_score >= 0 AND knowledge_score <= 100);

-- 2. Progress & Completion Constraints
ALTER TABLE public.module_progress DROP CONSTRAINT IF EXISTS module_score_range;
ALTER TABLE public.module_progress ADD CONSTRAINT module_score_range CHECK (score >= 0 AND score <= 100);

ALTER TABLE public.topic_progress DROP CONSTRAINT IF EXISTS topic_score_range;
ALTER TABLE public.topic_progress ADD CONSTRAINT topic_score_range CHECK (score >= 0 AND score <= 100);

ALTER TABLE public.test_attempts DROP CONSTRAINT IF EXISTS test_score_range;
ALTER TABLE public.test_attempts ADD CONSTRAINT test_score_range CHECK (score >= 0 AND score <= 100);

-- 3. Skills Constraints (Scores must be 0-100)
ALTER TABLE public.user_skills 
  DROP CONSTRAINT IF EXISTS skills_math_range,
  DROP CONSTRAINT IF EXISTS skills_qubits_range,
  DROP CONSTRAINT IF EXISTS skills_gates_range,
  DROP CONSTRAINT IF EXISTS skills_circuits_range,
  DROP CONSTRAINT IF EXISTS skills_qiskit_range,
  DROP CONSTRAINT IF EXISTS skills_algorithms_range,
  DROP CONSTRAINT IF EXISTS skills_qml_range,
  DROP CONSTRAINT IF EXISTS skills_noise_range,
  DROP CONSTRAINT IF EXISTS skills_error_correction_range,
  DROP CONSTRAINT IF EXISTS skills_hardware_range,
  DROP CONSTRAINT IF EXISTS skills_research_range,
  DROP CONSTRAINT IF EXISTS skills_cryptography_range,
  DROP CONSTRAINT IF EXISTS skills_optimization_range,
  DROP CONSTRAINT IF EXISTS skills_simulation_range;

ALTER TABLE public.user_skills 
  ADD CONSTRAINT skills_math_range CHECK (mathematics >= 0 AND mathematics <= 100),
  ADD CONSTRAINT skills_qubits_range CHECK (qubits >= 0 AND qubits <= 100),
  ADD CONSTRAINT skills_gates_range CHECK (gates >= 0 AND gates <= 100),
  ADD CONSTRAINT skills_circuits_range CHECK (circuits >= 0 AND circuits <= 100),
  ADD CONSTRAINT skills_qiskit_range CHECK (qiskit >= 0 AND qiskit <= 100),
  ADD CONSTRAINT skills_algorithms_range CHECK (algorithms >= 0 AND algorithms <= 100),
  ADD CONSTRAINT skills_qml_range CHECK (qml >= 0 AND qml <= 100),
  ADD CONSTRAINT skills_noise_range CHECK (noise >= 0 AND noise <= 100),
  ADD CONSTRAINT skills_error_correction_range CHECK (error_correction >= 0 AND error_correction <= 100),
  ADD CONSTRAINT skills_hardware_range CHECK (hardware >= 0 AND hardware <= 100),
  ADD CONSTRAINT skills_research_range CHECK (research >= 0 AND research <= 100),
  ADD CONSTRAINT skills_cryptography_range CHECK (cryptography >= 0 AND cryptography <= 100),
  ADD CONSTRAINT skills_optimization_range CHECK (optimization >= 0 AND optimization <= 100),
  ADD CONSTRAINT skills_simulation_range CHECK (simulation >= 0 AND simulation <= 100);

-- 4. Lab Experiments Constraints
ALTER TABLE public.lab_experiments DROP CONSTRAINT IF EXISTS fidelity_range;
ALTER TABLE public.lab_experiments ADD CONSTRAINT fidelity_range CHECK (fidelity >= 0 AND fidelity <= 1);
