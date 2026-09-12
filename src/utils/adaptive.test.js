import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeKnowledgeFromTest,
  generateRoadmap,
  updateSkillsFromScore,
} from './adaptive.js';

test('computeKnowledgeFromTest returns skill and overall scores', () => {
  const questions = [
    { id: 'q1', skill: 'qubits', answer: 'a' },
    { id: 'q2', skill: 'qubits', answer: 'b' },
    { id: 'q3', skill: 'gates', answer: 'a' },
  ];

  const result = computeKnowledgeFromTest({ q1: 'a', q2: 'wrong', q3: 'a' }, questions);

  assert.deepEqual(result.skillScores, { qubits: 50, gates: 100 });
  assert.equal(result.overall, 75);
});

test('beginner roadmap includes all modules in curriculum order', () => {
  const roadmap = generateRoadmap({ mathematics: 0, qubits: 0 }, 'Learn quantum computing');

  assert.equal(roadmap.type, 'full');
  assert.equal(roadmap.isBeginner, true);
  assert.equal(roadmap.modules.length, 24);
  assert.deepEqual(roadmap.modules.slice(0, 3), [1, 2, 3]);
});

test('updateSkillsFromScore only increases tracked skills', () => {
  const updated = updateSkillsFromScore({ gates: 80, qubits: 0 }, ['gates', 'qubits'], 100);

  assert.equal(updated.gates, 86);
  assert.equal(updated.qubits, 30);
});
