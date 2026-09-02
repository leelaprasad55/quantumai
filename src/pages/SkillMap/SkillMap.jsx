import { useMemo, useRef, useEffect } from 'react';
import { useProgress } from '../../context/ProgressContext.jsx';
import { SKILL_LABELS } from '../../data/modules.js';
import AITutor from '../../components/ai/AITutor.jsx';

// Radar chart drawn with Canvas 2D
function RadarChart({ skills, size = 300 }) {
  const canvasRef = useRef(null);
  const entries = Object.entries(skills || {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || entries.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const R = size * 0.36;
    const n = entries.length;
    const angleStep = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);

    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * R;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Axis lines
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const val = entries[i][1] / 100;
      const x = cx + Math.cos(angle) * R * val;
      const y = cy + Math.sin(angle) * R * val;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const val = entries[i][1] / 100;
      const x = cx + Math.cos(angle) * R * val;
      const y = cy + Math.sin(angle) * R * val;
      ctx.beginPath();
      ctx.fillStyle = '#2563eb';
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Labels
    ctx.fillStyle = '#334155';
    ctx.font = `500 ${Math.max(9, size * 0.032)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelR = R + 22;
      const x = cx + Math.cos(angle) * labelR;
      const y = cy + Math.sin(angle) * labelR;
      const label = SKILL_LABELS[entries[i][0]] || entries[i][0];
      ctx.fillText(label.length > 12 ? label.slice(0, 10) + '…' : label, x, y);
    }
  }, [skills, size, entries]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

export default function SkillMap() {
  const { skills, getOverallKnowledge } = useProgress();
  const overall = getOverallKnowledge();

  const skillEntries = Object.entries(skills || {});
  const mastered = skillEntries.filter(([, v]) => v >= 70).length;
  const needsWork = skillEntries.filter(([, v]) => v < 40 && v > 0).length;

  // Animated update indicator
  const recentChange = useMemo(() => {
    // Check if any skill was recently updated (will be reactive via context)
    return skillEntries.some(([, v]) => v > 0);
  }, [skillEntries]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 Skill Map & Competency</h1>
        <p className="page-subtitle">Track your proficiency across all {skillEntries.length} core quantum computing domains — updates in real-time as you complete exercises</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{overall}%</div>
          <div className="stat-label">Overall Knowledge Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mastered} / {skillEntries.length}</div>
          <div className="stat-label">Mastered Domains (≥70%)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{needsWork}</div>
          <div className="stat-label">Focus Needed (&lt;40%)</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        {/* Radar Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🕸️ Skill Radar</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart skills={skills} size={320} />
          </div>
        </div>

        {/* Quick summary */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📈 Skill Summary</h3>
          {skillEntries.sort((a, b) => b[1] - a[1]).map(([skill, value]) => {
            const label = SKILL_LABELS[skill] || skill;
            const level = value >= 80 ? 'Master' : value >= 60 ? 'Proficient' : value >= 30 ? 'Developing' : 'Novice';
            return (
              <div key={skill} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ color: value >= 70 ? 'var(--success)' : value < 40 ? 'var(--warning)' : 'var(--accent)', fontWeight: 600 }}>
                    {value}% · {level}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div className={`progress-fill ${value >= 70 ? 'success' : ''}`} style={{ width: `${value}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 20 }}>🧠 Skill Proficiency Breakdown</h3>
        <div className="grid grid-2" style={{ gap: 24 }}>
          {skillEntries.map(([skill, value]) => {
            const label = SKILL_LABELS[skill] || skill;
            const level = value >= 80 ? 'Master' : value >= 60 ? 'Proficient' : value >= 30 ? 'Developing' : 'Novice';
            const colorClass = value >= 70 ? 'success' : value < 40 ? 'warning' : '';
            return (
              <div key={skill} className="card" style={{ background: 'var(--bg-glass)', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</span>
                  <span className={`tag ${value >= 70 ? 'tag-success' : value < 40 ? 'tag-warning' : 'tag-accent'}`}>{level}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Score</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${colorClass}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AITutor />
    </div>
  );
}
