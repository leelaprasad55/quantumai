import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExecutionResult } from './quantumApi.js';

test('accepts complete responses from current quantum backend', () => {
  const response = { success: true, measurements: { '00': 64 } };
  assert.equal(normalizeExecutionResult(response), response);
});

test('accepts legacy measurement responses without a success flag', () => {
  assert.deepEqual(normalizeExecutionResult({ counts: { '11': 64 } }), {
    success: true,
    measurements: { '11': 64 },
    counts: { '11': 64 },
  });
});

test('leaves an incomplete response as a failure', () => {
  const response = { detail: 'Backend unavailable' };
  assert.equal(normalizeExecutionResult(response), response);
});
