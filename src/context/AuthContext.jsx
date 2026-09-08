import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { storage, createDefaultProgress, createDefaultSkills } from '../utils/storage.js';

const LOCAL_USERS_KEY = 'ql_local_users';
const LOCAL_SESSION_KEY = 'ql_local_current_user';

export const normalizeLocalUser = (record = {}) => ({
  id: record.id || `local-${Date.now()}`,
  email: record.email || '',
  name: record.name || record.full_name || record.email?.split('@')[0] || 'User',
  avatar_url: record.avatar_url || null,
  role: record.role || 'student',
  total_xp: Number(record.total_xp || 0),
  current_streak: Number(record.current_streak || 0),
  isAdmin: record.role === 'admin',
  knowledgeTestDone: Boolean(record.knowledge_test_done || record.knowledgeTestDone || false),
  knowledgeScore: Number(record.knowledge_score || record.knowledgeScore || 0),
  education: record.education || null,
  goal: record.goal || null,
  createdAt: record.created_at || record.createdAt || new Date().toISOString(),
});

const readLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const saveLocalSession = (userRecord) => {
  if (!userRecord) {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    return;
  }
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userRecord));
};

const getStoredLocalUser = () => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const localAuth = {
  getUserSession() {
    return getStoredLocalUser();
  },
  register({ name, email, password, education, goal }) {
    const users = readLocalUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return { error: 'Name, email, and password are required.' };
    }

    if (users.some(user => (user.email || '').trim().toLowerCase() === normalizedEmail)) {
      return { error: 'An account with this email already exists.' };
    }

    const userRecord = {
      id: `local-${Date.now()}`,
      email: normalizedEmail,
      password,
      name,
      full_name: name,
      role: 'student',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      education,
      goal,
      total_xp: 0,
      current_streak: 0,
      knowledge_test_done: false,
      knowledge_score: 0,
      created_at: new Date().toISOString(),
    };

    users.push(userRecord);
    writeLocalUsers(users);
    saveLocalSession(userRecord);

    return { success: true, user: normalizeLocalUser(userRecord) };
  },
  login(email, password) {
    const users = readLocalUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const match = users.find(user => (user.email || '').trim().toLowerCase() === normalizedEmail && String(user.password) === String(password));

    if (!match) {
      return { error: 'Invalid email or password.' };
    }

    saveLocalSession(match);
    return { success: true, user: normalizeLocalUser(match) };
  },
  logout() {
    saveLocalSession(null);
    return { success: true };
  },
  updateUser(currentUser, updates) {
    const users = readLocalUsers();
    const matchIndex = users.findIndex(user => user.id === currentUser.id);

    if (matchIndex === -1) {
      return currentUser;
    }

    const updatedRecord = {
      ...users[matchIndex],
      full_name: updates.name ?? users[matchIndex].full_name ?? currentUser.name,
      name: updates.name ?? users[matchIndex].name ?? currentUser.name,
      avatar_url: updates.avatar_url ?? users[matchIndex].avatar_url ?? currentUser.avatar_url,
      knowledge_test_done: updates.knowledgeTestDone ?? users[matchIndex].knowledge_test_done ?? currentUser.knowledgeTestDone,
      knowledge_score: updates.knowledgeScore ?? users[matchIndex].knowledge_score ?? currentUser.knowledgeScore,
      total_xp: users[matchIndex].total_xp ?? 0,
      current_streak: users[matchIndex].current_streak ?? 0,
      education: users[matchIndex].education,
      goal: users[matchIndex].goal,
    };

    users[matchIndex] = updatedRecord;
    writeLocalUsers(users);
    saveLocalSession(updatedRecord);

    return normalizeLocalUser(updatedRecord);
  },
};

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's profile from Supabase 'profiles' table
  const fetchProfile = async (authUser) => {
    if (!authUser) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    return {
      id: authUser.id,
      email: authUser.email,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
      role: profile?.role || 'student',
      total_xp: profile?.total_xp || 0,
      current_streak: profile?.current_streak || 0,
      isAdmin: profile?.role === 'admin',
      knowledgeTestDone: profile?.knowledge_test_done || false,
      knowledgeScore: profile?.knowledge_score || 0,
      education: authUser.user_metadata?.education || null,
      goal: authUser.user_metadata?.goal || null,
      createdAt: profile?.created_at || authUser.created_at,
    };
  };

  // Ensure initial defaults exist in database
  const ensureLocalDefaults = async (userId) => {
    const progress = await storage.getProgress(userId);
    if (!progress?.completedModules) {
      await storage.setProgress(userId, createDefaultProgress());
    }
    const skills = await storage.getSkills(userId);
    if (!skills || (skills.mathematics === undefined)) {
      await storage.setSkills(userId, createDefaultSkills());
    }
  };

  // Initialize: check existing session + listen for auth changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!supabase) {
        const localUser = getStoredLocalUser();
        if (mounted) {
          setUser(localUser ? normalizeLocalUser(localUser) : null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const fullUser = await fetchProfile(session.user);
          setUser(fullUser);
          await ensureLocalDefaults(fullUser.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        const fullUser = await fetchProfile(session.user);
        if (mounted) {
          setUser(fullUser);
          setLoading(false);
          await ensureLocalDefaults(fullUser.id);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Email + Password Sign Up
  const register = async ({ name, email, password, education, goal }) => {
    if (!supabase) {
      const result = localAuth.register({ name, email, password, education, goal });
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user, isNewUser: true };
      }
      return result;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          education,
          goal,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        },
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      await new Promise(r => setTimeout(r, 600));
      const fullUser = await fetchProfile(data.user);
      setUser(fullUser);
      await ensureLocalDefaults(fullUser.id);
      return { success: true, user: fullUser, isNewUser: true };
    }

    return { success: true, message: 'Check your email to confirm your account.' };
  };

  // Email + Password Sign In
  const login = async (email, password) => {
    if (!supabase) {
      const result = localAuth.login(email, password);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return result;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    const fullUser = await fetchProfile(data.user);
    setUser(fullUser);
    await ensureLocalDefaults(fullUser.id);

    return { success: true, user: fullUser };
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google sign-in.' };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) return { error: error.message };
    return { success: true, data };
  };

  // Sign Out
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localAuth.logout();
    }
    storage.remove('currentUser');
    setUser(null);
  };

  // Update user profile safely via RPC functions
  const updateUser = async (updates) => {
    if (!user) return;

    if (!supabase) {
      const updated = localAuth.updateUser(user, updates);
      setUser(updated);
      return;
    }

    try {
      if (updates.name !== undefined || updates.avatar_url !== undefined) {
        const { error } = await supabase.rpc('update_my_profile', {
          p_full_name: updates.name || null,
          p_avatar_url: updates.avatar_url || null,
        });
        if (error) console.error('Failed to update profile:', error.message);
      }

      if (updates.knowledgeTestDone !== undefined || updates.knowledgeScore !== undefined) {
        const score = updates.knowledgeScore !== undefined ? updates.knowledgeScore : (user.knowledgeScore || 0);
        const { error } = await supabase.rpc('complete_knowledge_test', {
          p_score: score,
        });
        if (error) console.error('Failed to update knowledge test status:', error.message);
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }

    const updated = { ...user, ...updates };
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) return { user: null, loading: true, register: async () => ({}), login: async () => ({}), logout: async () => { }, updateUser: async () => { }, signInWithGoogle: async () => ({}) };
  return ctx;
};
