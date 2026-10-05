-- =============================================================================
-- QuantumLearn AI: FULL DATABASE RESET (NUCLEAR OPTION)
-- =============================================================================
-- WARNING: This will DELETE ALL DATA and recreate all tables from scratch.
-- Auth users (login credentials) are preserved.
-- Run this in Supabase Dashboard -> SQL Editor.
-- =============================================================================

-- =============================================
-- STEP 1: DROP ALL TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS assessment_submission_update_guard ON public.assessment_submissions;

-- =============================================
-- STEP 2: DROP ALL RPC FUNCTIONS
-- =============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_instructor() CASCADE;
DROP FUNCTION IF EXISTS public.is_instructor_or_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_my_profile(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.complete_knowledge_test(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.log_activity() CASCADE;
DROP FUNCTION IF EXISTS public.increment_gate_usage(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_global_activity_summary() CASCADE;
DROP FUNCTION IF EXISTS public.get_global_gate_usage() CASCADE;
DROP FUNCTION IF EXISTS public.reset_user_progress(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_instructor_students() CASCADE;
DROP FUNCTION IF EXISTS public.get_instructor_assessments() CASCADE;
DROP FUNCTION IF EXISTS public.set_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_contest(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.guard_assessment_submission_update() CASCADE;

-- =============================================
-- STEP 3: DROP ALL STORAGE POLICIES
-- (Cannot DELETE from storage tables directly; Supabase protects them.
--  The bucket and its objects are left in place — policies are recreated later.)
-- =============================================
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- =============================================
-- STEP 4: DROP ALL TABLES (order matters for FKs)
-- =============================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.learning_projects CASCADE;
DROP TABLE IF EXISTS public.achievement_definitions CASCADE;
DROP TABLE IF EXISTS public.coding_challenges CASCADE;
DROP TABLE IF EXISTS public.circuit_challenges CASCADE;
DROP TABLE IF EXISTS public.question_bank CASCADE;
DROP TABLE IF EXISTS public.learning_resources CASCADE;
DROP TABLE IF EXISTS public.admin_topics CASCADE;
DROP TABLE IF EXISTS public.admin_modules CASCADE;
DROP TABLE IF EXISTS public.user_ratings CASCADE;
DROP TABLE IF EXISTS public.contest_submissions CASCADE;
DROP TABLE IF EXISTS public.contest_problems CASCADE;
DROP TABLE IF EXISTS public.contests CASCADE;
DROP TABLE IF EXISTS public.learning_path_assignments CASCADE;
DROP TABLE IF EXISTS public.instructor_feedback CASCADE;
DROP TABLE IF EXISTS public.assessment_submissions CASCADE;
DROP TABLE IF EXISTS public.assessment_assignments CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.cohort_modules CASCADE;
DROP TABLE IF EXISTS public.cohort_members CASCADE;
DROP TABLE IF EXISTS public.cohorts CASCADE;
DROP TABLE IF EXISTS public.instructor_students CASCADE;
DROP TABLE IF EXISTS public.ai_chat_messages CASCADE;
DROP TABLE IF EXISTS public.puzzle_progress CASCADE;
DROP TABLE IF EXISTS public.gate_usage CASCADE;
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.lab_experiments CASCADE;
DROP TABLE IF EXISTS public.saved_circuits CASCADE;
DROP TABLE IF EXISTS public.test_attempts CASCADE;
DROP TABLE IF EXISTS public.topic_progress CASCADE;
DROP TABLE IF EXISTS public.module_progress CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================
-- STEP 5: NOW RUN THE FULL SETUP
-- (copy of QUANTUMLEARN_ALL_IN_ONE.sql below)
-- =============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CORE IDENTITY AND STUDENT DATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    knowledge_test_done BOOLEAN NOT NULL DEFAULT FALSE,
    knowledge_score INTEGER NOT NULL DEFAULT 0 CHECK (knowledge_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'instructor', 'admin'));
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
            NULLIF(split_part(NEW.email, '@', 1), ''),
            'Student User'
        ),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        'student',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create profiles for any EXISTING auth users who don't have one yet
INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at, updated_at)
SELECT
    u.id,
    COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(split_part(u.email, '@', 1), ''),
        'Student User'
    ),
    COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
    'student',
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_active TIMESTAMPTZ,
    total_time INTEGER NOT NULL DEFAULT 0 CHECK (total_time >= 0),
    questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
    questions_correct INTEGER NOT NULL DEFAULT 0 CHECK (questions_correct >= 0),
    circuits_challenges_completed INTEGER NOT NULL DEFAULT 0 CHECK (circuits_challenges_completed >= 0),
    code_challenges_completed INTEGER NOT NULL DEFAULT 0 CHECK (code_challenges_completed >= 0),
    current_module INTEGER,
    current_topic TEXT,
    lab_experiments INTEGER NOT NULL DEFAULT 0 CHECK (lab_experiments >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mathematics INTEGER NOT NULL DEFAULT 0 CHECK (mathematics BETWEEN 0 AND 100),
    qubits INTEGER NOT NULL DEFAULT 0 CHECK (qubits BETWEEN 0 AND 100),
    gates INTEGER NOT NULL DEFAULT 0 CHECK (gates BETWEEN 0 AND 100),
    circuits INTEGER NOT NULL DEFAULT 0 CHECK (circuits BETWEEN 0 AND 100),
    qiskit INTEGER NOT NULL DEFAULT 0 CHECK (qiskit BETWEEN 0 AND 100),
    algorithms INTEGER NOT NULL DEFAULT 0 CHECK (algorithms BETWEEN 0 AND 100),
    qml INTEGER NOT NULL DEFAULT 0 CHECK (qml BETWEEN 0 AND 100),
    noise INTEGER NOT NULL DEFAULT 0 CHECK (noise BETWEEN 0 AND 100),
    error_correction INTEGER NOT NULL DEFAULT 0 CHECK (error_correction BETWEEN 0 AND 100),
    hardware INTEGER NOT NULL DEFAULT 0 CHECK (hardware BETWEEN 0 AND 100),
    research INTEGER NOT NULL DEFAULT 0 CHECK (research BETWEEN 0 AND 100),
    cryptography INTEGER NOT NULL DEFAULT 0 CHECK (cryptography BETWEEN 0 AND 100),
    optimization INTEGER NOT NULL DEFAULT 0 CHECK (optimization BETWEEN 0 AND 100),
    simulation INTEGER NOT NULL DEFAULT 0 CHECK (simulation BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_circuits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    num_qubits INTEGER NOT NULL CHECK (num_qubits BETWEEN 1 AND 10),
    operations JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    preset_name TEXT,
    num_shots INTEGER CHECK (num_shots > 0),
    noise_model TEXT,
    fidelity NUMERIC CHECK (fidelity BETWEEN 0 AND 1),
    results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    interaction_count INTEGER NOT NULL DEFAULT 1 CHECK (interaction_count >= 0),
    UNIQUE (user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS public.gate_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gate_name TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1 CHECK (usage_count >= 0),
    UNIQUE (user_id, gate_name)
);

CREATE TABLE IF NOT EXISTS public.puzzle_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, puzzle_id)
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_circuits_user ON public.saved_circuits(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_experiments_user ON public.lab_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_usage_user ON public.gate_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_progress_user ON public.puzzle_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user ON public.ai_chat_messages(user_id);

-- =============================================================================
-- 2. INSTRUCTOR, COHORT, ASSESSMENT, AND LEARNING-PATH DATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.instructor_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (instructor_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cohort_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cohort_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.cohort_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    UNIQUE (cohort_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL DEFAULT 'quiz' CHECK (assessment_type IN ('quiz', 'lab', 'mixed')),
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0),
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'needs_review')),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_submissions_assessment_student_unique
    ON public.assessment_submissions (assessment_id, student_id);

CREATE TABLE IF NOT EXISTS public.instructor_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_path_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'archived')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_instructor_students_instructor ON public.instructor_students(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_students_student ON public.instructor_students(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_assignments_instructor ON public.learning_path_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_assignments_student ON public.learning_path_assignments(student_id);

-- =============================================================================
-- 3. CONTEST DATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_rated BOOLEAN NOT NULL DEFAULT TRUE,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.contest_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    contest_type TEXT NOT NULL CHECK (contest_type IN ('coding', 'circuit_building')),
    framework TEXT CHECK (framework IN ('qiskit', 'pennylane', 'cirq')),
    qubit_budget INTEGER NOT NULL CHECK (qubit_budget BETWEEN 1 AND 20),
    gate_budget INTEGER CHECK (gate_budget > 0),
    par_gates INTEGER CHECK (par_gates > 0),
    par_depth INTEGER CHECK (par_depth > 0),
    reference_ops JSONB NOT NULL DEFAULT '[]'::jsonb,
    pass_threshold NUMERIC NOT NULL DEFAULT 0.95 CHECK (pass_threshold BETWEEN 0 AND 1),
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.contest_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.contest_problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('code', 'ops')),
    submitted_code TEXT,
    submitted_ops JSONB,
    correctness_score NUMERIC CHECK (correctness_score BETWEEN 0 AND 1),
    efficiency_score NUMERIC CHECK (efficiency_score BETWEEN 0 AND 1),
    fidelity_score NUMERIC CHECK (fidelity_score BETWEEN 0 AND 1),
    fidelity_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (fidelity_status IN ('not_requested', 'queued', 'running', 'complete', 'unavailable', 'failed')),
    fidelity_job_id TEXT,
    fidelity_error TEXT,
    total_score NUMERIC CHECK (total_score BETWEEN 0 AND 1),
    gates_used INTEGER NOT NULL CHECK (gates_used >= 0),
    depth_used INTEGER NOT NULL CHECK (depth_used >= 0),
    is_best_for_user BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (submission_type = 'code' AND submitted_code IS NOT NULL)
        OR (submission_type = 'ops' AND submitted_ops IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS contest_best_submission_per_problem_user
    ON public.contest_submissions(problem_id, user_id) WHERE is_best_for_user;
CREATE INDEX IF NOT EXISTS contest_submissions_problem_user
    ON public.contest_submissions(problem_id, user_id);

CREATE TABLE IF NOT EXISTS public.user_ratings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_rating INTEGER NOT NULL DEFAULT 1200,
    rating_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    contests_participated INTEGER NOT NULL DEFAULT 0 CHECK (contests_participated >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. ADMIN CONTENT AND PLATFORM OPERATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_topics (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.learning_resources (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.question_bank (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.circuit_challenges (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.coding_challenges (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.achievement_definitions (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.learning_projects (LIKE public.admin_modules INCLUDING ALL);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
    entity_type TEXT NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 100),
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
    setting_key TEXT PRIMARY KEY CHECK (setting_key = 'platform'),
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_settings (setting_key, value)
VALUES ('platform', '{"contest_submission_limit":10,"allow_contest_resubmissions":true,"maintenance_message":""}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS admin_modules_status_order_idx ON public.admin_modules(status, sort_order);
CREATE INDEX IF NOT EXISTS admin_topics_status_order_idx ON public.admin_topics(status, sort_order);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_admin_id_idx ON public.audit_logs(admin_id);

-- =============================================================================
-- 5. ROLE HELPERS AND SECURE RPC FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'instructor'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_instructor_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.update_my_profile(
    p_full_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.profiles
    SET
        full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        updated_at = NOW()
    WHERE id = v_user_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_knowledge_test(p_score INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_score < 0 OR p_score > 100 THEN
        RAISE EXCEPTION 'Invalid score range';
    END IF;

    UPDATE public.profiles
    SET knowledge_test_done = TRUE, knowledge_score = p_score, updated_at = NOW()
    WHERE id = v_user_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public.activity_log (user_id, activity_date, interaction_count)
    VALUES (v_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET interaction_count = public.activity_log.interaction_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_gate_usage(p_gate_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL OR p_gate_name IS NULL OR length(trim(p_gate_name)) = 0 THEN
        RETURN;
    END IF;

    INSERT INTO public.gate_usage (user_id, gate_name, usage_count)
    VALUES (v_user_id, trim(p_gate_name), 1)
    ON CONFLICT (user_id, gate_name)
    DO UPDATE SET usage_count = public.gate_usage.usage_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT,
    education TEXT,
    goal TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        u.email::TEXT,
        p.avatar_url,
        p.role,
        (u.raw_user_meta_data->>'education')::TEXT,
        (u.raw_user_meta_data->>'goal')::TEXT,
        p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_global_activity_summary()
RETURNS TABLE (activity_date DATE, total_interactions BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;

    RETURN QUERY
    SELECT a.activity_date, SUM(a.interaction_count)::BIGINT
    FROM public.activity_log a
    GROUP BY a.activity_date
    ORDER BY a.activity_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_global_gate_usage()
RETURNS TABLE (gate_name TEXT, total_usage BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;

    RETURN QUERY
    SELECT g.gate_name, SUM(g.usage_count)::BIGINT
    FROM public.gate_usage g
    GROUP BY g.gate_name
    ORDER BY total_usage DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_user_progress(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user ID is required';
    END IF;

    DELETE FROM public.user_progress WHERE user_id = target_user_id;
    DELETE FROM public.user_skills WHERE user_id = target_user_id;
    DELETE FROM public.module_progress WHERE user_id = target_user_id;
    DELETE FROM public.topic_progress WHERE user_id = target_user_id;
    DELETE FROM public.test_attempts WHERE user_id = target_user_id;
    DELETE FROM public.saved_circuits WHERE user_id = target_user_id;
    DELETE FROM public.lab_experiments WHERE user_id = target_user_id;
    DELETE FROM public.activity_log WHERE user_id = target_user_id;
    DELETE FROM public.gate_usage WHERE user_id = target_user_id;
    DELETE FROM public.puzzle_progress WHERE user_id = target_user_id;
    DELETE FROM public.ai_chat_messages WHERE user_id = target_user_id;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_instructor_students()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    knowledge_score INTEGER,
    completed_modules INTEGER,
    assessment_average NUMERIC,
    circuit_count BIGINT,
    lab_count BIGINT,
    current_module INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT (public.is_admin() OR public.is_instructor()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH student_ids AS (
        SELECT DISTINCT ist.student_id
        FROM public.instructor_students ist
        WHERE ist.instructor_id = auth.uid() AND ist.status = 'active'
        UNION
        SELECT p.id
        FROM public.profiles p
        WHERE public.is_admin() AND p.role = 'student'
    )
    SELECT
        p.id,
        COALESCE(p.full_name, split_part(u.email, '@', 1)),
        u.email,
        p.role,
        COALESCE(p.knowledge_score, 0),
        COALESCE((SELECT COUNT(*) FROM public.module_progress mp WHERE mp.user_id = p.id), 0)::INTEGER,
        COALESCE((SELECT AVG(ta.score) FROM public.test_attempts ta WHERE ta.user_id = p.id), 0)::NUMERIC,
        COALESCE((SELECT COUNT(*) FROM public.saved_circuits sc WHERE sc.user_id = p.id), 0)::BIGINT,
        COALESCE((SELECT COUNT(*) FROM public.lab_experiments le WHERE le.user_id = p.id), 0)::BIGINT,
        COALESCE((SELECT up.current_module FROM public.user_progress up WHERE up.user_id = p.id), 0)::INTEGER
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.role = 'student' AND p.id IN (SELECT student_id FROM student_ids)
    ORDER BY p.full_name NULLS LAST, u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_instructor_assessments()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    assessment_type TEXT,
    difficulty TEXT,
    duration_minutes INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ,
    assigned_count BIGINT,
    submission_count BIGINT,
    average_score NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        a.id,
        a.title,
        a.description,
        a.assessment_type,
        a.difficulty,
        a.duration_minutes,
        a.status,
        a.created_at,
        COUNT(DISTINCT aa.id)::BIGINT,
        COUNT(DISTINCT s.id)::BIGINT,
        COALESCE(AVG(s.score), 0)::NUMERIC
    FROM public.assessments a
    LEFT JOIN public.assessment_assignments aa ON aa.assessment_id = a.id
    LEFT JOIN public.assessment_submissions s ON s.assessment_id = a.id
    WHERE a.created_by = auth.uid() OR public.is_admin()
    GROUP BY a.id
    ORDER BY a.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;
    IF target_role NOT IN ('student', 'instructor', 'admin') THEN
        RAISE EXCEPTION 'Invalid role value';
    END IF;

    UPDATE public.profiles
    SET role = target_role, updated_at = NOW()
    WHERE id = target_user_id;

    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_contest(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    contest_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: User is not an admin';
    END IF;

    INSERT INTO public.contests (title, description, start_time, end_time, is_rated)
    VALUES (
        payload->>'title',
        payload->>'description',
        (payload->>'start_time')::TIMESTAMPTZ,
        (payload->>'end_time')::TIMESTAMPTZ,
        COALESCE((payload->>'is_rated')::BOOLEAN, TRUE)
    )
    RETURNING id INTO contest_id;

    RETURN contest_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_assessment_submission_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF public.is_admin() OR EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = OLD.assessment_id AND a.created_by = auth.uid()
    ) THEN
        RETURN NEW;
    END IF;

    IF auth.uid() = OLD.student_id THEN
        IF OLD.status <> 'submitted'
            OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id
            OR NEW.student_id IS DISTINCT FROM OLD.student_id
            OR NEW.score IS DISTINCT FROM OLD.score
            OR NEW.status IS DISTINCT FROM OLD.status
            OR NEW.feedback IS DISTINCT FROM OLD.feedback
            OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
            OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
            RAISE EXCEPTION 'Students may update answers only while an assessment is submitted';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Access denied';
END;
$$;

DROP TRIGGER IF EXISTS assessment_submission_update_guard ON public.assessment_submissions;
CREATE TRIGGER assessment_submission_update_guard
    BEFORE UPDATE ON public.assessment_submissions
    FOR EACH ROW EXECUTE FUNCTION public.guard_assessment_submission_update();

-- =============================================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_insert_policy ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_delete_policy ON public.profiles
    FOR DELETE USING (public.is_admin());
REVOKE UPDATE ON public.profiles FROM authenticated, anon, public;

-- Student-owned records
CREATE POLICY user_progress_select ON public.user_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY user_progress_insert ON public.user_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_progress_update ON public.user_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_progress_delete ON public.user_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY user_skills_select ON public.user_skills FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY user_skills_insert ON public.user_skills FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_skills_update ON public.user_skills FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_skills_delete ON public.user_skills FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY module_progress_select ON public.module_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY module_progress_insert ON public.module_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY module_progress_update ON public.module_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY module_progress_delete ON public.module_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY topic_progress_select ON public.topic_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY topic_progress_insert ON public.topic_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY topic_progress_update ON public.topic_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY topic_progress_delete ON public.topic_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY test_attempts_select ON public.test_attempts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY test_attempts_insert ON public.test_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY test_attempts_delete ON public.test_attempts FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY saved_circuits_select ON public.saved_circuits FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY saved_circuits_insert ON public.saved_circuits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY saved_circuits_update ON public.saved_circuits FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY saved_circuits_delete ON public.saved_circuits FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY lab_experiments_select ON public.lab_experiments FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY lab_experiments_insert ON public.lab_experiments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY lab_experiments_update ON public.lab_experiments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY lab_experiments_delete ON public.lab_experiments FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY activity_log_select ON public.activity_log FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY activity_log_insert ON public.activity_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY activity_log_update ON public.activity_log FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY activity_log_delete ON public.activity_log FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY gate_usage_select ON public.gate_usage FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY gate_usage_insert ON public.gate_usage FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY gate_usage_update ON public.gate_usage FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY gate_usage_delete ON public.gate_usage FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY puzzle_progress_select ON public.puzzle_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY puzzle_progress_insert ON public.puzzle_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY puzzle_progress_update ON public.puzzle_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY puzzle_progress_delete ON public.puzzle_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY ai_chat_messages_select ON public.ai_chat_messages FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY ai_chat_messages_insert ON public.ai_chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_chat_messages_delete ON public.ai_chat_messages FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Instructor relationships and cohorts
CREATE POLICY instructor_students_admin_full_access ON public.instructor_students
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY instructor_students_instructor_access ON public.instructor_students
    FOR SELECT USING (instructor_id = auth.uid() OR student_id = auth.uid() OR public.is_admin());
CREATE POLICY instructor_students_instructor_write ON public.instructor_students
    FOR INSERT WITH CHECK (instructor_id = auth.uid() OR public.is_admin());
CREATE POLICY instructor_students_instructor_update ON public.instructor_students
    FOR UPDATE USING (instructor_id = auth.uid() OR public.is_admin()) WITH CHECK (instructor_id = auth.uid() OR public.is_admin());
CREATE POLICY instructor_students_instructor_delete ON public.instructor_students
    FOR DELETE USING (instructor_id = auth.uid() OR public.is_admin());

CREATE POLICY cohorts_admin_full_access ON public.cohorts
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cohorts_instructor_access ON public.cohorts
    FOR SELECT USING (created_by = auth.uid() OR public.is_admin());
CREATE POLICY cohorts_instructor_write ON public.cohorts
    FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY cohorts_instructor_update ON public.cohorts
    FOR UPDATE USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY cohorts_instructor_delete ON public.cohorts
    FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY cohort_members_admin_full_access ON public.cohort_members
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cohort_members_instructor_access ON public.cohort_members
    FOR SELECT USING (
        student_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.cohorts c
            WHERE c.id = cohort_members.cohort_id AND c.created_by = auth.uid()
        )
    );
CREATE POLICY cohort_members_instructor_write ON public.cohort_members
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_members.cohort_id AND c.created_by = auth.uid()
    ));
CREATE POLICY cohort_members_instructor_delete ON public.cohort_members
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_members.cohort_id AND c.created_by = auth.uid()
    ));

CREATE POLICY cohort_modules_admin_full_access ON public.cohort_modules
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY cohort_modules_instructor_access ON public.cohort_modules
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_modules.cohort_id AND c.created_by = auth.uid()
    ));
CREATE POLICY cohort_modules_instructor_write ON public.cohort_modules
    FOR INSERT WITH CHECK (assigned_by = auth.uid() AND EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_modules.cohort_id AND c.created_by = auth.uid()
    ));
CREATE POLICY cohort_modules_instructor_update ON public.cohort_modules
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_modules.cohort_id AND c.created_by = auth.uid()
    )) WITH CHECK (assigned_by = auth.uid());
CREATE POLICY cohort_modules_instructor_delete ON public.cohort_modules
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_modules.cohort_id AND c.created_by = auth.uid()
    ));

-- Assessments
CREATE POLICY assessments_admin_full_access ON public.assessments
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY assessments_instructor_access ON public.assessments
    FOR SELECT USING (created_by = auth.uid() OR public.is_admin());
CREATE POLICY assessments_assigned_student_read ON public.assessments
    FOR SELECT USING (
        status = 'published' AND EXISTS (
            SELECT 1 FROM public.assessment_assignments aa
            WHERE aa.assessment_id = assessments.id AND aa.student_id = auth.uid()
        )
    );
CREATE POLICY assessments_instructor_write ON public.assessments
    FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY assessments_instructor_update ON public.assessments
    FOR UPDATE USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY assessments_instructor_delete ON public.assessments
    FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY assessment_questions_admin_full_access ON public.assessment_questions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY assessment_questions_instructor_access ON public.assessment_questions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_questions.assessment_id AND a.created_by = auth.uid()
    )) WITH CHECK (EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_questions.assessment_id AND a.created_by = auth.uid()
    ));
CREATE POLICY assessment_questions_assigned_student_read ON public.assessment_questions
    FOR SELECT USING (EXISTS (
        SELECT 1
        FROM public.assessment_assignments aa
        JOIN public.assessments a ON a.id = aa.assessment_id
        WHERE aa.assessment_id = assessment_questions.assessment_id
          AND aa.student_id = auth.uid()
          AND a.status = 'published'
    ));

CREATE POLICY assessment_assignments_admin_full_access ON public.assessment_assignments
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY assessment_assignments_instructor_access ON public.assessment_assignments
    FOR SELECT USING (assigned_by = auth.uid() OR student_id = auth.uid() OR public.is_admin());
CREATE POLICY assessment_assignments_instructor_write ON public.assessment_assignments
    FOR INSERT WITH CHECK (
        public.is_admin() OR (
            assigned_by = auth.uid() AND EXISTS (
                SELECT 1 FROM public.instructor_students ist
                WHERE ist.instructor_id = auth.uid()
                  AND ist.student_id = assessment_assignments.student_id
                  AND ist.status = 'active'
            )
        )
    );
CREATE POLICY assessment_assignments_instructor_update ON public.assessment_assignments
    FOR UPDATE USING (assigned_by = auth.uid() OR public.is_admin()) WITH CHECK (assigned_by = auth.uid() OR public.is_admin());
CREATE POLICY assessment_assignments_instructor_delete ON public.assessment_assignments
    FOR DELETE USING (assigned_by = auth.uid() OR public.is_admin());

CREATE POLICY assessment_submissions_admin_full_access ON public.assessment_submissions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY assessment_submissions_instructor_access ON public.assessment_submissions
    FOR SELECT USING (
        student_id = auth.uid() OR public.is_admin() OR EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_submissions.assessment_id AND a.created_by = auth.uid()
        )
    );
CREATE POLICY assessment_submissions_student_insert ON public.assessment_submissions
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.assessment_assignments aa
            WHERE aa.assessment_id = assessment_submissions.assessment_id
              AND aa.student_id = auth.uid()
        )
    );
CREATE POLICY assessment_submissions_student_update_answers ON public.assessment_submissions
    FOR UPDATE USING (student_id = auth.uid() AND status = 'submitted')
    WITH CHECK (student_id = auth.uid() AND status = 'submitted');
CREATE POLICY assessment_submissions_instructor_grade ON public.assessment_submissions
    FOR UPDATE USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_submissions.assessment_id AND a.created_by = auth.uid()
        )
    ) WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = assessment_submissions.assessment_id AND a.created_by = auth.uid()
        )
    );

CREATE POLICY instructor_feedback_admin_full_access ON public.instructor_feedback
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY instructor_feedback_instructor_access ON public.instructor_feedback
    FOR SELECT USING (instructor_id = auth.uid() OR student_id = auth.uid() OR public.is_admin());
CREATE POLICY instructor_feedback_instructor_write ON public.instructor_feedback
    FOR INSERT WITH CHECK (
        public.is_admin() OR (
            instructor_id = auth.uid() AND EXISTS (
                SELECT 1 FROM public.instructor_students ist
                WHERE ist.instructor_id = auth.uid()
                  AND ist.student_id = instructor_feedback.student_id
                  AND ist.status = 'active'
            )
        )
    );

CREATE POLICY learning_path_assignments_admin_access ON public.learning_path_assignments
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY learning_path_assignments_instructor_access ON public.learning_path_assignments
    FOR ALL USING (
        instructor_id = auth.uid()
    ) WITH CHECK (
        instructor_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.instructor_students ist
            WHERE ist.instructor_id = auth.uid()
              AND ist.student_id = learning_path_assignments.student_id
              AND ist.status = 'active'
        )
    );
CREATE POLICY learning_path_assignments_student_read ON public.learning_path_assignments
    FOR SELECT USING (student_id = auth.uid());

-- Contests
CREATE POLICY contests_read ON public.contests FOR SELECT USING (TRUE);
CREATE POLICY contest_submissions_own_read ON public.contest_submissions
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY contest_submissions_own_insert ON public.contest_submissions
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_ratings_own_read ON public.user_ratings
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Admin-managed content
CREATE POLICY admin_modules_published_read ON public.admin_modules FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY admin_topics_published_read ON public.admin_topics FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY learning_resources_published_read ON public.learning_resources FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY announcements_published_read ON public.announcements FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY question_bank_admin_read ON public.question_bank FOR SELECT USING (public.is_admin());
CREATE POLICY circuit_challenges_admin_read ON public.circuit_challenges FOR SELECT USING (public.is_admin());
CREATE POLICY coding_challenges_admin_read ON public.coding_challenges FOR SELECT USING (public.is_admin());
CREATE POLICY achievement_definitions_admin_read ON public.achievement_definitions FOR SELECT USING (public.is_admin());
CREATE POLICY learning_projects_admin_read ON public.learning_projects FOR SELECT USING (public.is_admin());
CREATE POLICY audit_logs_admin_read ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY admin_settings_admin_read ON public.admin_settings FOR SELECT USING (public.is_admin());

-- Contest problems readable by all authenticated users
CREATE POLICY contest_problems_read ON public.contest_problems FOR SELECT USING (TRUE);

-- =============================================================================
-- 7. AVATAR STORAGE
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- =============================================================================
-- 8. RPC EXECUTION PERMISSIONS
-- =============================================================================

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_knowledge_test(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_gate_usage(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_global_activity_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_global_gate_usage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_user_progress(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_instructor_students() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_instructor_assessments() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_contest(JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_knowledge_test(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_gate_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_activity_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_gate_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_instructor_students() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_instructor_assessments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_contest(JSONB) TO authenticated;

COMMIT;

-- =============================================================================
-- DONE! Your database is now clean and ready.
-- =============================================================================
-- Next steps after users sign in:
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<YOUR_AUTH_USER_UUID>';
-- =============================================================================
