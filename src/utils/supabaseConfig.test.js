import test from 'node:test';
import assert from 'node:assert/strict';

import { assessSupabaseConfig } from '../lib/supabaseClient.js';

test('assessSupabaseConfig reports missing env vars when Supabase is not configured', () => {
  const result = assessSupabaseConfig({});

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('VITE_SUPABASE_URL'));
  assert.ok(result.missing.includes('VITE_SUPABASE_ANON_KEY'));
  assert.match(result.message, /not configured/i);
});

test('assessSupabaseConfig accepts valid env vars', () => {
  const result = assessSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'anon-key'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.match(result.message, /configured/i);
});
