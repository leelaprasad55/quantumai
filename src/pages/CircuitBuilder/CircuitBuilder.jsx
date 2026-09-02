import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { storage } from '../../utils/storage.js';
import { simulateCircuit, getProbabilities, measure, blochCoords, getQubitProbabilities, getReducedQubitState } from '../../utils/quantum.js';
import AITutor from '../../components/ai/AITutor.jsx';
import BlochSphere from '../../components/BlochSphere.jsx';
import CircuitExplainer from '../../components/CircuitExplainer.jsx';

const GATE_COLORS = { H:'#7c4dff', X:'#ff5252', Y:'#ff9800', Z:'#2196f3', S:'#00bcd4', T:'#4caf50', CNOT:'#e91e63', M:'#9e9e9e', SWAP:'#795548', I:'#607d8b', Rx:'#f44336', Ry:'#ff6d00', Rz:'#1565c0' };

const BASIC_GATES = ['H','X','Y','Z','S','T','CNOT','SWAP','M'];
const ROTATION_GATES = ['Rx','Ry','Rz'];
const ALL_GATES = [...BASIC_GATES, ...ROTATION_GATES];

export default function CircuitBuilder() {
  const { user } = useAuth();
  const { trackGateUsage } = useProgress();
  const [nQubits, setNQubits] = useState(2);
  const [ops, setOps] = useState([]); // {gate, target, control?, col, angle?}
  const [dragGate, setDragGate] = useState(null);
  const [shots, setShots] = useState(1000);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [saveName, setSaveName] = useState('');
  const [saved, setSaved] = useState(storage.getSavedCircuits(user?.id || '') || []);
  const [showExplainer, setShowExplainer] = useState(false);
  const [rotAngle, setRotAngle] = useState(Math.PI / 2);
  const [selectedQubitForBloch, setSelectedQubitForBloch] = useState(0);

  const maxCols = Math.max(8, ops.reduce((m, o) => Math.max(m, o.col + 2), 8));

  // Live simulation state for probabilities and Bloch sphere
  const liveState = useMemo(() => {
    const nonMeasure = ops.filter(o => o.gate !== 'M');
    if (nonMeasure.length === 0) return null;
    try {
      return simulateCircuit(nonMeasure, nQubits);
    } catch { return null; }
  }, [ops, nQubits]);

  // Per-qubit probabilities
  const qubitProbs = useMemo(() => {
    if (!liveState) return Array(nQubits).fill({ p0: 100, p1: 0 });
    return Array.from({ length: nQubits }, (_, q) => getQubitProbabilities(liveState, nQubits, q));
  }, [liveState, nQubits]);

  // Bloch sphere coords for selected qubit
  const blochData = useMemo(() => {
    if (!liveState) return { x: 0, y: 0, z: 1 };
    if (nQubits === 1) return blochCoords(liveState);
    const reduced = getReducedQubitState(liveState, nQubits, selectedQubitForBloch);
    return { x: reduced.x, y: reduced.y, z: reduced.z };
  }, [liveState, nQubits, selectedQubitForBloch]);

  const addOp = (gate, qubit, col) => {
    const isRotation = ROTATION_GATES.includes(gate);
    let newOp = { gate, target: qubit, col };
    if (isRotation) newOp.angle = rotAngle;
    if (gate === 'CNOT') newOp = { gate: 'CNOT', control: qubit > 0 ? qubit - 1 : 1, target: qubit, col };
    if (gate === 'SWAP') newOp = { gate: 'SWAP', control: qubit > 0 ? qubit - 1 : 1, target: qubit, col };
    const newOps = [...ops, newOp];
    pushHistory(newOps);
    if (trackGateUsage) trackGateUsage(gate);
  };

  const pushHistory = (newOps) => {
    const newHist = [...history.slice(0, histIdx + 1), newOps];
    setHistory(newHist); setHistIdx(newHist.length - 1); setOps(newOps); setResults(null);
  };

  const undo = () => { if (histIdx > 0) { setHistIdx(h => h - 1); setOps(history[histIdx - 1]); } };
  const redo = () => { if (histIdx < history.length - 1) { setHistIdx(h => h + 1); setOps(history[histIdx + 1]); } };
  const clear = () => { pushHistory([]); };

  const simulate = () => {
    const nonMeasure = ops.filter(o => o.gate !== 'M');
    try {
      const state = simulateCircuit(nonMeasure, nQubits);
      const probs = getProbabilities(state);
      const counts = measure(state, nQubits, shots);
      setResults({ state, probs, counts });
    } catch (e) { setResults({ error: e.message }); }
  };

  const saveCircuit = () => {
    if (!user || !saveName.trim()) return;
    const circuits = storage.getSavedCircuits(user.id) || [];
    circuits.push({ name: saveName, ops, nQubits, date: new Date().toISOString() });
    storage.setSavedCircuits(user.id, circuits);
    setSaved(circuits);
    setSaveName('');
  };

  const loadCircuit = (c) => { setNQubits(c.nQubits); pushHistory(c.ops); };

  const dropOnCell = (qubit, col) => {
    if (!dragGate) return;
    addOp(dragGate, qubit, col);
    setDragGate(null);
  };

  const cellOps = (q, c) => ops.filter(o => o.target === q && o.col === c);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">⚡ Quantum Circuit Builder</h1>
        <p className="page-subtitle">Drag gates onto qubit wires, see live state probabilities, and visualize on the Bloch sphere</p>
      </div>

      {/* Gate Palette */}
      <div className="gate-palette" style={{ marginBottom: 16, flexDirection: 'column', gap: 12 }}>
        {/* Basic Gates */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, width: 60 }}>Gates</span>
          {BASIC_GATES.map(g => (
            <div key={g} className="gate-btn" draggable
              style={{ borderColor: dragGate === g ? GATE_COLORS[g] : '', background: dragGate === g ? `${GATE_COLORS[g]}20` : '' }}
              onDragStart={() => setDragGate(g)}
              onDragEnd={() => !results && setDragGate(null)}
              title={g === 'M' ? 'Measure' : g === 'CNOT' ? 'Controlled-NOT' : g === 'SWAP' ? 'Swap' : `${g} Gate`}
            >
              <span style={{ color: GATE_COLORS[g] }}>{g}</span>
            </div>
          ))}
        </div>
        {/* Rotation Gates */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, width: 60 }}>Rotations</span>
          {ROTATION_GATES.map(g => (
            <div key={g} className="gate-btn" draggable
              style={{
                borderColor: dragGate === g ? GATE_COLORS[g] : '',
                background: dragGate === g ? `${GATE_COLORS[g]}20` : '',
                width: 'auto', padding: '0 12px',
              }}
              onDragStart={() => setDragGate(g)}
              onDragEnd={() => !results && setDragGate(null)}
              title={`${g} rotation gate`}
            >
              <span style={{ color: GATE_COLORS[g] }}>{g}(θ)</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>θ =</span>
            <input
              type="range" min={0} max={Math.PI * 2} step={0.01}
              value={rotAngle} onChange={e => setRotAngle(parseFloat(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', minWidth: 40 }}>
              {(rotAngle * 180 / Math.PI).toFixed(0)}°
            </span>
          </div>
        </div>
        {/* Qubit selector + Explain button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, width: 60 }}>Qubits</span>
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`btn btn-sm ${nQubits === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setNQubits(n); clear(); }}>{n}</button>
          ))}
          <button
            className="btn btn-sm"
            style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #7c4dff, #448aff)', color: 'white', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowExplainer(true)}
            title="Get AI analysis of your circuit"
          >
            🧠 Explain Circuit with AI
          </button>
        </div>
      </div>

      {/* Circuit Canvas with probability badges */}
      <div className="circuit-canvas" style={{ padding: 16, overflowX: 'auto', marginBottom: 20, minHeight: nQubits * 70 + 40 }}>
        {Array.from({ length: nQubits }, (_, q) => (
          <div key={q} style={{ display: 'flex', alignItems: 'center', height: 68, marginBottom: 4 }}>
            <div style={{ width: 48, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0 }}>q[{q}]</div>
            {/* Live probability badge */}
            <div className="qubit-prob-badge" title={`|0⟩: ${qubitProbs[q].p0}%, |1⟩: ${qubitProbs[q].p1}%`}>
              <span style={{ color: '#3b82f6' }}>|0⟩{qubitProbs[q].p0}%</span>
              <span style={{ color: '#ef4444' }}>|1⟩{qubitProbs[q].p1}%</span>
            </div>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              {/* Wire */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--border-glass)', zIndex: 0 }} />
              {/* Cells */}
              <div style={{ display: 'flex', gap: 0, position: 'relative', zIndex: 1 }}>
                {Array.from({ length: maxCols }, (_, c) => {
                  const cell = cellOps(q, c);
                  return (
                    <div key={c}
                      style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dragGate ? 'crosshair' : 'default' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => dropOnCell(q, c)}
                    >
                      {cell.map((op, i) => (
                        <div key={i}
                          className="circuit-gate-cell"
                          style={{ background: `${GATE_COLORS[op.gate] || '#7c4dff'}15`, border: `2px solid ${GATE_COLORS[op.gate] || '#7c4dff'}`, color: GATE_COLORS[op.gate] || '#7c4dff' }}
                          onClick={() => { const newOps = ops.filter(o => !(o.target === op.target && o.col === op.col && o.gate === op.gate)); pushHistory(newOps); }}
                          title={`Remove ${op.gate} gate`}
                        >
                          {op.gate}{op.angle !== undefined ? `\n${(op.angle * 180 / Math.PI).toFixed(0)}°` : ''}{op.control !== undefined ? `\n↑${op.control}` : ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {ops.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 8, fontSize: '0.85rem' }}>
            👆 Drag gates from the palette onto qubit wires to build your circuit
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={simulate} disabled={ops.filter(o => o.gate !== 'M').length === 0}>▶ Simulate</button>
        <button className="btn btn-secondary" onClick={undo} disabled={histIdx === 0}>↩ Undo</button>
        <button className="btn btn-secondary" onClick={redo} disabled={histIdx >= history.length - 1}>↪ Redo</button>
        <button className="btn btn-secondary" onClick={clear}>🗑 Clear</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shots:</span>
          {[100, 1000, 10000].map(s => (
            <button key={s} className={`btn btn-sm ${shots === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShots(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Bloch Sphere + Results */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Bloch Sphere */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>🌐 Bloch Sphere</h3>
            {nQubits > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qubit:</span>
                {Array.from({ length: nQubits }, (_, q) => (
                  <button
                    key={q}
                    className={`btn btn-sm ${selectedQubitForBloch === q ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedQubitForBloch(q)}
                    style={{ minWidth: 32, padding: '4px 8px' }}
                  >q{q}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BlochSphere coords={blochData} size={220} label={`q${selectedQubitForBloch}`} />
          </div>
        </div>

        {/* Quick state summary */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📊 Live State</h3>
          {liveState ? (
            <>
              {Array.from({ length: nQubits }, (_, q) => {
                const probs = qubitProbs[q];
                return (
                  <div key={q} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
                      <span>q[{q}]</span>
                      <span style={{ color: 'var(--accent)' }}>|0⟩:{probs.p0}% |1⟩:{probs.p1}%</span>
                    </div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
                      <div style={{ width: `${probs.p0}%`, background: '#3b82f6', transition: 'width 0.4s ease' }} />
                      <div style={{ width: `${probs.p1}%`, background: '#ef4444', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {ops.filter(o => o.gate !== 'M').length} gate{ops.filter(o => o.gate !== 'M').length !== 1 ? 's' : ''} • {nQubits} qubit{nQubits !== 1 ? 's' : ''} • Depth {Math.max(0, ...ops.map(o => o.col)) + 1}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add gates to see live state analysis</div>
          )}
        </div>
      </div>

      {/* Results */}
      {results && !results.error && (
        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📊 Probabilities</h3>
            {Object.entries(results.counts).sort((a, b) => b[1] - a[1]).map(([state, count]) => {
              const pct = Math.round((count / shots) * 100);
              return (
                <div key={state} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    <span>|{state}⟩</span><span>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🔢 Measurement Counts ({shots} shots)</h3>
            {Object.entries(results.counts).sort((a, b) => b[1] - a[1]).map(([state, count]) => (
              <div key={state} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 6, marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <span>|{state}⟩</span>
                <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results?.error && (
        <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(255,82,82,0.05)' }}>
          <div style={{ color: 'var(--danger)' }}>⚠ Simulation error: {results.error}</div>
        </div>
      )}

      {/* Save */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>💾 Save Circuit</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" placeholder="Circuit name..." value={saveName} onChange={e => setSaveName(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={saveCircuit} disabled={!saveName.trim() || ops.length === 0}>Save</button>
        </div>
        {saved.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Saved circuits:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {saved.map((c, i) => (
                <button key={i} className="btn btn-secondary btn-sm" onClick={() => loadCircuit(c)}>📂 {c.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Explainer Drawer */}
      {showExplainer && <CircuitExplainer ops={ops} nQubits={nQubits} onClose={() => setShowExplainer(false)} />}

      <AITutor />
    </div>
  );
}
