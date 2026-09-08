import { createClient } from '@supabase/supabase-js';

export function assessSupabaseConfig(env = import.meta.env || {}) {
  const url = ((env && env.VITE_SUPABASE_URL) || '').trim();
  const anonKey = ((env && env.VITE_SUPABASE_ANON_KEY) || '').trim();
  const missing = [];

  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      url,
      anonKey,
      message: `Supabase is not configured. Missing: ${missing.join(', ')}. The app will continue in local-only mode.`
    };
  }

  return {
    ok: true,
    missing: [],
    url,
    anonKey,
    message: 'Supabase is configured.'
  };
}

const config = assessSupabaseConfig();

if (!config.ok) {
  console.warn(config.message);
}

export const isSupabaseConfigured = config.ok;
export const supabase = config.ok ? createClient(config.url, config.anonKey) : null;
