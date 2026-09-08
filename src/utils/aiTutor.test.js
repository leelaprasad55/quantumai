import test from 'node:test';
import assert from 'node:assert/strict';

import { cleanResponseContent } from './aiTutor.js';

test('cleanResponseContent removes reasoning blocks and model control tokens', () => {
  const noisy = '<think>private reasoning</think><|assistant|>assistant: **Final answer**';

  assert.equal(cleanResponseContent(noisy), '**Final answer**');
});

test('cleanResponseContent removes an unclosed reasoning block', () => {
  assert.equal(cleanResponseContent('Useful answer\n<think>unfinished reasoning'), 'Useful answer');
});

test('cleanResponseContent returns empty output for empty model content', () => {
  assert.equal(cleanResponseContent(''), '');
  assert.equal(cleanResponseContent(null), '');
});
