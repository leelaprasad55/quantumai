import { MODULES } from '../data/modules.js';

export function generateRoadmap(skills, goal, completedModules = []) {
  const overall = Object.values(skills).reduce((a, b) => a + b, 0) / Object.values(skills).length;
  const isBeginner = overall < 20;

  if (isBeginner) {
    return { type: 'full', modules: MODULES.map(m => m.id), isBeginner: true };
  }

  // Find weak skills
  const weakSkills = Object.entries(skills).filter(([, v]) => v < 50).map(([k]) => k);
  const strongSkills = Object.entries(skills).filter(([, v]) => v >= 70).map(([k]) => k);

  // Goal-based priorities
  const goalPriority = {
    'Learn quantum computing': [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 15],
    'Become a quantum programmer': [7, 8, 9, 10, 14, 15, 16, 23],
    'Learn quantum algorithms': [9, 10, 14, 17, 19, 21, 24],
    'Learn quantum machine learning': [11, 14, 19, 20, 21, 24],
    'Prepare for research': [10, 17, 19, 20, 21, 22, 23, 24],
    'Prepare for a hackathon/project': [9, 10, 11, 16, 19, 23, 24],
  };

  const goalMods = goalPriority[goal] || [];

  // Modules covering weak skills
  const weakMods = MODULES
    .filter(m => m.skills.some(s => weakSkills.includes(s)))
    .map(m => m.id);

  // Modules student already completed
  const needed = [...new Set([...weakMods, ...goalMods])]
    .filter(id => !completedModules.includes(id))
    .sort((a, b) => a - b);

  // Check prerequisites
  const ordered = [];
  const added = new Set(completedModules);
  let queue = [...needed];
  let iterations = 0;
  while (queue.length > 0 && iterations < 100) {
    iterations++;
    const remaining = [];
    for (const id of queue) {
      const mod = MODULES.find(m => m.id === id);
      if (!mod) continue;
      const prereqsMet = mod.prereqs.every(p => added.has(p) || strongSkills.includes(MODULES.find(m => m.id === p)?.skills[0]));
      if (prereqsMet) { ordered.push(id); added.add(id); }
      else remaining.push(id);
    }
    if (remaining.length === queue.length) break;
    queue = remaining;
  }

  // Always include M24
  if (!ordered.includes(24)) ordered.push(24);

  return { type: 'personal', modules: ordered, isBeginner: false, weakSkills, strongSkills };
}

export function getNextModule(progress, skills, goal) {
  const { modules } = generateRoadmap(skills, goal, progress.completedModules || []);
  const next = modules.find(id => !progress.completedModules?.includes(id));
  return next ? MODULES.find(m => m.id === next) : null;
}

export function checkPrerequisites(moduleId, skills, completedModules) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return { ok: true, missing: [] };
  const missing = mod.prereqs.filter(p => {
    const prereqMod = MODULES.find(m => m.id === p);
    if (!prereqMod) return false;
    const completed = completedModules.includes(p);
    const skillOk = prereqMod.skills.every(s => (skills[s] || 0) >= 50);
    return !completed && !skillOk;
  });
  return { ok: missing.length === 0, missing: missing.map(p => MODULES.find(m => m.id === p)) };
}

export function updateSkillsFromScore(skills, moduleSkills, score) {
  const updated = { ...skills };
  for (const skill of moduleSkills) {
    const current = updated[skill] || 0;
    const delta = (score / 100) * 30;
    updated[skill] = Math.min(100, Math.max(current, Math.round(current * 0.7 + delta)));
  }
  return updated;
}

export function computeKnowledgeFromTest(answers, questions) {
  const bySkill = {};
  for (const q of questions) {
    if (!bySkill[q.skill]) bySkill[q.skill] = { correct: 0, total: 0 };
    bySkill[q.skill].total++;
    if (answers[q.id] === q.answer) bySkill[q.skill].correct++;
  }
  const skillScores = {};
  for (const [skill, data] of Object.entries(bySkill)) {
    skillScores[skill] = Math.round((data.correct / data.total) * 100);
  }
  const overall = Math.round(Object.values(skillScores).reduce((a, b) => a + b, 0) / Object.keys(skillScores).length);
  return { skillScores, overall };
}
