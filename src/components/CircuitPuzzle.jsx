import { useState, useMemo } from 'react';
import { simulateCircuit, getProbabilities, blochCoords, statesEqual, initState, applyGate, c } from '../utils/quantum.js';
import BlochSphere from './BlochSphere.jsx';

const GATE_COLORS = { H:'#7c4dff', X:'#ff5252', Y:'#ff9800', Z:'#2196f3', S:'#00bcd4', T:'#4caf50', CNOT:'#e91e63', SWAP:'#795548' };
const PUZZLE_GATES = ['H','X','Y','Z','S','T','CNOT'];

export default function CircuitPuzzle({ puzzle, onComplete, onClose }) {
  const [ops, setOps] = useState([]);
  const [dragGate, setDragGate] = useState(null);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const nQubits = puzzle.qubits || 1;
  const maxCols = 8;

  // Current simulated state
  const currentState = useMemo(() => {
    if (ops.length === 0) return initState(nQubits);
    try {
      return simulateCircuit(ops, nQubits);
    } catch { return initState(nQubits); }
  }, [ops, nQubits]);

  // Target state from expected gates
  const targetState = useMemo(() => {
    if (!puzzle.expectedGates) return initState(nQubits);
    try {
      const targetOps = puzzle.expectedGates.map(g => ({
        gate: g.gate,
        target: g.qubit,
        col: g.step,
        control: g.gate === 'CNOT' ? (g.qubit > 0 ? g.qubit - 1 : 1) : undefined,
      }));
      return simulateCircuit(targetOps, nQubits);
    } catch { return initState(nQubits); }
  }, [puzzle, nQubits]);

  const blochData = useMemo(() => {
    if (nQubits === 1) return blochCoords(currentState);
    return { x: 0, y: 0, z: 1 };
  }, [currentState, nQubits]);

  const addOp = (gate, qubit, col) => {
    let newOp = { gate, target: qubit, col };
    if (gate === 'CNOT') newOp = { gate: 'CNOT', control: qubit > 0 ? qubit - 1 : 1, target: qubit, col };
    setOps(prev => [...prev, newOp]);
    setFeedback(null);
  };

  const dropOnCell = (qubit, col) => {
    if (!dragGate) return;
    addOp(dragGate, qubit, col);
    setDragGate(null);
  };

  const removeOp = (target, col, gate) => {
    setOps(prev => prev.filter(o => !(o.target === target && o.col === col && o.gate === gate)));
    setFeedback(null);
  };

  const checkSolution = () => {
    // Use verify function if available, otherwise compare states
    let correct = false;
    if (puzzle.verify) {
      const opsForVerify = ops.map(o => ({ gate: o.gate, qubit: o.target, step: o.col }));
      correct = puzzle.verify(opsForVerify);
    }
    // Also verify state vector
    if (!correct) {
      correct = statesEqual(targetState, currentState);
    }

    if (correct) {
      setSolved(true);
      setFeedback({ type: 'success', text: '🎉 Correct! You built the circuit perfectly!' });
      if (onComplete) onComplete();
    } else {
      setFeedback({ type: 'error', text: '❌ Not quite right. Check your gate placement and try again.' });
    }
  };

  const cellOps = (q, col) => ops.filter(o => o.target === q && o.col === col);

  return (
    <div className="puzzle-container">
      {/* Header */}
      <div className="puzzle-header">
        <div>
          <h3 className="puzzle-title">🧩 {puzzle.title}</h3>
          <p className="puzzle-desc">{puzzle.desc}</p>
        </div>
        {onClose && <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>}
      </div>

      {/* State Info */}
      <div className="puzzle-states">
        <div className="puzzle-state-box">
          <div className="puzzle-state-label">Input State</div>
          <div className="puzzle-state-ket">{puzzle.inputState}</div>
        </div>
        <div className="puzzle-arrow">→</div>
        <div className="puzzle-state-box target">
          <div className="puzzle-state-label">Target State</div>
          <div className="puzzle-state-ket">{puzzle.outputState}</div>
        </div>
      </div>

      {/* Gate Palette */}
      <div className="puzzle-palette">
        {PUZZLE_GATES.filter(g => g !== 'CNOT' || nQubits >= 2).map(g => (
          <div key={g} className="gate-btn" draggable
            style={{ borderColor: dragGate === g ? GATE_COLORS[g] : '', background: dragGate === g ? `${GATE_COLORS[g]}20` : '' }}
            onDragStart={() => setDragGate(g)}
            onDragEnd={() => setDragGate(null)}
          >
            <span style={{ color: GATE_COLORS[g] }}>{g}</span>
          </div>
        ))}
      </div>

      {/* Mini Circuit Canvas */}
      <div className="puzzle-canvas">
        {Array.from({ length: nQubits }, (_, q) => (
          <div key={q} style={{ display: 'flex', alignItems: 'center', height: 56, marginBottom: 2 }}>
            <div style={{ width: 36, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>q{q}</div>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--border-glass)', zIndex: 0 }} />
              <div style={{ display: 'flex', gap: 0, position: 'relative', zIndex: 1 }}>
                {Array.from({ length: maxCols }, (_, col) => {
                  const cell = cellOps(q, col);
                  return (
                    <div key={col}
                      style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dragGate ? 'crosshair' : 'default' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => dropOnCell(q, col)}
                    >
                      {cell.map((op, i) => (
                        <div key={i}
                          className="circuit-gate-cell"
                          style={{ width: 40, height: 40, background: `${GATE_COLORS[op.gate]}15`, border: `2px solid ${GATE_COLORS[op.gate]}`, color: GATE_COLORS[op.gate] }}
                          onClick={() => removeOp(op.target, op.col, op.gate)}
                        >
                          {op.gate}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bloch + Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 12, flexWrap: 'wrap' }}>
        {nQubits === 1 && (
          <div style={{ flex: '0 0 auto' }}>
            <BlochSphere coords={blochData} size={160} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={checkSolution} disabled={ops.length === 0 || solved}>
              ✓ Check Solution
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHint(!showHint)}>
              💡 {showHint ? 'Hide' : 'Show'} Hint
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setOps([]); setFeedback(null); setSolved(false); }}>
              🗑 Clear
            </button>
          </div>

          {showHint && (
            <div className="puzzle-hint">{puzzle.hint}</div>
          )}

          {feedback && (
            <div className={`puzzle-feedback ${feedback.type}`}>
              {feedback.text}
            </div>
          )}

          {solved && (
            <div className="puzzle-success">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎊</div>
              <div style={{ fontWeight: 700 }}>Puzzle Complete!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                You successfully built the circuit to produce {puzzle.outputState}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
