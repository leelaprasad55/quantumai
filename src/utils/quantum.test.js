import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyGate,
  c,
  getProbabilities,
  initState,
  simulateCircuit,
  statesEqual,
} from './quantum.js';

function closeTo(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);
}

test('X gate maps |0> to |1>', () => {
  const state = applyGate(initState(1), 1, 'X', 0);
  const probabilities = getProbabilities(state);

  closeTo(probabilities[0], 0);
  closeTo(probabilities[1], 1);
});

test('Hadamard gate creates equal single-qubit probabilities', () => {
  const probabilities = getProbabilities(applyGate(initState(1), 1, 'H', 0));

  closeTo(probabilities[0], 0.5);
  closeTo(probabilities[1], 0.5);
});

test('H followed by CNOT creates a Bell state', () => {
  const state = simulateCircuit([
    { gate: 'H', target: 0, col: 0 },
    { gate: 'CNOT', control: 0, target: 1, col: 1 },
  ], 2);
  const probabilities = getProbabilities(state);

  closeTo(probabilities[0], 0.5);
  closeTo(probabilities[1], 0);
  closeTo(probabilities[2], 0);
  closeTo(probabilities[3], 0.5);
});

test('statesEqual accepts equivalent global phase', () => {
  const state = [c(1), c(0)];
  const phasedState = [c(-1), c(0)];

  assert.equal(statesEqual(state, phasedState), true);
});
