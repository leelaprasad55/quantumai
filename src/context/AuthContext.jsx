import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { storage, createDefaultProgress, createDefaultSkills } from '../utils/storage.js';

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
      .single();

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
  const ensureLocalDefaults = (userId) => {
    if (!storage.getProgress(userId)?.completedModules) {
      storage.setProgress(userId, createDefaultProgress());
    }
    const skills = storage.getSkills(userId);
    if (!skills || (skills.mathematics === undefined)) {
      storage.setSkills(userId, createDefaultSkills());
    }
  };

  // Initialize: check existing session + listen for auth changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const fullUser = await fetchProfile(session.user);
          setUser(fullUser);
          ensureLocalDefaults(fullUser.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        const fullUser = await fetchProfile(session.user);
        if (mounted) {
          setUser(fullUser);
          setLoading(false);
          ensureLocalDefaults(fullUser.id);
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
      ensureLocalDefaults(fullUser.id);
      return { success: true, user: fullUser, isNewUser: true };
    }

    return { success: true, message: 'Check your email to confirm your account.' };
  };

  // Email + Password Sign In
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    const fullUser = await fetchProfile(data.user);
    setUser(fullUser);
    ensureLocalDefaults(fullUser.id);

    return { success: true, user: fullUser };
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
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
    await supabase.auth.signOut();
    storage.remove('currentUser');
    setUser(null);
  };

  // Update user profile safely via RPC functions
  const updateUser = async (updates) => {
    if (!user) return;

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
