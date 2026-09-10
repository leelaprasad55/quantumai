import { supabase } from '../lib/supabaseClient.js';

const getUserLocalStorageKey = (baseKey, userId) => userId ? `${baseKey}_${userId}` : `${baseKey}_guest`;

const readUserLocalStorage = (baseKey, userId) => {
  try {
    return JSON.parse(localStorage.getItem(getUserLocalStorageKey(baseKey, userId)) || '[]');
  } catch {
    return [];
  }
};

const writeUserLocalStorage = (baseKey, userId, value) => {
  localStorage.setItem(getUserLocalStorageKey(baseKey, userId), JSON.stringify(value));
};

export const storage = {
  // ----------------------------------------------------
  // PROGRESS & SKILLS
  // ----------------------------------------------------
  async getProgress(userId) {
    if (!userId) return createDefaultProgress();
    if (!supabase) return createDefaultProgress();
    
    // Fetch progress
    const { data: progData, error: progErr } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    // Fetch module progress
    const { data: modsData } = await supabase
      .from('module_progress')
      .select('module_id, score')
      .eq('user_id', userId);
      
    // Fetch topic progress
    const { data: topicsData } = await supabase
      .from('topic_progress')
      .select('topic_id, score')
      .eq('user_id', userId);

    // Fetch test attempts
    const { data: testsData } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId);

    if (progErr && progErr.code !== 'PGRST116') {
      console.error('Error fetching progress:', progErr);
    }

    const defaultProg = createDefaultProgress();
    const moduleScores = {};
    const completedModules = [];
    if (modsData) {
      modsData.forEach(m => {
        moduleScores[m.module_id] = m.score;
        completedModules.push(m.module_id);
      });
    }

    const topicScores = {};
    const completedTopics = [];
    if (topicsData) {
      topicsData.forEach(t => {
        topicScores[t.topic_id] = t.score;
        completedTopics.push(t.topic_id);
      });
    }
    
    const testHistory = testsData ? testsData.map(t => ({
      moduleId: t.module_id,
      score: t.score,
      details: t.details,
      date: t.created_at
    })) : [];

    return {
      ...defaultProg,
      ...(progData ? {
        lastActive: progData.last_active,
        totalTime: progData.total_time,
        questionsAnswered: progData.questions_answered,
        questionsCorrect: progData.questions_correct,
        circuitsChallengesCompleted: progData.circuits_challenges_completed,
        codeChallengesCompleted: progData.code_challenges_completed,
        currentModule: progData.current_module,
        currentTopic: progData.current_topic,
        labExperiments: progData.lab_experiments
      } : {}),
      moduleScores,
      completedModules,
      topicScores,
      completedTopics,
      testHistory
    };
  },

  async setProgress(userId, progress) {
    if (!userId || !supabase) return;
    
    // Update main progress table
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        last_active: progress.lastActive || new Date().toISOString(),
        total_time: progress.totalTime || 0,
        questions_answered: progress.questionsAnswered || 0,
        questions_correct: progress.questionsCorrect || 0,
        circuits_challenges_completed: progress.circuitsChallengesCompleted || 0,
        code_challenges_completed: progress.codeChallengesCompleted || 0,
        current_module: progress.currentModule,
        current_topic: progress.currentTopic,
        lab_experiments: progress.labExperiments || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (error) console.error('Error saving progress:', error);
  },

  async getSkills(userId) {
    if (!userId || !supabase) return createDefaultSkills();
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching skills:', error);
    }
    
    if (!data) return createDefaultSkills();
    
    const { user_id, updated_at, ...skills } = data;
    return { ...createDefaultSkills(), ...skills };
  },

  async setSkills(userId, skills) {
    if (!userId || !supabase) return;
    
    const dbSkills = {
      user_id: userId,
      mathematics: skills.mathematics || 0,
      qubits: skills.qubits || 0,
      gates: skills.gates || 0,
      circuits: skills.circuits || 0,
      qiskit: skills.qiskit || 0,
      algorithms: skills.algorithms || 0,
      qml: skills.qml || 0,
      noise: skills.noise || 0,
      error_correction: skills.errorCorrection || 0,
      hardware: skills.hardware || 0,
      research: skills.research || 0,
      cryptography: skills.cryptography || 0,
      optimization: skills.optimization || 0,
      simulation: skills.simulation || 0,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('user_skills')
      .upsert(dbSkills, { onConflict: 'user_id' });
      
    if (error) console.error('Error saving skills:', error);
  },

  // ----------------------------------------------------
  // COMPLETION RECORDS
  // ----------------------------------------------------
  async completeTopic(userId, topicId, score = 0) {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('topic_progress')
      .upsert({ user_id: userId, topic_id: topicId, score }, { onConflict: 'user_id, topic_id' });
    if (error) console.error('Error completing topic:', error);
  },

  async completeModule(userId, moduleId, score = 0) {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('module_progress')
      .upsert({ user_id: userId, module_id: moduleId, score }, { onConflict: 'user_id, module_id' });
    if (error) console.error('Error completing module:', error);
  },

  async recordTestScore(userId, moduleId, score, details) {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('test_attempts')
      .insert({ user_id: userId, module_id: moduleId, score, details });
    if (error) console.error('Error recording test score:', error);
  },

  // ----------------------------------------------------
  // CIRCUITS & LAB
  // ----------------------------------------------------
  async getSavedCircuits(userId) {
    let supabaseCircuits = [];
    if (userId && supabase) {
      const { data, error } = await supabase
        .from('saved_circuits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        supabaseCircuits = data.map(c => ({ id: c.id, name: c.name, nQubits: c.num_qubits, ops: c.operations, date: c.created_at }));
      }
    }

    const localCircuits = readUserLocalStorage('saved_circuits', userId);

    const map = new Map();
    [...supabaseCircuits, ...localCircuits].forEach(c => {
      if (c && c.name && !map.has(c.name)) {
        map.set(c.name, c);
      }
    });
    return Array.from(map.values());
  },

  async insertCircuit(userId, name, nQubits, ops) {
    if (!userId && !supabase) return null;

    const item = {
      id: generateId(),
      name,
      nQubits,
      num_qubits: nQubits,
      ops,
      operations: ops,
      created_at: new Date().toISOString(),
      date: new Date().toISOString()
    };

    if (userId && supabase) {
      const { error } = await supabase
        .from('saved_circuits')
        .insert({ user_id: userId, name, num_qubits: nQubits, operations: ops });
      if (error) console.warn('Supabase circuit save warning (falling back to localStorage):', error.message);
    }

    try {
      const existing = readUserLocalStorage('saved_circuits', userId);
      const updated = [item, ...existing.filter(c => c.name !== name)];
      writeUserLocalStorage('saved_circuits', userId, updated);
    } catch (e) { console.error('LocalStorage error saving circuit:', e); }

    return item;
  },

  async getLabExperiments(userId) {
    let supabaseExps = [];
    if (userId && supabase) {
      const { data, error } = await supabase
        .from('lab_experiments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        supabaseExps = data.map(l => ({
          id: l.id,
          name: l.name,
          preset: l.preset_name,
          shots: l.num_shots,
          noiseModel: l.noise_model,
          fidelity: Number(l.fidelity),
          results: l.results,
          date: l.created_at
        }));
      }
    }

    const localExps = readUserLocalStorage('lab_experiments', userId);

    const map = new Map();
    [...supabaseExps, ...localExps].forEach(e => {
      if (e && e.name && !map.has(e.name)) {
        map.set(e.name, e);
      }
    });
    return Array.from(map.values());
  },

  async insertLabExperiment(userId, exp) {
    if (!userId && !supabase) return null;

    const item = {
      id: generateId(),
      name: exp.name,
      preset: exp.preset,
      shots: exp.shots,
      noiseModel: exp.noiseModel,
      fidelity: exp.fidelity,
      results: exp.results,
      date: new Date().toISOString()
    };

    if (userId && supabase) {
      const { error } = await supabase
        .from('lab_experiments')
        .insert({
          user_id: userId,
          name: exp.name,
          preset_name: exp.preset,
          num_shots: exp.shots,
          noise_model: exp.noiseModel,
          fidelity: Math.min(1, Math.max(0, Number(exp.fidelity || 0) / 100)),
          results: exp.results
        });
      if (error) console.warn('Supabase lab save warning (falling back to localStorage):', error.message);
    }

    try {
      const existing = readUserLocalStorage('lab_experiments', userId);
      const updated = [item, ...existing.filter(e => e.name !== exp.name)];
      writeUserLocalStorage('lab_experiments', userId, updated);
    } catch (e) { console.error('LocalStorage error saving lab exp:', e); }

    return item;
  },

  async incrementLabExperiments(userId) {
    if (!userId || !supabase) return;
    const { data } = await supabase
      .from('user_progress')
      .select('lab_experiments')
      .eq('user_id', userId)
      .maybeSingle();
    const current = Number(data?.lab_experiments || 0);
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lab_experiments: current + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    if (error) console.error('Error updating lab experiment count:', error);
  },
  
  async deleteLabExperiment(expId, userId) {
    if (expId && supabase) {
      let query = supabase.from('lab_experiments').delete().eq('id', expId);
      if (userId) query = query.eq('user_id', userId);
      await query;
    }
    try {
      const existing = readUserLocalStorage('lab_experiments', userId);
      const updated = existing.filter(e => e.id !== expId);
      writeUserLocalStorage('lab_experiments', userId, updated);
    } catch (e) { console.error('LocalStorage error deleting lab exp:', e); }
  },

  // ----------------------------------------------------
  // CHAT HISTORY
  // ----------------------------------------------------
  async getChatHistory(userId) {
    if (!userId || !supabase) return [];
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Error fetching chat:', error); return []; }
    return data.map(c => ({ role: c.role, text: c.message_text }));
  },

  async insertChatMessage(userId, role, text) {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('ai_chat_messages')
      .insert({ user_id: userId, role, message_text: text });
    if (error) console.error('Error saving chat:', error);
  },

  // ----------------------------------------------------
  // ANALYTICS & ADMIN
  // ----------------------------------------------------
  async getUsers() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_admin_users');
    if (error) {
      console.warn('Error fetching admin users list:', error.message);
      return [];
    }
    return data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatar_url,
      role: u.role,
      education: u.education,
      goal: u.goal,
      isAdmin: u.role === 'admin'
    }));
  },

  async resetUserProgress(userId) {
    if (!userId || !supabase) return false;
    const { data, error } = await supabase.rpc('reset_user_progress', { target_user_id: userId });
    if (error) {
      console.error('Error resetting user progress:', error.message);
      return false;
    }
    return data;
  },

  async getActivityLog(userId) {
    if (!userId || !supabase) return {};
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId);
    if (error) return {};
    const log = {};
    data.forEach(a => { log[a.activity_date] = a.interaction_count; });
    return log;
  },

  async getGlobalActivitySummary() {
    if (!supabase) return {};
    const { data, error } = await supabase.rpc('get_global_activity_summary');
    if (error) {
      console.error('Error fetching global activity summary:', error.message);
      return {};
    }
    const log = {};
    if (data) {
      data.forEach(a => { log[a.activity_date] = Number(a.total_interactions); });
    }
    return log;
  },

  async logActivity(userId) {
    if (!userId || !supabase) return;
    const { error } = await supabase.rpc('log_activity');
    if (error) {
      console.error('Error logging activity:', error.message);
    }
  },

  async getGateUsage(userId) {
    if (!userId || !supabase) return {};
    const { data, error } = await supabase
      .from('gate_usage')
      .select('*')
      .eq('user_id', userId);
    if (error) return {};
    const usage = {};
    data.forEach(g => { usage[g.gate_name] = g.usage_count; });
    return usage;
  },

  async getGlobalGateUsage() {
    if (!supabase) return {};
    const { data, error } = await supabase.rpc('get_global_gate_usage');
    if (error) {
      console.error('Error fetching global gate usage:', error.message);
      return {};
    }
    const usage = {};
    if (data) {
      data.forEach(g => { usage[g.gate_name] = Number(g.total_usage); });
    }
    return usage;
  },

  async trackGateUsage(userId, gateName) {
    if (!userId || !gateName || !supabase) return;
    const { error } = await supabase.rpc('increment_gate_usage', { p_gate_name: gateName });
    if (error) {
      console.error('Error tracking gate usage:', error.message);
    }
  },

  async completePuzzle(userId, puzzleId) {
    if (!userId || !supabase) return;
    await supabase
      .from('puzzle_progress')
      .upsert({ user_id: userId, puzzle_id: puzzleId, completed: true }, { onConflict: 'user_id, puzzle_id' });
  },

  // ----------------------------------------------------
  // AVATAR STORAGE
  // ----------------------------------------------------
  async uploadAvatar(userId, file) {
    if (!userId || !file || !supabase) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  remove(key) { localStorage.removeItem(key); }
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
    labExperiments: 0
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
