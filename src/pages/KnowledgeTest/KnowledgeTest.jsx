import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { KNOWLEDGE_TEST_QUESTIONS } from '../../data/questions.js';
import { SKILL_LABELS } from '../../data/modules.js';
import { computeKnowledgeFromTest } from '../../utils/adaptive.js';

export default function KnowledgeTest() {
  const [phase, setPhase] = useState('intro'); // intro|test|results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const { user, updateUser } = useAuth();
  const { updateSkills } = useProgress();
  const nav = useNavigate();

  const q = KNOWLEDGE_TEST_QUESTIONS[current];

  const choose = (idx) => { setSelected(idx); };

  const next = () => {
    const updated = { ...answers, [q.id]: selected };
    setAnswers(updated);
    setSelected(null);
    if (current + 1 >= KNOWLEDGE_TEST_QUESTIONS.length) {
      const r = computeKnowledgeFromTest(updated, KNOWLEDGE_TEST_QUESTIONS);
      setResult(r);
      updateSkills(r.skillScores);
      updateUser({ knowledgeTestDone: true, knowledgeScore: r.overall });
      setPhase('results');
    } else {
      setCurrent(c => c + 1);
    }
  };

  if (phase === 'intro') return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card fade-in" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🧠</div>
        <h1 style={{ marginBottom: 12 }}>Quantum Knowledge Assessment</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          We'll ask you <strong>33 questions</strong> across 8 topics to understand your current quantum knowledge level. This helps us create your <strong>personalized learning path</strong>.
        </p>
        <div className="grid grid-4" style={{ marginBottom: 24, gap: 8 }}>
          {['Mathematics', 'Qubits', 'Gates', 'Circuits', 'Qiskit', 'Algorithms', 'QML', 'Noise'].map(s => (
            <div key={s} className="tag tag-accent" style={{ justifyContent: 'center', padding: '8px 4px', fontSize: '0.7rem' }}>{s}</div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setPhase('test')}>Start Assessment →</button>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={async () => {
          await updateUser({ knowledgeTestDone: true, knowledgeScore: 0 });
          nav('/dashboard');
        }}>Skip (I'm a complete beginner)</button>
      </div>
    </div>
  );

  if (phase === 'test') return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 60 }}>
      <div className="auth-bg" />
      <div className="auth-card fade-in" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Question {current + 1} of {KNOWLEDGE_TEST_QUESTIONS.length}</span>
          <span className="tag tag-accent">{SKILL_LABELS[q.skill] || q.skill}</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 24 }}>
          <div className="progress-fill" style={{ width: `${((current) / KNOWLEDGE_TEST_QUESTIONS.length) * 100}%` }} />
        </div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 24, lineHeight: 1.5 }}>{q.q}</h2>
        <div>
          {q.options.map((opt, i) => (
            <div key={i} className={`quiz-option ${selected === i ? 'selected' : ''}`} onClick={() => choose(i)}>
              <div className="option-marker" style={{ background: selected === i ? 'var(--accent)' : 'transparent', borderColor: selected === i ? 'var(--accent)' : 'var(--border-glass)', color: selected === i ? 'white' : 'var(--text-muted)' }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span style={{ fontSize: '0.9rem' }}>{opt}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={selected === null} onClick={next}>
          {current + 1 === KNOWLEDGE_TEST_QUESTIONS.length ? 'Finish Assessment' : 'Next Question →'}
        </button>
      </div>
    </div>
  );

  if (phase === 'results' && result) {
    const isBeginner = result.overall < 25;
    return (
      <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
        <div className="auth-bg" />
        <div className="auth-card fade-in" style={{ maxWidth: 560 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Your Quantum Knowledge</h2>
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: '5rem', fontWeight: 900, background: 'var(--gradient-2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{result.overall}%</div>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
              {isBeginner ? '🌱 You\'re a Quantum Beginner — perfect starting point!' : result.overall < 50 ? '📈 Foundations are there — time to deepen knowledge!' : result.overall < 75 ? '🚀 Solid knowledge — let\'s fill the gaps!' : '⭐ Advanced learner — expert path awaits!'}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            {Object.entries(result.skillScores).map(([skill, score]) => (
              <div key={skill} className="skill-bar-item">
                <div className="skill-bar-header">
                  <span className="skill-bar-label">{SKILL_LABELS[skill] || skill}</span>
                  <span className="skill-bar-value">{score}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${score >= 70 ? 'success' : ''}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
          {isBeginner ? (
            <div className="card card-glow" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>📚 Full Learning Path Ready</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You'll follow the complete 24-module curriculum from Module 1 to 24.</div>
            </div>
          ) : (
            <div className="card card-glow" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>🎯 Personalized Roadmap Ready</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>We've created a custom learning path based on your strengths and weaknesses.</div>
            </div>
          )}
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => nav('/dashboard')}>
            View My Dashboard →
          </button>
        </div>
      </div>
    );
  }
  return null;
}
