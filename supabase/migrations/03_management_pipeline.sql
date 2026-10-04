-- ==========================================
-- QUANTUMLEARN AI - MANAGEMENT PIPELINE
-- ==========================================
-- This migration intentionally adds the missing instructor and management data
-- model without altering the earlier canonical schema migration.

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('student', 'instructor', 'admin'));

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
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
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('instructor', 'admin')
    );
$$;

-- ==========================================
-- 1. INSTRUCTOR-STUDENT RELATIONSHIP
-- ==========================================
CREATE TABLE IF NOT EXISTS public.instructor_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (instructor_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_students_instructor
ON public.instructor_students (instructor_id);

CREATE INDEX IF NOT EXISTS idx_instructor_students_student
ON public.instructor_students (student_id);

-- ==========================================
-- 2. COHORTS
-- ==========================================
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

-- ==========================================
-- 3. ASSESSMENTS
-- ==========================================
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
    score INTEGER DEFAULT NULL CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'needs_review')),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.instructor_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id INTEGER,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. RLS + ACCESS RULES
-- ==========================================
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_feedback ENABLE ROW LEVEL SECURITY;

-- Generic admin access
CREATE POLICY "instructor_students_admin_full_access" ON public.instructor_students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cohorts_admin_full_access" ON public.cohorts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cohort_members_admin_full_access" ON public.cohort_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cohort_modules_admin_full_access" ON public.cohort_modules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "assessments_admin_full_access" ON public.assessments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "assessment_questions_admin_full_access" ON public.assessment_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "assessment_assignments_admin_full_access" ON public.assessment_assignments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "assessment_submissions_admin_full_access" ON public.assessment_submissions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "instructor_feedback_admin_full_access" ON public.instructor_feedback FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Instructor access is restricted to their own records and assigned students.
CREATE POLICY "instructor_students_instructor_access" ON public.instructor_students
FOR SELECT
USING (
    instructor_id = auth.uid() OR student_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "cohorts_instructor_access" ON public.cohorts
FOR SELECT
USING (
    created_by = auth.uid() OR public.is_admin()
);

CREATE POLICY "cohort_members_instructor_access" ON public.cohort_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_members.cohort_id
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
    OR student_id = auth.uid()
);

CREATE POLICY "cohort_modules_instructor_access" ON public.cohort_modules
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_modules.cohort_id
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "assessments_instructor_access" ON public.assessments
FOR SELECT
USING (
    created_by = auth.uid() OR public.is_admin()
);

CREATE POLICY "assessment_assignments_instructor_access" ON public.assessment_assignments
FOR SELECT
USING (
    assigned_by = auth.uid() OR student_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "assessment_submissions_instructor_access" ON public.assessment_submissions
FOR SELECT
USING (
    student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.assessment_assignments aa
        WHERE aa.assessment_id = assessment_submissions.assessment_id
        AND aa.assigned_by = auth.uid()
    ) OR public.is_admin()
);

CREATE POLICY "instructor_feedback_instructor_access" ON public.instructor_feedback
FOR SELECT
USING (
    instructor_id = auth.uid() OR student_id = auth.uid() OR public.is_admin()
);

-- Student access is limited to their own records.
CREATE POLICY "instructor_students_student_access" ON public.instructor_students
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "cohort_members_student_access" ON public.cohort_members
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "assessment_assignments_student_access" ON public.assessment_assignments
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "assessment_submissions_student_access" ON public.assessment_submissions
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "instructor_feedback_student_access" ON public.instructor_feedback
FOR SELECT
USING (student_id = auth.uid());

-- Insert/update rules for instructors/admins.
CREATE POLICY "instructor_students_instructor_write" ON public.instructor_students
FOR INSERT WITH CHECK (instructor_id = auth.uid() OR public.is_admin());

CREATE POLICY "cohorts_instructor_write" ON public.cohorts
FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "cohorts_instructor_update" ON public.cohorts
FOR UPDATE USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "cohort_members_instructor_write" ON public.cohort_members
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_members.cohort_id
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "assessments_instructor_write" ON public.assessments
FOR INSERT WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "assessments_instructor_update" ON public.assessments
FOR UPDATE USING (created_by = auth.uid() OR public.is_admin()) WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "assessment_assignments_instructor_write" ON public.assessment_assignments
FOR INSERT WITH CHECK (assigned_by = auth.uid() OR public.is_admin());

CREATE POLICY "assessment_submissions_student_insert" ON public.assessment_submissions
FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "assessment_submissions_instructor_update" ON public.assessment_submissions
FOR UPDATE USING (
    student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.assessment_assignments aa
        WHERE aa.assessment_id = assessment_submissions.assessment_id
        AND aa.assigned_by = auth.uid()
    ) OR public.is_admin()
) WITH CHECK (
    student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.assessment_assignments aa
        WHERE aa.assessment_id = assessment_submissions.assessment_id
        AND aa.assigned_by = auth.uid()
    ) OR public.is_admin()
);

CREATE POLICY "instructor_feedback_instructor_write" ON public.instructor_feedback
FOR INSERT WITH CHECK (instructor_id = auth.uid() OR public.is_admin());

-- ==========================================
-- 5. RPC FOR INSTRUCTOR STUDENT DATA
-- ==========================================
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
        SELECT DISTINCT student_id
        FROM public.instructor_students
        WHERE instructor_id = auth.uid()
        UNION
        SELECT DISTINCT p.id
        FROM public.profiles p
        WHERE public.is_admin()
    )
    SELECT
        p.id,
        COALESCE(p.full_name, split_part(u.email, '@', 1)) AS name,
        u.email,
        p.role,
        COALESCE(p.knowledge_score, 0) AS knowledge_score,
        COALESCE((SELECT COUNT(*) FROM public.module_progress mp WHERE mp.user_id = p.id), 0)::INTEGER AS completed_modules,
        COALESCE((SELECT AVG(score) FROM public.test_attempts ta WHERE ta.user_id = p.id), 0)::NUMERIC AS assessment_average,
        COALESCE((SELECT COUNT(*) FROM public.saved_circuits sc WHERE sc.user_id = p.id), 0)::BIGINT AS circuit_count,
        COALESCE((SELECT COUNT(*) FROM public.lab_experiments le WHERE le.user_id = p.id), 0)::BIGINT AS lab_count,
        COALESCE((SELECT current_module FROM public.user_progress up WHERE up.user_id = p.id), 0)::INTEGER AS current_module
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id IN (SELECT student_id FROM student_ids)
    ORDER BY p.full_name NULLS LAST, u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(
    target_user_id UUID,
    target_role TEXT
)
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
    SET role = target_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN FOUND;
END;
$$;
