-- ==========================================
-- QUANTUMLEARN AI - USER SECURITY DEFINER RPCs
-- ==========================================

-- 1. Narrowly Scoped Profile Update (Name & Avatar ONLY)
CREATE OR REPLACE FUNCTION public.update_my_profile(p_full_name TEXT DEFAULT NULL, p_avatar_url TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Complete Knowledge Test Status & Score Update
CREATE OR REPLACE FUNCTION public.complete_knowledge_test(p_score INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Invalid score range: score must be between 0 and 100';
  END IF;

  UPDATE public.profiles
  SET
    knowledge_test_done = TRUE,
    knowledge_score = p_score,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. Atomic Activity Logging
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.activity_log (user_id, activity_date, interaction_count)
  VALUES (v_user_id, v_today, 1)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET interaction_count = public.activity_log.interaction_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. Atomic Gate Usage Increment
CREATE OR REPLACE FUNCTION public.increment_gate_usage(p_gate_name TEXT)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
