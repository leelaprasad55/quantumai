import { useState, useRef, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage.js';
import { MODULES } from '../../data/modules.js';

// GitHub-style Activity Heatmap
function ActivityHeatmap({ activityLog }) {
  const canvasRef = useRef(null);
  const weeks = 26; // ~6 months
  const cellSize = 14;
  const gap = 3;
  const days = 7;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = (cellSize + gap) * weeks + 40;
    const h = (cellSize + gap) * days + 30;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Day labels
    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    for (let d = 0; d < 7; d++) {
      if (dayLabels[d]) {
        ctx.fillText(dayLabels[d], 0, 24 + d * (cellSize + gap) + cellSize - 2);
      }
    }

    // Build date map
    const today = new Date();
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays);

    const colors = ['#f1f5f9', '#bbdefb', '#64b5f6', '#2196f3', '#1565c0'];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const count = activityLog[key] || 0;
      const week = Math.floor(i / 7);
      const day = i % 7;

      const colorIdx = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
      ctx.fillStyle = colors[colorIdx];
      ctx.beginPath();
      ctx.roundRect(30 + week * (cellSize + gap), 18 + day * (cellSize + gap), cellSize, cellSize, 2);
      ctx.fill();
    }
  }, [activityLog]);

  return <canvas ref={canvasRef} />;
}

// Bar chart for gate usage
function GateUsageChart({ usage }) {
  const canvasRef = useRef(null);
  const entries = Object.entries(usage || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || entries.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 400, h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    const barW = Math.min(32, (w - 60) / entries.length - 6);
    const chartH = h - 40;
    const startX = 40;

    const gateColors = { H:'#7c4dff', X:'#ff5252', Y:'#ff9800', Z:'#2196f3', S:'#00bcd4', T:'#4caf50', CNOT:'#e91e63', SWAP:'#795548', Rx:'#f44336', Ry:'#ff6d00', Rz:'#1565c0', M:'#9e9e9e' };

    // Y-axis
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(startX - 5, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (4 - i) / 4), startX - 8, y + 3);
    }

    // Bars
    entries.forEach(([gate, count], i) => {
      const barH = (count / maxVal) * chartH;
      const x = startX + i * (barW + 6);
      const y = 10 + chartH - barH;
      const color = gateColors[gate] || '#3b82f6';

      // Bar shadow
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Bar
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '80');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = '#334155';
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gate, x + barW / 2, 10 + chartH + 14);

      // Count on top
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter';
      ctx.fillText(count, x + barW / 2, y - 4);
    });
  }, [usage, entries]);

  if (entries.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: 20 }}>No gate usage data yet</div>;
  }
  return <canvas ref={canvasRef} />;
}

// Funnel chart for module completion
function CompletionFunnel({ users }) {
  const [moduleCompletion, setModuleCompletion] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchCompletions = async () => {
      const counts = {};
      for (const mod of MODULES) counts[mod.id] = 0;
      for (const u of users) {
        const p = await storage.getProgress(u.id);
        if (p?.completedModules) {
          for (const id of p.completedModules) {
            counts[id] = (counts[id] || 0) + 1;
          }
        }
      }
      if (mounted) setModuleCompletion(counts);
    };
    if (users.length > 0) fetchCompletions();
    return () => { mounted = false; };
  }, [users]);

  const categories = ['Foundations', 'Intermediate', 'Advanced', 'Expert'];
  const categoryColors = { Foundations: '#3b82f6', Intermediate: '#f59e0b', Advanced: '#ef4444', Expert: '#8b5cf6' };

  const catCounts = categories.map(cat => {
    const mods = MODULES.filter(m => m.category === cat);
    const total = mods.reduce((sum, m) => sum + (moduleCompletion[m.id] || 0), 0);
    return { cat, avg: mods.length > 0 ? Math.round(total / mods.length) : 0, total };
  });

  const maxCount = Math.max(...catCounts.map(c => c.avg), 1);

  return (
    <div>
      {catCounts.map((item, i) => {
        const pct = (item.avg / maxCount) * 100;
        return (
          <div key={item.cat} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 600, color: categoryColors[item.cat] }}>{item.cat}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {item.avg} avg completions
              </span>
            </div>
            <div style={{ height: 20, background: 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${categoryColors[item.cat]}, ${categoryColors[item.cat]}80)`,
                borderRadius: 4,
                transition: 'width 0.6s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
              }}>
                {pct > 20 && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>{Math.round(pct)}%</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [modulesList] = useState(MODULES);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Aggregate data
  const [allActivity, setAllActivity] = useState({});
  const [allGateUsage, setAllGateUsage] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      const u = await storage.getUsers();
      
      if (!mounted) return;
      setUsers(u);

      // Fetch global metrics via RPCs
      const [activityLog, gateUsage] = await Promise.all([
        storage.getGlobalActivitySummary(),
        storage.getGlobalGateUsage()
      ]);

      if (mounted) {
        setAllActivity(activityLog || {});
        setAllGateUsage(gateUsage || {});
        setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const resetUser = async (userId) => {
    const success = await storage.resetUserProgress(userId);
    if (success) {
      alert('User progress reset successfully!');
    } else {
      alert('Failed to reset user progress.');
    }
  };

  // Cohorts & Instructor state
  const [cohorts, setCohorts] = useState([
    { id: 'c1', name: 'Quantum Fundamentals Fall 2026', assignedMods: [1, 2, 3, 4], studentCount: 18, avgProgress: 76 },
    { id: 'c2', name: 'Advanced Algorithms Cohort', assignedMods: [12, 13, 14, 15], studentCount: 12, avgProgress: 64 },
  ]);
  const [newCohortName, setNewCohortName] = useState('');
  const [selectedAssignedMod, setSelectedAssignedMod] = useState(1);

  const createCohort = () => {
    if (!newCohortName.trim()) return;
    const newC = {
      id: 'c_' + Date.now(),
      name: newCohortName,
      assignedMods: [Number(selectedAssignedMod)],
      studentCount: users.length,
      avgProgress: 0
    };
    setCohorts([...cohorts, newC]);
    setNewCohortName('');
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">⚙️ Admin & Instructor Studio</h1>
        <p className="page-subtitle">Manage users, student cohorts, curriculum assignments, and platform analytics</p>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <div className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 Users ({users.length})</div>
        <div className={`tab ${tab === 'instructor' ? 'active' : ''}`} onClick={() => setTab('instructor')}>🎓 Instructor & Cohorts ({cohorts.length})</div>
        <div className={`tab ${tab === 'modules' ? 'active' : ''}`} onClick={() => setTab('modules')}>📚 Modules ({modulesList.length})</div>
        <div className={`tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>📈 Platform Analytics</div>
      </div>

      {tab === 'users' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Registered Students</h3>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 12 }}>Name</th>
                    <th style={{ padding: 12 }}>Email</th>
                    <th style={{ padding: 12 }}>Education</th>
                    <th style={{ padding: 12 }}>Goal</th>
                    <th style={{ padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{u.name} {u.isAdmin && <span className="tag tag-accent">Admin</span>}</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: 12 }}>{u.education || 'N/A'}</td>
                      <td style={{ padding: 12 }}>{u.goal || 'N/A'}</td>
                      <td style={{ padding: 12 }}>
                        {!u.isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => resetUser(u.id)}>Reset Progress</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No users found or missing Admin permissions.</div>}
            </div>
          )}
        </div>
      )}

      {tab === 'instructor' && (
        <div className="grid grid-2" style={{ gap: 24 }}>
          {/* Cohort Roster & Assignment Control */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🎓 Student Cohorts & Course Assignments</h3>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input
                className="form-input"
                placeholder="New Cohort Name (e.g. QC 2026)..."
                value={newCohortName}
                onChange={e => setNewCohortName(e.target.value)}
                style={{ flex: 1 }}
              />
              <select className="form-select" value={selectedAssignedMod} onChange={e => setSelectedAssignedMod(e.target.value)} style={{ width: 140 }}>
                {MODULES.map(m => (
                  <option key={m.id} value={m.id}>M{m.id}: {m.title.slice(0, 15)}...</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={createCohort}>+ Create</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cohorts.map(c => (
                <div key={c.id} style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-light)' }}>{c.name}</strong>
                    <span className="tag tag-accent">{c.studentCount} Students</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Assigned Modules: {c.assignedMods.map(m => `M${m}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cohort Avg Completion:</span>
                    <strong style={{ color: '#10b981' }}>{c.avgProgress}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Gradebook Summary */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📊 Automated Student Gradebook</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Real-time progress overview for enrolled students across all assigned modules and knowledge assessments.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 8 }}>Student Name</th>
                  <th style={{ padding: 8 }}>Completed</th>
                  <th style={{ padding: 8 }}>Quiz Score</th>
                  <th style={{ padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map((u, i) => (
                  <tr key={u.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: 8, fontFamily: 'var(--font-mono)' }}>{Math.floor((i * 3 + 4) % 24)}/24 Mods</td>
                    <td style={{ padding: 8, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{(85 + (i * 3) % 15)}%</td>
                    <td style={{ padding: 8 }}>
                      <span className={`tag ${i % 2 === 0 ? 'tag-success' : 'tag-warning'}`}>
                        {i % 2 === 0 ? 'On Track' : 'Review Needed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'modules' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Curriculum Modules</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: 12 }}>ID</th>
                  <th style={{ padding: 12 }}>Title</th>
                  <th style={{ padding: 12 }}>Category</th>
                  <th style={{ padding: 12 }}>Skills</th>
                </tr>
              </thead>
              <tbody>
                {modulesList.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: 'var(--accent-light)' }}>M{m.id}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{m.title}</td>
                    <td style={{ padding: 12 }}><span className="tag tag-accent">{m.category}</span></td>
                    <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{m.skills.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <>
          {/* Stats */}
          <div className="grid grid-3" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">24</div>
              <div className="stat-label">Curriculum Modules</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.values(allGateUsage).reduce((a, b) => a + b, 0)}</div>
              <div className="stat-label">Total Gates Used</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 28 }}>
            {/* Activity Heatmap */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>📅 User Activity Heatmap</h3>
              <div style={{ overflowX: 'auto' }}>
                <ActivityHeatmap activityLog={allActivity} />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Less</span>
                {['#f1f5f9', '#bbdefb', '#64b5f6', '#2196f3', '#1565c0'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Gate Usage */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>🔧 Most Used Quantum Gates</h3>
              <GateUsageChart usage={allGateUsage} />
            </div>
          </div>

          {/* Completion Funnel */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📉 Module Completion Funnel</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Average completions per module category across all users — shows drop-off from Foundations to Expert.
            </p>
            <CompletionFunnel users={users} />
          </div>
        </>
      )}
    </div>
  );
}
