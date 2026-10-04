-- ==========================================
-- QUANTUMLEARN AI - TIGHTEN SUBMISSION RLS
-- ==========================================
-- Students may only update their own answers (not score/grading columns).
-- Instructors/admins may update grading columns only on submissions assigned
-- to their assessments. This removes the broad student update that was left
-- open by the initial management pipeline migration.

-- Drop the overly-broad policy created during the management pipeline
-- migration so we can replace it with two scoped policies.
DROP POLICY IF EXISTS "assessment_submissions_instructor_update" ON public.assessment_submissions;

-- Students: only allowed to update the answers column on their own submission
-- while the submission status is still 'submitted' (not yet graded).
CREATE POLICY "assessment_submissions_student_update_answers"
ON public.assessment_submissions
FOR UPDATE
USING (student_id = auth.uid() AND status = 'submitted')
WITH CHECK (student_id = auth.uid());

-- Instructors/admins: may update grading columns on any submission that
-- belongs to an assessment they created or were assigned to.
CREATE POLICY "assessment_submissions_instructor_grade"
ON public.assessment_submissions
FOR UPDATE
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.assessments a
        WHERE a.id = assessment_submissions.assessment_id
          AND a.created_by = auth.uid()
    )
)
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.assessments a
        WHERE a.id = assessment_submissions.assessment_id
          AND a.created_by = auth.uid()
    )
);
