// Quantum simulation engine - pure JS
export function add(a, b) { return { r: a.r + b.r, i: a.i + b.i }; }
export function mul(a, b) { return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }; }
export function conj(a) { return { r: a.r, i: -a.i }; }
export function abs2(a) { return a.r * a.r + a.i * a.i; }
export function c(r, i = 0) { return { r, i }; }
export function scale(a, s) { return { r: a.r * s, i: a.i * s }; }

const sq2 = Math.SQRT2;
const isq2 = 1 / sq2;

export const GATES = {
  I: [[c(1), c(0)], [c(0), c(1)]],
  X: [[c(0), c(1)], [c(1), c(0)]],
  Y: [[c(0), c(0, -1)], [c(0, 1), c(0)]],
  Z: [[c(1), c(0)], [c(0), c(-1)]],
  H: [[c(isq2), c(isq2)], [c(isq2), c(-isq2)]],
  S: [[c(1), c(0)], [c(0), c(0, 1)]],
  T: [[c(1), c(0)], [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]],
};

export function gateMatrix(name, angle = 0) {
  if (GATES[name]) return GATES[name];
  if (name === 'Rx') {
    const c0 = Math.cos(angle / 2), s0 = Math.sin(angle / 2);
    return [[c(c0), c(0, -s0)], [c(0, -s0), c(c0)]];
  }
  if (name === 'Ry') {
    const c0 = Math.cos(angle / 2), s0 = Math.sin(angle / 2);
    return [[c(c0), c(-s0)], [c(s0), c(c0)]];
  }
  if (name === 'Rz') {
    return [[c(Math.cos(-angle / 2), Math.sin(-angle / 2)), c(0)], [c(0), c(Math.cos(angle / 2), Math.sin(angle / 2))]];
  }
  return GATES['I'];
}

function tensorProduct(G, n, targetQubit) {
  // Apply gate G to targetQubit in n-qubit system
  const size = 1 << n;
  const result = Array(size).fill(null).map(() => Array(size).fill(c(0)));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const ib = (i >> (n - 1 - targetQubit)) & 1;
      const jb = (j >> (n - 1 - targetQubit)) & 1;
      const iRest = i & ~(1 << (n - 1 - targetQubit));
      const jRest = j & ~(1 << (n - 1 - targetQubit));
      if (iRest === jRest) result[i][j] = G[ib][jb];
    }
  }
  return result;
}

function cnotMatrix(n, ctrl, tgt) {
  const size = 1 << n;
  const result = Array(size).fill(null).map(() => Array(size).fill(c(0)));
  for (let i = 0; i < size; i++) {
    const ctrlBit = (i >> (n - 1 - ctrl)) & 1;
    if (ctrlBit === 1) {
      const j = i ^ (1 << (n - 1 - tgt));
      result[j][i] = c(1);
    } else {
      result[i][i] = c(1);
    }
  }
  return result;
}

function swapMatrix(n, q1, q2) {
  const size = 1 << n;
  const result = Array(size).fill(null).map(() => Array(size).fill(c(0)));
  for (let i = 0; i < size; i++) {
    const b1 = (i >> (n - 1 - q1)) & 1;
    const b2 = (i >> (n - 1 - q2)) & 1;
    if (b1 !== b2) {
      const j = i ^ (1 << (n - 1 - q1)) ^ (1 << (n - 1 - q2));
      result[j][i] = c(1);
    } else {
      result[i][i] = c(1);
    }
  }
  return result;
}

function matVecMul(M, v) {
  const n = v.length;
  return Array(n).fill(null).map((_, i) => {
    let s = c(0);
    for (let j = 0; j < n; j++) s = add(s, mul(M[i][j], v[j]));
    return s;
  });
}

export function applyGate(state, nQubits, gate, target, control = -1, angle = 0) {
  if (gate === 'CNOT' || (gate === 'X' && control >= 0)) {
    const M = cnotMatrix(nQubits, control, target);
    return matVecMul(M, state);
  }
  if (gate === 'SWAP') {
    const q2 = control >= 0 ? control : (target > 0 ? target - 1 : 1);
    const M = swapMatrix(nQubits, target, q2);
    return matVecMul(M, state);
  }
  if (gate === 'CZ') {
    let temp = applyGate(state, nQubits, 'H', target);
    temp = applyGate(temp, nQubits, 'CNOT', target, control);
    return applyGate(temp, nQubits, 'H', target);
  }
  const G = gateMatrix(gate, angle);
  const M = tensorProduct(G, nQubits, target);
  return matVecMul(M, state);
}

export function initState(nQubits) {
  const size = 1 << nQubits;
  const s = Array(size).fill(c(0));
  s[0] = c(1);
  return s;
}

export function getProbabilities(state) {
  return state.map(a => abs2(a));
}

export function measure(state, nQubits, shots = 1000) {
  const probs = getProbabilities(state);
  const counts = {};
  const size = 1 << nQubits;
  for (let i = 0; i < size; i++) {
    const key = i.toString(2).padStart(nQubits, '0');
    counts[key] = 0;
  }
  for (let s = 0; s < shots; s++) {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < size; i++) {
      cum += probs[i];
      if (r < cum) {
        const key = i.toString(2).padStart(nQubits, '0');
        counts[key]++;
        break;
      }
    }
  }
  return counts;
}

export function blochCoords(state) {
  // Single qubit only
  const a = state[0] || c(0);
  const b = state[1] || c(0);
  const x = 2 * (a.r * b.r + a.i * b.i);
  const y = 2 * (a.i * b.r - a.r * b.i);
  const z = abs2(a) - abs2(b);
  return { x, y, z };
}

export function getReducedBlochCoords(state, nQubits, targetQubit = 0) {
  const size = 1 << nQubits;
  let rho00 = c(0), rho01 = c(0), rho10 = c(0), rho11 = c(0);
  for (let i = 0; i < size; i++) {
    const bit_i = (i >> (nQubits - 1 - targetQubit)) & 1;
    for (let j = 0; j < size; j++) {
      const bit_j = (j >> (nQubits - 1 - targetQubit)) & 1;
      // Trace over other qubits: check if all other bits match
      const mask = ~(1 << (nQubits - 1 - targetQubit));
      if ((i & mask) === (j & mask)) {
        const val = mul(state[i], conj(state[j]));
        if (bit_i === 0 && bit_j === 0) rho00 = add(rho00, val);
        else if (bit_i === 0 && bit_j === 1) rho01 = add(rho01, val);
        else if (bit_i === 1 && bit_j === 0) rho10 = add(rho10, val);
        else if (bit_i === 1 && bit_j === 1) rho11 = add(rho11, val);
      }
    }
  }
  const x = rho01.r + rho10.r;
  const y = rho10.i - rho01.i;
  const z = rho00.r - rho11.r;
  return { x, y, z };
}

// Extract reduced single-qubit state from multi-qubit system
export function getReducedQubitState(fullState, nQubits, qubitIdx) {
  if (nQubits === 1) return fullState;
  const size = 1 << nQubits;
  // Compute reduced density matrix for qubit via partial trace
  let rho00 = c(0), rho01 = c(0), rho10 = c(0), rho11 = c(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const ib = (i >> (nQubits - 1 - qubitIdx)) & 1;
      const jb = (j >> (nQubits - 1 - qubitIdx)) & 1;
      const iRest = i & ~(1 << (nQubits - 1 - qubitIdx));
      const jRest = j & ~(1 << (nQubits - 1 - qubitIdx));
      if (iRest !== jRest) continue;
      const val = mul(fullState[i], conj(fullState[j]));
      if (ib === 0 && jb === 0) rho00 = add(rho00, val);
      else if (ib === 0 && jb === 1) rho01 = add(rho01, val);
      else if (ib === 1 && jb === 0) rho10 = add(rho10, val);
      else rho11 = add(rho11, val);
    }
  }
  // Convert to Bloch coords from density matrix
  const bx = 2 * rho01.r;
  const by = 2 * rho01.i;
  const bz = rho00.r - rho11.r;
  return { x: bx, y: -by, z: bz, rho00, rho11, pure: Math.sqrt(bx * bx + by * by + bz * bz) > 0.99 };
}

// Get qubit probabilities from full state
export function getQubitProbabilities(fullState, nQubits, qubitIdx) {
  const size = 1 << nQubits;
  let p0 = 0, p1 = 0;
  for (let i = 0; i < size; i++) {
    const bit = (i >> (nQubits - 1 - qubitIdx)) & 1;
    const p = abs2(fullState[i]);
    if (bit === 0) p0 += p; else p1 += p;
  }
  return { p0: Math.round(p0 * 100), p1: Math.round(p1 * 100) };
}

export function simulateCircuit(ops, nQubits) {
  let state = initState(nQubits);
  // Sort ops by column for proper ordering
  const sorted = [...ops].filter(o => o.gate !== 'M').sort((a, b) => a.col - b.col);
  for (const op of sorted) {
    state = applyGate(state, nQubits, op.gate, op.target, op.control ?? -1, op.angle ?? 0);
  }
  return state;
}

// Compare two state vectors (up to global phase)
export function statesEqual(s1, s2, tolerance = 0.05) {
  if (s1.length !== s2.length) return false;
  // Find global phase offset
  let refIdx = -1;
  for (let i = 0; i < s1.length; i++) {
    if (abs2(s1[i]) > 0.01) { refIdx = i; break; }
  }
  if (refIdx < 0) return s2.every(v => abs2(v) < tolerance);
  // Compute phase offset
  const phase = mul(s2[refIdx], conj(s1[refIdx]));
  const phaseMag = Math.sqrt(abs2(phase));
  if (phaseMag < 0.01) return false;
  const normPhase = { r: phase.r / phaseMag, i: phase.i / phaseMag };
  for (let i = 0; i < s1.length; i++) {
    const expected = mul(s1[i], normPhase);
    const diff = add(s2[i], { r: -expected.r, i: -expected.i });
    if (abs2(diff) > tolerance) return false;
  }
  return true;
}

// Gate descriptions for circuit explainer
const GATE_DESCRIPTIONS = {
  H: { name: 'Hadamard', symbol: 'H', desc: 'Creates equal superposition', matrix: '1/√2 [[1,1],[1,−1]]' },
  X: { name: 'Pauli-X (NOT)', symbol: 'X', desc: 'Bit flip — swaps |0⟩ and |1⟩', matrix: '[[0,1],[1,0]]' },
  Y: { name: 'Pauli-Y', symbol: 'Y', desc: 'Bit + phase flip', matrix: '[[0,−i],[i,0]]' },
  Z: { name: 'Pauli-Z', symbol: 'Z', desc: 'Phase flip — adds π phase to |1⟩', matrix: '[[1,0],[0,−1]]' },
  S: { name: 'S (Phase)', symbol: 'S', desc: 'π/2 phase rotation', matrix: '[[1,0],[0,i]]' },
  T: { name: 'T (π/8)', symbol: 'T', desc: 'π/4 phase rotation', matrix: '[[1,0],[0,e^(iπ/4)]]' },
  CNOT: { name: 'CNOT', symbol: 'CX', desc: 'Controlled-NOT — flips target if control is |1⟩', matrix: '[[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]' },
  SWAP: { name: 'SWAP', symbol: 'SWAP', desc: 'Swaps two qubit states', matrix: '[[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]]' },
  Rx: { name: 'Rx(θ)', symbol: 'Rx', desc: 'Rotation around X-axis', matrix: '[[cos(θ/2),−i·sin(θ/2)],[−i·sin(θ/2),cos(θ/2)]]' },
  Ry: { name: 'Ry(θ)', symbol: 'Ry', desc: 'Rotation around Y-axis', matrix: '[[cos(θ/2),−sin(θ/2)],[sin(θ/2),cos(θ/2)]]' },
  Rz: { name: 'Rz(θ)', symbol: 'Rz', desc: 'Rotation around Z-axis', matrix: '[[e^(−iθ/2),0],[0,e^(iθ/2)]]' },
};

// Format complex number for display
function fmtComplex(v) {
  const r = Math.round(v.r * 1000) / 1000;
  const im = Math.round(v.i * 1000) / 1000;
  if (Math.abs(im) < 0.001) return `${r}`;
  if (Math.abs(r) < 0.001) return im === 1 ? 'i' : im === -1 ? '−i' : `${im}i`;
  return `${r}${im > 0 ? '+' : ''}${im}i`;
}

// Generate structured AI explanation for a circuit
export function explainCircuit(ops, nQubits) {
  const sorted = [...ops].filter(o => o.gate !== 'M').sort((a, b) => a.col - b.col);
  if (sorted.length === 0) return null;

  // State transformations
  const transformations = [];
  let state = initState(nQubits);
  const stateStr = (s) => {
    const terms = [];
    for (let i = 0; i < s.length; i++) {
      const mag = abs2(s[i]);
      if (mag < 0.001) continue;
      const coeff = fmtComplex(s[i]);
      const ket = `|${i.toString(2).padStart(nQubits, '0')}⟩`;
      terms.push(coeff === '1' ? ket : coeff === '-1' ? `−${ket}` : `${coeff}${ket}`);
    }
    return terms.join(' + ').replace(/\+ −/g, '− ') || '|0⟩';
  };

  transformations.push({ step: 'Initial', state: stateStr(state) });
  for (const op of sorted) {
    state = applyGate(state, nQubits, op.gate, op.target, op.control ?? -1, op.angle ?? 0);
    const gateLabel = op.gate === 'CNOT'
      ? `CNOT(q${op.control}→q${op.target})`
      : op.angle ? `${op.gate}(${(op.angle * 180 / Math.PI).toFixed(0)}°) on q${op.target}`
      : `${op.gate} on q${op.target}`;
    transformations.push({ step: gateLabel, state: stateStr(state) });
  }

  // Matrix operations
  const matrices = sorted.map(op => {
    const info = GATE_DESCRIPTIONS[op.gate] || { name: op.gate, desc: '', matrix: 'I' };
    return {
      gate: info.name,
      target: op.gate === 'CNOT' ? `control=q${op.control}, target=q${op.target}` : `q${op.target}`,
      matrix: info.matrix,
      desc: info.desc,
    };
  });

  // Concept breakdown
  const concepts = [];
  const hasH = sorted.some(o => o.gate === 'H');
  const hasCNOT = sorted.some(o => o.gate === 'CNOT');
  const hasX = sorted.some(o => o.gate === 'X');

  if (hasH && hasCNOT) {
    concepts.push('This circuit creates **quantum entanglement** — the qubits become correlated so measuring one instantly determines the other.');
    concepts.push('The Hadamard gate puts a qubit into superposition, and the CNOT then "spreads" that superposition to create a Bell state.');
  } else if (hasH) {
    concepts.push('The Hadamard gate creates **superposition** — the qubit exists in both |0⟩ and |1⟩ simultaneously with equal probability.');
  }
  if (hasCNOT && !hasH) {
    concepts.push('The CNOT gate performs a **conditional flip** — it only flips the target qubit when the control qubit is |1⟩.');
  }
  if (hasX && !hasH && !hasCNOT) {
    concepts.push('The X gate is the quantum equivalent of a **classical NOT** — it flips |0⟩ to |1⟩ and vice versa.');
  }
  if (sorted.some(o => o.gate === 'Z')) {
    concepts.push('The Z gate applies a **phase flip** — it changes the sign of the |1⟩ component without affecting probabilities.');
  }
  if (sorted.some(o => ['S', 'T'].includes(o.gate))) {
    concepts.push('Phase gates (S, T) perform **precision rotations** around the Z-axis of the Bloch sphere.');
  }
  if (sorted.some(o => ['Rx', 'Ry', 'Rz'].includes(o.gate))) {
    concepts.push('Rotation gates provide **continuous control** over qubit state — they rotate by an arbitrary angle around the specified axis.');
  }

  const probs = getProbabilities(state);
  const probSummary = [];
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > 0.001) {
      probSummary.push(`|${i.toString(2).padStart(nQubits, '0')}⟩: ${(probs[i] * 100).toFixed(1)}%`);
    }
  }
  concepts.push(`**Final measurement probabilities:** ${probSummary.join(', ')}`);

  return { transformations, matrices, concepts };
}
