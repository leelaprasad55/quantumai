const PREFIX = 'ql_';

export const storage = {
  get(key) {
    try {
      const val = localStorage.getItem(PREFIX + key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  getUser() { return this.get('currentUser'); },
  setUser(user) { this.set('currentUser', user); },
  getProgress(userId) { return this.get(`progress_${userId}`) || createDefaultProgress(); },
  setProgress(userId, progress) { this.set(`progress_${userId}`, progress); },
  getSkills(userId) { return this.get(`skills_${userId}`) || createDefaultSkills(); },
  setSkills(userId, skills) { this.set(`skills_${userId}`, skills); },
  getAchievements(userId) { return this.get(`achievements_${userId}`) || []; },
  setAchievements(userId, a) { this.set(`achievements_${userId}`, a); },
  getSavedCircuits(userId) { return this.get(`circuits_${userId}`) || []; },
  setSavedCircuits(userId, c) { this.set(`circuits_${userId}`, c); },
  getLabExperiments(userId) { return this.get(`labs_${userId}`) || []; },
  setLabExperiments(userId, e) { this.set(`labs_${userId}`, e); },
  getChatHistory(userId) { return this.get(`chat_${userId}`) || []; },
  setChatHistory(userId, h) { this.set(`chat_${userId}`, h); },
  getUsers() { return this.get('users') || []; },
  incrementLabExperiments(userId) {
    const p = this.getProgress(userId);
    p.labExperiments = (p.labExperiments || 0) + 1;
    this.setProgress(userId, p);
  },
  // Activity log for heatmap
  getActivityLog(userId) { return this.get(`activity_${userId}`) || {}; },
  setActivityLog(userId, log) { this.set(`activity_${userId}`, log); },
  logActivity(userId) {
    const log = this.getActivityLog(userId);
    const today = new Date().toISOString().split('T')[0];
    log[today] = (log[today] || 0) + 1;
    this.setActivityLog(userId, log);
  },
  // Gate usage tracking
  getGateUsage(userId) { return this.get(`gateUsage_${userId}`) || {}; },
  setGateUsage(userId, usage) { this.set(`gateUsage_${userId}`, usage); },
  trackGateUsage(userId, gateName) {
    const usage = this.getGateUsage(userId);
    usage[gateName] = (usage[gateName] || 0) + 1;
    this.setGateUsage(userId, usage);
  },
  // Puzzle progress
  getPuzzleProgress(userId) { return this.get(`puzzles_${userId}`) || {}; },
  setPuzzleProgress(userId, puzzles) { this.set(`puzzles_${userId}`, puzzles); },
  completePuzzle(userId, puzzleId) {
    const puzzles = this.getPuzzleProgress(userId);
    puzzles[puzzleId] = { completed: true, date: new Date().toISOString() };
    this.setPuzzleProgress(userId, puzzles);
  },
};

export function createDefaultProgress() {
  return {
    completedModules: [],
    completedTopics: [],
    moduleScores: {},
    topicScores: {},
    streak: 0,
    lastActive: null,
    totalTime: 0,
    questionsAnswered: 0,
    questionsCorrect: 0,
    circuitsChallengesCompleted: 0,
    codeChallengesCompleted: 0,
    testHistory: [],
    currentModule: null,
    currentTopic: null,
  };
}

export function createDefaultSkills() {
  return {
    mathematics: 0, qubits: 0, gates: 0, circuits: 0,
    qiskit: 0, algorithms: 0, qml: 0, noise: 0,
    errorCorrection: 0, hardware: 0, research: 0,
    cryptography: 0, optimization: 0, simulation: 0,
  };
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
