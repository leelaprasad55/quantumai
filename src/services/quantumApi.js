import { supabase } from '../lib/supabaseClient.js';

// Production uses the same FastAPI origin that serves the React bundle. During
// Vite development, /api is forwarded to the local FastAPI server by vite.config.js.
const API_URL = (import.meta.env.VITE_QUANTUM_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const { data: { session } = {} } = supabase ? await supabase.auth.getSession() : { data: {} };
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.error || `Quantum API request failed (${response.status}).`);
  return body;
}

export function buildQiskitCircuit(ops, qubits) {
  const lines = ['from qiskit import QuantumCircuit', '', `qc = QuantumCircuit(${qubits})`];
  [...ops].filter(op => op.gate !== 'M').sort((a, b) => a.col - b.col).forEach((op) => {
    const gate = op.gate.toLowerCase();
    if (['rx', 'ry', 'rz'].includes(gate)) lines.push(`qc.${gate}(${Number(op.angle || Math.PI / 2)}, ${op.target})`);
    else if (op.gate === 'CNOT') lines.push(`qc.cx(${op.control}, ${op.target})`);
    else if (['CZ', 'SWAP'].includes(op.gate)) lines.push(`qc.${gate}(${op.control}, ${op.target})`);
    else if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op.gate)) lines.push(`qc.${gate}(${op.target})`);
  });
  lines.push('qc.measure_all()');
  return lines.join('\n');
}

export async function executeCircuit({ framework = 'qiskit', code, shots = 1024 }) {
  return request('/api/quantum/execute', { method: 'POST', body: JSON.stringify({ framework, code, shots }) });
}

export async function getCapabilities() { return request('/api/capabilities'); }

export async function submitIbmJob({ backend, shots }) {
  return request('/api/ibm/run', { method: 'POST', body: JSON.stringify({ backend, shots }) });
}

export async function getIbmJob(jobId) { return request(`/api/jobs/ibm/${encodeURIComponent(jobId)}`); }
