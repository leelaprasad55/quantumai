import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage.js';
import { useAuth } from './AuthContext.jsx';
import { updateSkillsFromScore } from '../utils/adaptive.js';
import { MODULES } from '../data/modules.js';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [skills, setSkills] = useState(null);

  useEffect(() => {
    if (user) {
      setProgress(storage.getProgress(user.id));
      setSkills(storage.getSkills(user.id));
    }
  }, [user]);

  const updateProgress = (updates) => {
    if (!user) return;
    const p = { ...progress, ...updates, lastActive: new Date().toISOString() };
    storage.setProgress(user.id, p);
    setProgress(p);
  };

  const updateSkills = (updates) => {
    if (!user) return;
    const s = { ...skills, ...updates };
    storage.setSkills(user.id, s);
    setSkills(s);
  };

  const completeTopic = (moduleId, topicId) => {
    if (!user) return;
    const p = { ...progress };
    if (!p.completedTopics.includes(topicId)) {
      p.completedTopics.push(topicId);
    }
    p.lastActive = new Date().toISOString();
    storage.setProgress(user.id, p);
    storage.logActivity(user.id);
    setProgress(p);
  };

  const completeModule = (moduleId, score) => {
    if (!user) return;
    const p = { ...progress };
    if (!p.completedModules.includes(moduleId)) {
      p.completedModules.push(moduleId);
    }
    p.moduleScores[moduleId] = score;
    p.lastActive = new Date().toISOString();
    storage.setProgress(user.id, p);
    storage.logActivity(user.id);
    setProgress(p);
  };

  const recordTestScore = (moduleId, score, details) => {
    if (!user) return;
    const p = { ...progress };
    p.testHistory.push({ moduleId, score, details, date: new Date().toISOString() });
    p.moduleScores[moduleId] = Math.max(p.moduleScores[moduleId] || 0, score);
    storage.setProgress(user.id, p);
    setProgress(p);
  };

  // Real-time skill update from exercise completion
  const updateSkillFromExercise = (skillNames, score) => {
    if (!user || !skills) return;
    const updated = updateSkillsFromScore(skills, skillNames, score);
    storage.setSkills(user.id, updated);
    storage.logActivity(user.id);
    setSkills(updated);
    return updated;
  };

  // Track gate usage for analytics
  const trackGateUsage = (gateName) => {
    if (!user) return;
    storage.trackGateUsage(user.id, gateName);
  };

  // Complete a circuit puzzle
  const completePuzzle = (puzzleId, relatedSkills) => {
    if (!user) return;
    storage.completePuzzle(user.id, puzzleId);
    const p = { ...progress };
    p.circuitsChallengesCompleted = (p.circuitsChallengesCompleted || 0) + 1;
    p.lastActive = new Date().toISOString();
    storage.setProgress(user.id, p);
    storage.logActivity(user.id);
    setProgress(p);
    // Update related skills
    if (relatedSkills && relatedSkills.length > 0) {
      updateSkillFromExercise(relatedSkills, 85);
    }
  };

  const getOverallKnowledge = () => {
    if (!skills) return 0;
    const vals = Object.values(skills);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (
    <ProgressContext.Provider value={{
      progress, skills, updateProgress, updateSkills,
      completeTopic, completeModule, recordTestScore, getOverallKnowledge,
      updateSkillFromExercise, trackGateUsage, completePuzzle,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
