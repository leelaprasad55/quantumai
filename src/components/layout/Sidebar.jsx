import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/roadmap', icon: '🗺️', label: 'My Roadmap' },
  { to: '/modules', icon: '📚', label: 'Modules' },
  { to: '/circuit', icon: '⚡', label: 'Circuit Builder' },
  { to: '/race', icon: '⚔', label: 'Quantum Race' },
  { to: '/lab', icon: '🔬', label: 'Quantum Lab' },
  { to: '/skillmap', icon: '📊', label: 'Skill Map' },
  { to: '/achievements', icon: '🏆', label: 'Achievements' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { getOverallKnowledge } = useProgress();
  const navigate = useNavigate();
  const knowledge = getOverallKnowledge();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">⚛ QuantumLearn</div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        {user?.isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="icon">⚙️</span><span>Admin</span>
          </NavLink>
        )}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Knowledge Score</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
          {knowledge}%
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${knowledge}%` }} /></div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
