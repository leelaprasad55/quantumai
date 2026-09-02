import { useProgress } from '../../context/ProgressContext.jsx';
import { ACHIEVEMENTS } from '../../data/modules.js';
import AITutor from '../../components/ai/AITutor.jsx';

export default function Achievements() {
  const { progress } = useProgress();

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">🏆 Achievements & Badges</h1>
        <p className="page-subtitle">Unlock badges as you complete tests, modules, and experiments</p>
      </div>

      <div className="grid grid-3">
        {ACHIEVEMENTS.map(a => {
          const unlocked = progress ? a.condition(progress) : false;
          return (
            <div key={a.id} className={`achievement-badge ${unlocked ? 'unlocked' : 'locked'}`} style={{ padding: 24, textAlign: 'center' }}>
              <div className="achievement-icon" style={{ fontSize: '3rem', marginBottom: 12 }}>{a.icon}</div>
              <div className="achievement-name" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{a.name}</div>
              <div className="achievement-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.desc}</div>
              <div style={{ marginTop: 12 }}>
                <span className={`tag ${unlocked ? 'tag-success' : 'tag-info'}`}>
                  {unlocked ? '✓ Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <AITutor />
    </div>
  );
}
