-- Secure, admin-managed content and operations foundation.
-- These tables are intentionally separate from existing source-backed student
-- curriculum until a verified content migration is explicitly performed.

CREATE TABLE IF NOT EXISTS public.admin_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id), updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_topics (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.learning_resources (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.question_bank (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.circuit_challenges (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.coding_challenges (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.achievement_definitions (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.learning_projects (LIKE public.admin_modules INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0), metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id), updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  entity_type text NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 100),
  entity_id text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_modules_status_order_idx ON public.admin_modules(status, sort_order);
CREATE INDEX IF NOT EXISTS admin_topics_status_order_idx ON public.admin_topics(status, sort_order);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_admin_id_idx ON public.audit_logs(admin_id);

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

-- Published content can be read by students only when a later verified student
-- data-service integration opts into these tables.  Private drafts and audit
-- records remain inaccessible to direct clients.  The FastAPI service role
-- performs all administration after its own require_admin check.
CREATE POLICY "admin_modules_published_read" ON public.admin_modules FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "admin_topics_published_read" ON public.admin_topics FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "learning_resources_published_read" ON public.learning_resources FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "announcements_published_read" ON public.announcements FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "question_bank_admin_read" ON public.question_bank FOR SELECT USING (public.is_admin());
CREATE POLICY "circuit_challenges_admin_read" ON public.circuit_challenges FOR SELECT USING (public.is_admin());
CREATE POLICY "coding_challenges_admin_read" ON public.coding_challenges FOR SELECT USING (public.is_admin());
CREATE POLICY "achievement_definitions_admin_read" ON public.achievement_definitions FOR SELECT USING (public.is_admin());
CREATE POLICY "learning_projects_admin_read" ON public.learning_projects FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT USING (public.is_admin());
