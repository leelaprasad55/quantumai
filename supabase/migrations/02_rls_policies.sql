-- ==========================================
-- QUANTUMLEARN AI - ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- 1. Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==========================================
-- 2. ENABLE RLS ON ALL 12 CANONICAL TABLES
-- ==========================================
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


-- ==========================================
-- 3. DROP OLD POLICIES FOR IDEMPOTENCY
-- ==========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
    END LOOP;
END $$;


-- ==========================================
-- 4. PROFILES POLICIES
-- ==========================================
-- Users can view their own profile, admins can view all
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_admin());

-- Profiles insertion allowed during auth registration trigger
CREATE POLICY "profiles_insert_policy"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- REVOKE direct UPDATE permissions on profiles table to prevent unauthorized field mutation
REVOKE UPDATE ON public.profiles FROM authenticated, anon, public;

-- Allow DELETE only for admins
CREATE POLICY "profiles_delete_policy"
    ON public.profiles FOR DELETE
    USING (public.is_admin());


-- ==========================================
-- 5. CANONICAL USER TABLES POLICIES
-- ==========================================

-- User Progress
CREATE POLICY "user_progress_select" ON public.user_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_progress_insert" ON public.user_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_update" ON public.user_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_delete" ON public.user_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- User Skills
CREATE POLICY "user_skills_select" ON public.user_skills FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_skills_insert" ON public.user_skills FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_skills_update" ON public.user_skills FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_skills_delete" ON public.user_skills FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Module Progress
CREATE POLICY "module_progress_select" ON public.module_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "module_progress_insert" ON public.module_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "module_progress_update" ON public.module_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "module_progress_delete" ON public.module_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Topic Progress
CREATE POLICY "topic_progress_select" ON public.topic_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "topic_progress_insert" ON public.topic_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "topic_progress_update" ON public.topic_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "topic_progress_delete" ON public.topic_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Test Attempts
CREATE POLICY "test_attempts_select" ON public.test_attempts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "test_attempts_insert" ON public.test_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "test_attempts_delete" ON public.test_attempts FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Saved Circuits
CREATE POLICY "saved_circuits_select" ON public.saved_circuits FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "saved_circuits_insert" ON public.saved_circuits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_circuits_update" ON public.saved_circuits FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_circuits_delete" ON public.saved_circuits FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Lab Experiments
CREATE POLICY "lab_experiments_select" ON public.lab_experiments FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "lab_experiments_insert" ON public.lab_experiments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "lab_experiments_update" ON public.lab_experiments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "lab_experiments_delete" ON public.lab_experiments FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Activity Log
CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity_log_update" ON public.activity_log FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity_log_delete" ON public.activity_log FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Gate Usage
CREATE POLICY "gate_usage_select" ON public.gate_usage FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "gate_usage_insert" ON public.gate_usage FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "gate_usage_update" ON public.gate_usage FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "gate_usage_delete" ON public.gate_usage FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Puzzle Progress
CREATE POLICY "puzzle_progress_select" ON public.puzzle_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "puzzle_progress_insert" ON public.puzzle_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "puzzle_progress_update" ON public.puzzle_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "puzzle_progress_delete" ON public.puzzle_progress FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- AI Chat Messages
CREATE POLICY "ai_chat_messages_select" ON public.ai_chat_messages FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "ai_chat_messages_insert" ON public.ai_chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_chat_messages_delete" ON public.ai_chat_messages FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
