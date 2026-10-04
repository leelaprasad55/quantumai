-- Remove legacy seeded contest/demo records. Contests are now authored and
-- managed as ordinary persisted records through the protected backend.
DELETE FROM public.contests WHERE demo_key IS NOT NULL OR is_demo = true;

ALTER TABLE public.contests DROP COLUMN IF EXISTS is_demo;
ALTER TABLE public.contests DROP COLUMN IF EXISTS demo_key;
ALTER TABLE public.contest_problems DROP COLUMN IF EXISTS demo_key;
DROP INDEX IF EXISTS public.contests_demo_key_unique;
DROP INDEX IF EXISTS public.contest_problems_demo_key_unique;

-- One row per assessment, scoped to the requesting instructor/admin. All
-- operational counts and averages are computed from persistent records.
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
        COUNT(DISTINCT aa.id)::BIGINT AS assigned_count,
        COUNT(DISTINCT s.id)::BIGINT AS submission_count,
        COALESCE(AVG(s.score), 0)::NUMERIC AS average_score
    FROM public.assessments a
    LEFT JOIN public.assessment_assignments aa ON aa.assessment_id = a.id
    LEFT JOIN public.assessment_submissions s ON s.assessment_id = a.id
    WHERE a.created_by = auth.uid() OR public.is_admin()
    GROUP BY a.id
    ORDER BY a.created_at DESC;
$$;

-- Assignment records are the source of truth for the instructor support path.
CREATE TABLE IF NOT EXISTS public.learning_path_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'archived')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.learning_path_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learning_path_assignments_admin_access" ON public.learning_path_assignments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "learning_path_assignments_instructor_access" ON public.learning_path_assignments
FOR ALL USING (instructor_id = auth.uid()) WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "learning_path_assignments_student_read" ON public.learning_path_assignments
FOR SELECT USING (student_id = auth.uid());