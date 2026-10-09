// Built-in site content provider for the Admin Dashboard
// Supplies existing modules, topics, questions, challenges, achievements, resources, and projects
import { MODULES, ACHIEVEMENTS } from './modules.js';
import { ALL_TOPICS } from './allTopics.js';
import { KNOWLEDGE_TEST_QUESTIONS } from './questions.js';
import { TOPIC_CIRCUITS } from './topicCircuits.js';

export function getDefaultAdminContent(section, query = '') {
  const q = (query || '').toLowerCase().trim();
  let items = [];

  if (section === 'modules') {
    items = MODULES.map((m) => ({
      id: `builtin-module-${m.id}`,
      title: `Module ${m.id}: ${m.title}`,
      description: m.desc || '',
      status: 'published',
      sort_order: m.id,
      metadata: {
        category: m.category || 'Foundations',
        difficulty: m.category === 'Foundations' ? 'Beginner' : m.category === 'Intermediate' ? 'Intermediate' : 'Advanced',
        duration: '1-2 hours',
        icon: m.id === 1 ? '📐' : m.id === 2 ? '⚛️' : m.id === 3 ? '🚪' : m.id === 4 ? '🔗' : m.id === 7 ? '💻' : m.id === 9 ? '🧮' : m.id === 11 ? '🤖' : m.id === 13 ? '🛡️' : '📚',
        prerequisites: (m.prereqs || []).map((p) => `Module ${p}`).join(', ') || 'None',
      },
      updated_at: '2026-10-01T00:00:00Z',
    }));
  } else if (section === 'topics') {
    const list = [];
    Object.entries(ALL_TOPICS).forEach(([modId, topicList]) => {
      if (Array.isArray(topicList)) {
        topicList.forEach((t, idx) => {
          list.push({
            id: `builtin-topic-${t.id}`,
            title: t.t,
            description: `Topic ${t.id} from Module ${modId}. Interactive tutorial and video instruction.`,
            status: 'published',
            sort_order: list.length + 1,
            metadata: {
              module_name: `Module ${modId}`,
              difficulty: Number(modId) <= 6 ? 'Beginner' : Number(modId) <= 10 ? 'Intermediate' : 'Advanced',
              estimated_minutes: 15,
              key_concepts: t.t,
              video_url: t.v || '',
              doc_url: t.d || '',
              formula: '',
            },
            updated_at: '2026-10-01T00:00:00Z',
          });
        });
      }
    });
    items = list;
  } else if (section === 'resources') {
    items = [
      {
        id: 'builtin-res-1',
        title: 'IBM Quantum Learning Platform',
        description: 'Interactive courses, tutorials, and quantum business foundations from IBM Quantum.',
        status: 'published',
        sort_order: 1,
        metadata: { resource_type: 'Interactive Lab', url: 'https://learning.quantum.ibm.com', author: 'IBM Quantum', tags: 'qiskit, hardware, foundations' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-2',
        title: 'Qiskit 1.x Official Documentation',
        description: 'Comprehensive API documentation, guides, and migration manuals for Qiskit.',
        status: 'published',
        sort_order: 2,
        metadata: { resource_type: 'Documentation', url: 'https://docs.quantum.ibm.com/api/qiskit', author: 'Qiskit Development Team', tags: 'qiskit, python, transpiler' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-3',
        title: 'PennyLane Quantum Machine Learning Codebook',
        description: 'Hands-on coding modules for quantum differentiable programming and hybrid QML.',
        status: 'published',
        sort_order: 3,
        metadata: { resource_type: 'Interactive Lab', url: 'https://pennylane.ai/codebook', author: 'Xanadu', tags: 'pennylane, qml, vqe' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-4',
        title: 'Quantum Computation and Quantum Information (Nielsen & Chuang)',
        description: 'The seminal textbook on quantum information science, quantum gates, and algorithms.',
        status: 'published',
        sort_order: 4,
        metadata: { resource_type: 'Textbook / Book', url: 'https://doi.org/10.1017/CBO9780511976667', author: 'Michael A. Nielsen & Isaac L. Chuang', tags: 'textbook, algorithms, information' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-5',
        title: 'Cirq Circuit Framework Documentation',
        description: 'Google Quantum AI library for writing, manipulating, and optimizing quantum circuits.',
        status: 'published',
        sort_order: 5,
        metadata: { resource_type: 'Documentation', url: 'https://quantumai.google/cirq', author: 'Google Quantum AI', tags: 'cirq, google, hardware' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-6',
        title: 'Quantum Algorithm Zoo',
        description: 'A comprehensive catalog of all known quantum algorithms and speedups over classical computing.',
        status: 'published',
        sort_order: 6,
        metadata: { resource_type: 'Research Paper', url: 'https://quantumalgorithmzoo.org', author: 'Stephen Jordan (NIST)', tags: 'algorithms, research, speedups' },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-res-7',
        title: '3Blue1Brown: But what is quantum computing?',
        description: 'Visual, geometric exploration of qubits, superposition, Bloch spheres, and state transformations.',
        status: 'published',
        sort_order: 7,
        metadata: { resource_type: 'Video Tutorial', url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w', author: '3Blue1Brown', tags: 'video, visual, superposition' },
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];
  } else if (section === 'questions') {
    items = KNOWLEDGE_TEST_QUESTIONS.map((q, idx) => ({
      id: `builtin-question-${q.id}`,
      title: q.q,
      description: q.options ? `Correct answer: ${q.options[q.answer]}` : '',
      status: 'published',
      sort_order: idx + 1,
      metadata: {
        difficulty: q.difficulty === 1 ? 'Easy' : q.difficulty === 2 ? 'Medium' : 'Hard',
        xp_reward: q.difficulty === 1 ? 10 : q.difficulty === 2 ? 20 : 30,
        topic: q.skill || 'Foundations',
        option_a: q.options?.[0] || '',
        option_b: q.options?.[1] || '',
        option_c: q.options?.[2] || '',
        option_d: q.options?.[3] || '',
        correct_answer: ['A', 'B', 'C', 'D'][q.answer] || 'A',
      },
      updated_at: '2026-10-01T00:00:00Z',
    }));
  } else if (section === 'circuit-challenges') {
    items = Object.entries(TOPIC_CIRCUITS).map(([key, item], idx) => ({
      id: `builtin-circuit-challenge-${key}`,
      title: item.title,
      description: item.desc || '',
      status: 'published',
      sort_order: idx + 1,
      metadata: {
        qubit_budget: item.qubits || 2,
        gate_budget: item.expectedGates ? item.expectedGates.length + 3 : 6,
        target_state: item.outputState || '',
        allowed_gates: 'H, X, Y, Z, S, T, CNOT, SWAP',
        difficulty: (item.qubits || 1) === 1 ? 'Easy' : (item.qubits || 1) === 2 ? 'Medium' : 'Hard',
        xp_reward: (item.qubits || 1) * 25,
      },
      updated_at: '2026-10-01T00:00:00Z',
    }));
  } else if (section === 'coding-challenges') {
    items = [
      {
        id: 'builtin-code-1',
        title: 'Prepare 3-Qubit GHZ Entangled State',
        description: 'Write a Qiskit circuit function that constructs the Greenberger-Horne-Zeilinger (GHZ) state (|000⟩ + |111⟩)/√2 using Hadamard and CNOT gates.',
        status: 'published',
        sort_order: 1,
        metadata: {
          framework: 'qiskit',
          difficulty: 'Easy',
          xp_reward: 50,
          starter_code: 'from qiskit import QuantumCircuit\n\ndef ghz_state():\n    qc = QuantumCircuit(3)\n    # Your code here\n    return qc',
          reference_solution: 'qc.h(0)\nqc.cx(0, 1)\nqc.cx(1, 2)',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-code-2',
        title: 'Quantum Teleportation Protocol',
        description: 'Implement the standard quantum teleportation protocol to transmit an unknown qubit state from Alice to Bob using an EPR pair and classical feedforward.',
        status: 'published',
        sort_order: 2,
        metadata: {
          framework: 'qiskit',
          difficulty: 'Medium',
          xp_reward: 100,
          starter_code: 'from qiskit import QuantumCircuit\n\ndef teleportation_circuit():\n    qc = QuantumCircuit(3, 2)\n    # Your code here\n    return qc',
          reference_solution: 'qc.h(1)\nqc.cx(1, 2)\nqc.cx(0, 1)\nqc.h(0)\nqc.measure(0, 0)\nqc.measure(1, 1)',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-code-3',
        title: 'Deutsch-Jozsa Constant vs Balanced Oracle',
        description: 'Build a Deutsch-Jozsa algorithm implementation in PennyLane that determines whether a black-box oracle is constant or balanced in a single quantum query.',
        status: 'published',
        sort_order: 3,
        metadata: {
          framework: 'pennylane',
          difficulty: 'Medium',
          xp_reward: 100,
          starter_code: 'import pennylane as qml\n\ndev = qml.device("default.qubit", wires=3)\n\n@qml.qnode(dev)\ndef deutsch_jozsa():\n    # Your QNode code\n    return qml.probs(wires=range(2))',
          reference_solution: 'for w in range(2):\n    qml.Hadamard(wires=w)\nqml.PauliX(wires=2)\nqml.Hadamard(wires=2)',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-code-4',
        title: 'Grover Search 2-Qubit Oracle',
        description: 'Construct a 2-qubit Grover search circuit with phase oracle marking the target state |11⟩ and diffusion operator to amplify its probability to 100%.',
        status: 'published',
        sort_order: 4,
        metadata: {
          framework: 'qiskit',
          difficulty: 'Hard',
          xp_reward: 150,
          starter_code: 'from qiskit import QuantumCircuit\n\ndef grover_2qubit():\n    qc = QuantumCircuit(2)\n    # Your code here\n    return qc',
          reference_solution: 'qc.h([0, 1])\nqc.cz(0, 1)\nqc.h([0, 1])\nqc.z([0, 1])\nqc.cz(0, 1)\nqc.h([0, 1])',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-code-5',
        title: 'Cirq Quantum Fourier Transform (3 Qubits)',
        description: 'Build a 3-qubit Quantum Fourier Transform (QFT) circuit in Google Cirq with controlled phase rotations and SWAP gates.',
        status: 'published',
        sort_order: 5,
        metadata: {
          framework: 'cirq',
          difficulty: 'Hard',
          xp_reward: 150,
          starter_code: 'import cirq\n\ndef qft_3qubit():\n    qubits = [cirq.LineQubit(i) for i in range(3)]\n    circuit = cirq.Circuit()\n    # Your code here\n    return circuit',
          reference_solution: 'circuit.append([cirq.H(qubits[0]), cirq.CZ(qubits[1], qubits[0])**(1/2), cirq.CZ(qubits[2], qubits[0])**(1/4)])',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];
  } else if (section === 'achievements') {
    items = ACHIEVEMENTS.map((a, idx) => ({
      id: `builtin-achievement-${a.id}`,
      title: a.name,
      description: a.desc || '',
      status: 'published',
      sort_order: idx + 1,
      metadata: {
        badge_icon: a.icon || '🏆',
        category: a.id.includes('streak') ? 'Streaks' : a.id.includes('circuit') || a.id.includes('bell') ? 'Circuits' : a.id.includes('lab') ? 'Mastery' : 'Learning',
        xp_reward: 100,
        criteria_type: a.id.includes('streak') ? 'streak_days' : a.id.includes('circuit') ? 'circuits_completed' : 'modules_completed',
        threshold: a.id === 'streak_7' ? 7 : a.id === 'circuit_builder' ? 5 : 1,
      },
      updated_at: '2026-10-01T00:00:00Z',
    }));
  } else if (section === 'projects') {
    items = [
      {
        id: 'builtin-proj-1',
        title: 'Bell-State Quantum Entanglement Analyzer',
        description: 'Construct, simulate, and verify 4 orthogonal Bell states. Analyze correlation matrices and quantum fidelity under simulated depolarization noise.',
        status: 'published',
        sort_order: 1,
        metadata: {
          difficulty: 'Beginner',
          estimated_hours: '4 hours',
          github_url: 'https://github.com/qiskit-community/qiskit-tutorials',
          skills: 'Qiskit, Superposition, Entanglement',
          milestones: '1. State preparation circuit\n2. Noise model simulation\n3. Density matrix tomography',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-proj-2',
        title: 'Quantum Key Distribution (BB84 Protocol) Simulator',
        description: 'End-to-end implementation of the BB84 quantum cryptography protocol including random basis selection, quantum channel transmission, and eavesdropping detection.',
        status: 'published',
        sort_order: 2,
        metadata: {
          difficulty: 'Intermediate',
          estimated_hours: '8 hours',
          github_url: 'https://github.com/qiskit-community',
          skills: 'Python, Qiskit, Cryptography, Probability',
          milestones: '1. Alice state encoding\n2. Quantum channel & Eve intercept\n3. Key sifting & error rate calculation',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-proj-3',
        title: 'Grover Search Database Query Engine',
        description: 'Implement an unstructured search engine using Grover amplitude amplification to find target records in a quantum superposition register.',
        status: 'published',
        sort_order: 3,
        metadata: {
          difficulty: 'Intermediate',
          estimated_hours: '10 hours',
          github_url: 'https://github.com/qiskit-community',
          skills: 'Qiskit, Algorithms, Oracles',
          milestones: '1. Phase oracle construction\n2. Diffusion operator synthesis\n3. Optimal iteration loop',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-proj-4',
        title: 'Variational Quantum Eigensolver (VQE) Molecular Simulator',
        description: 'Simulate the ground-state energy curve of the Hydrogen molecule (H2) using a parameterized Ansatz and classical optimizer loop in PennyLane/Qiskit.',
        status: 'published',
        sort_order: 4,
        metadata: {
          difficulty: 'Advanced',
          estimated_hours: '16 hours',
          github_url: 'https://github.com/PennyLaneAI/qml',
          skills: 'PennyLane, Chemistry, VQE, Optimization',
          milestones: '1. Molecular Hamiltonian mapping\n2. UCCSD Ansatz definition\n3. Gradient descent optimization',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-proj-5',
        title: 'Surface Code Quantum Error Correction Pipeline',
        description: 'Build a distance-3 rotated surface code syndrome measurement circuit. Detect bit-flip (X) and phase-flip (Z) errors using minimum-weight perfect matching.',
        status: 'published',
        sort_order: 5,
        metadata: {
          difficulty: 'Advanced',
          estimated_hours: '20 hours',
          github_url: 'https://github.com/qiskit-community',
          skills: 'Error Correction, Stabilizer Codes, Syndrome Decoding',
          milestones: '1. Stabilizer generator circuits\n2. Syndrome readout & lookup table\n3. Logical error rate benchmarking',
        },
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];
  } else if (section === 'announcements') {
    items = [
      {
        id: 'builtin-ann-1',
        title: '🏁 Quantum Contests Live: Bell-State Challenge Active!',
        description: 'Participate in our rated Bell-State Challenge starting 10-10-2026. Construct optimal quantum circuits and compete on the global leaderboard with IBM Quantum fidelity verification.',
        status: 'published',
        sort_order: 1,
        metadata: { priority: 'Important', style: 'info', audience: 'All users', pinned: true },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-ann-2',
        title: '✨ 24 Interactive Modules & Quantum SDK Ecosystem Updated',
        description: 'Explore our expanded curriculum featuring Qiskit 1.0, PennyLane QML, Cirq, and real hardware experiments on IBM Quantum.',
        status: 'published',
        sort_order: 2,
        metadata: { priority: 'Normal', style: 'success', audience: 'All users', pinned: false },
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'builtin-ann-3',
        title: '🤖 AI Quantum Tutor Enhanced with Multi-Model Support',
        description: 'The AI Tutor now supports real-time contextual explanations, hints for circuit builder challenges, and step-by-step math breakdowns.',
        status: 'published',
        sort_order: 3,
        metadata: { priority: 'Normal', style: 'info', audience: 'Students only', pinned: false },
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];
  }

  if (!q) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(q))
  );
}

export function mergeAdminContent(dbItems = [], defaultItems = []) {
  if (!dbItems || !dbItems.length) return defaultItems;
  
  // Database items override defaults with matching title
  const dbTitles = new Set(dbItems.map((item) => (item.title || '').trim().toLowerCase()));
  const remainingDefaults = defaultItems.filter(
    (item) => !dbTitles.has((item.title || '').trim().toLowerCase())
  );
  
  return [...dbItems, ...remainingDefaults];
}
