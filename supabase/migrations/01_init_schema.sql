-- ==========================================
-- QUANTUMLEARN AI - CANONICAL SCHEMA MIGRATION
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    knowledge_test_done BOOLEAN DEFAULT FALSE,
    knowledge_score INTEGER DEFAULT 0 CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to automatically create a profile for new users securely
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at, updated_at)
    VALUES (
        new.id,
        COALESCE(NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''), NULLIF(split_part(new.email, '@', 1), ''), 'Student User'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        'student', -- ALWAYS hardcode 'student', NEVER trust raw_user_meta_data->>'role'
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 2. USER PROGRESS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_active TIMESTAMPTZ,
    total_time INTEGER DEFAULT 0 CHECK (total_time >= 0),
    questions_answered INTEGER DEFAULT 0 CHECK (questions_answered >= 0),
    questions_correct INTEGER DEFAULT 0 CHECK (questions_correct >= 0),
    circuits_challenges_completed INTEGER DEFAULT 0 CHECK (circuits_challenges_completed >= 0),
    code_challenges_completed INTEGER DEFAULT 0 CHECK (code_challenges_completed >= 0),
    current_module INTEGER,
    current_topic TEXT,
    lab_experiments INTEGER DEFAULT 0 CHECK (lab_experiments >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 3. USER SKILLS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_skills (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mathematics INTEGER DEFAULT 0 CHECK (mathematics BETWEEN 0 AND 100),
    qubits INTEGER DEFAULT 0 CHECK (qubits BETWEEN 0 AND 100),
    gates INTEGER DEFAULT 0 CHECK (gates BETWEEN 0 AND 100),
    circuits INTEGER DEFAULT 0 CHECK (circuits BETWEEN 0 AND 100),
    qiskit INTEGER DEFAULT 0 CHECK (qiskit BETWEEN 0 AND 100),
    algorithms INTEGER DEFAULT 0 CHECK (algorithms BETWEEN 0 AND 100),
    qml INTEGER DEFAULT 0 CHECK (qml BETWEEN 0 AND 100),
    noise INTEGER DEFAULT 0 CHECK (noise BETWEEN 0 AND 100),
    error_correction INTEGER DEFAULT 0 CHECK (error_correction BETWEEN 0 AND 100),
    hardware INTEGER DEFAULT 0 CHECK (hardware BETWEEN 0 AND 100),
    research INTEGER DEFAULT 0 CHECK (research BETWEEN 0 AND 100),
    cryptography INTEGER DEFAULT 0 CHECK (cryptography BETWEEN 0 AND 100),
    optimization INTEGER DEFAULT 0 CHECK (optimization BETWEEN 0 AND 100),
    simulation INTEGER DEFAULT 0 CHECK (simulation BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 4. MODULE PROGRESS (Migrated from completed_modules)
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'completed_modules')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'module_progress') THEN
        ALTER TABLE public.completed_modules RENAME TO module_progress;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);


-- ==========================================
-- 5. TOPIC PROGRESS (Migrated from completed_topics)
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'completed_topics')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'topic_progress') THEN
        ALTER TABLE public.completed_topics RENAME TO topic_progress;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.topic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);


-- ==========================================
-- 6. TEST ATTEMPTS (Migrated from test_history)
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_history')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_attempts') THEN
        ALTER TABLE public.test_history RENAME TO test_attempts;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON public.test_attempts(user_id);


-- ==========================================
-- 7. SAVED QUANTUM CIRCUITS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.saved_circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    num_qubits INTEGER NOT NULL CHECK (num_qubits BETWEEN 1 AND 10),
    operations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_circuits_user ON public.saved_circuits(user_id);


-- ==========================================
-- 8. QUANTUM LAB EXPERIMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.lab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    preset_name TEXT,
    num_shots INTEGER CHECK (num_shots > 0),
    noise_model TEXT,
    fidelity NUMERIC CHECK (fidelity BETWEEN 0 AND 1),
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_experiments_user ON public.lab_experiments(user_id);


-- ==========================================
-- 9. DAILY ACTIVITY LOG
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    interaction_count INTEGER DEFAULT 1 CHECK (interaction_count >= 0),
    UNIQUE(user_id, activity_date)
);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);


-- ==========================================
-- 10. QUANTUM GATE USAGE ANALYTICS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gate_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gate_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1 CHECK (usage_count >= 0),
    UNIQUE(user_id, gate_name)
);
CREATE INDEX IF NOT EXISTS idx_gate_usage_user ON public.gate_usage(user_id);


-- ==========================================
-- 11. CIRCUIT PUZZLE PROGRESS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.puzzle_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, puzzle_id)
);
CREATE INDEX IF NOT EXISTS idx_puzzle_progress_user ON public.puzzle_progress(user_id);


-- ==========================================
-- 12. AI CHAT MESSAGES (Migrated from chat_history)
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_history')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_chat_messages') THEN
        ALTER TABLE public.chat_history RENAME TO ai_chat_messages;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user ON public.ai_chat_messages(user_id);
