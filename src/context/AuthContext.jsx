import { createContext, useContext, useState, useEffect } from 'react';
import { storage, generateId, createDefaultProgress, createDefaultSkills } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed default admin if not present
    const users = storage.get('users') || [];
    if (!users.find(u => u.email === 'admin@quantumlearn.ai')) {
      const admin = { id: 'admin', name: 'Admin', email: 'admin@quantumlearn.ai', password: 'admin123', education: 'Graduate', goal: 'Prepare for research', isAdmin: true, knowledgeTestDone: true, knowledgeScore: 100, createdAt: new Date().toISOString() };
      users.push(admin);
      storage.set('users', users);
      if (!storage.getProgress('admin').completedModules) storage.setProgress('admin', createDefaultProgress());
      if (!storage.getSkills('admin').mathematics) storage.setSkills('admin', { ...createDefaultSkills(), mathematics: 80, qubits: 90, gates: 85, circuits: 80, qiskit: 75, algorithms: 70, qml: 65, noise: 60, errorCorrection: 55, hardware: 50, research: 80, cryptography: 55, optimization: 60, simulation: 55 });
    }
    const saved = storage.getUser();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const register = (data) => {
    const users = storage.get('users') || [];
    if (users.find(u => u.email === data.email)) {
      return { error: 'Email already registered' };
    }
    const newUser = {
      id: generateId(),
      name: data.name,
      email: data.email,
      password: data.password,
      education: data.education,
      goal: data.goal,
      createdAt: new Date().toISOString(),
      knowledgeTestDone: false,
      knowledgeScore: 0,
      isAdmin: data.email === 'admin@quantumlearn.ai',
    };
    users.push(newUser);
    storage.set('users', users);
    storage.setUser(newUser);
    storage.setProgress(newUser.id, createDefaultProgress());
    storage.setSkills(newUser.id, createDefaultSkills());
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const login = (email, password) => {
    const users = storage.get('users') || [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { error: 'Invalid email or password' };
    storage.setUser(found);
    setUser(found);
    return { success: true, user: found };
  };

  const logout = () => {
    storage.remove('currentUser');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    const users = storage.get('users') || [];
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = updated;
    storage.set('users', users);
    storage.setUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
