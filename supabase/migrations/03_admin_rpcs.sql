-- ==========================================
-- QUANTUMLEARN AI - ADMIN SECURITY DEFINER RPCs
-- ==========================================

-- 1. Admin Secure User Listing with Email Access
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
) AS $$
BEGIN
  -- Require Admin Privileges
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name as name,
    u.email::TEXT,
    p.avatar_url,
    p.role,
    (u.raw_user_meta_data->>'education')::TEXT as education,
    (u.raw_user_meta_data->>'goal')::TEXT as goal,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;


-- 2. Global Activity Summary (Heatmap Data)
CREATE OR REPLACE FUNCTION public.get_global_activity_summary()
RETURNS TABLE (activity_date DATE, total_interactions BIGINT)
AS $$
BEGIN
  -- Require Admin Privileges
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  RETURN QUERY 
  SELECT a.activity_date, SUM(a.interaction_count)::BIGINT as total_interactions
  FROM public.activity_log a
  GROUP BY a.activity_date
  ORDER BY a.activity_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. Global Gate Usage Summary
CREATE OR REPLACE FUNCTION public.get_global_gate_usage()
RETURNS TABLE (gate_name TEXT, total_usage BIGINT)
AS $$
BEGIN
  -- Require Admin Privileges
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  RETURN QUERY 
  SELECT g.gate_name, SUM(g.usage_count)::BIGINT as total_usage
  FROM public.gate_usage g
  GROUP BY g.gate_name
  ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. Complete Admin User Progress Reset RPC
CREATE OR REPLACE FUNCTION public.reset_user_progress(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Require Admin Privileges
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required';
  END IF;

  -- Transactionally delete all user progress across canonical tables
  DELETE FROM public.user_progress WHERE user_id = target_user_id;
  DELETE FROM public.user_skills WHERE user_id = target_user_id;
  DELETE FROM public.module_progress WHERE user_id = target_user_id;
  DELETE FROM public.topic_progress WHERE user_id = target_user_id;
  DELETE FROM public.test_attempts WHERE user_id = target_user_id;
  DELETE FROM public.activity_log WHERE user_id = target_user_id;
  DELETE FROM public.gate_usage WHERE user_id = target_user_id;
  DELETE FROM public.puzzle_progress WHERE user_id = target_user_id;
  DELETE FROM public.ai_chat_messages WHERE user_id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
