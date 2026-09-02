// Per-topic quiz questions — keyed by topic ID
// Guaranteed to have at least 5 questions per topic

export const TOPIC_QUESTIONS = {
  // ─── MODULE 1: Computing, Mathematics & Quantum Foundations ───
  '1-1': [
    { id:'tq1-1a', q:'What is the primary function of a computer?', options:['Store data only','Process information using instructions','Generate electricity','Connect to the internet'], answer:1 },
    { id:'tq1-1b', q:'Which component executes instructions in a computer?', options:['Hard drive','RAM','CPU','Monitor'], answer:2 },
  ],
  '1-2': [
    { id:'tq1-2a', q:'Classical computers process information using:', options:['Qubits','Analog signals','Binary digits (bits)','Quantum states'], answer:2 },
    { id:'tq1-2b', q:'What is the fundamental limitation of classical computing for certain problems?', options:['Speed of light','Exponential scaling of resources','Lack of memory','No limitations'], answer:1 },
  ],
  '1-3': [
    { id:'tq1-3a', q:'What is 13 in binary?', options:['1100','1101','1011','1110'], answer:1 },
    { id:'tq1-3b', q:'How many different values can 4 bits represent?', options:['4','8','16','32'], answer:2 },
  ],
  '1-4': [
    { id:'tq1-4a', q:'A bit can take which values?', options:['Any number','0 or 1','True only','A or B'], answer:1 },
    { id:'tq1-4b', q:'How many bits are in a byte?', options:['4','8','16','2'], answer:1 },
  ],
  '1-5': [
    { id:'tq1-5a', q:'What does an AND gate output when both inputs are 1?', options:['0','1','Undefined','Either'], answer:1 },
    { id:'tq1-5b', q:'Which gate inverts its input?', options:['AND','OR','NOT','XOR'], answer:2 },
  ],
  '1-6': [
    { id:'tq1-6a', q:'Why do classical computers struggle with molecular simulation?', options:['Not enough RAM','Exponential state space growth','Too slow CPU','Bad algorithms'], answer:1 },
  ],
  '1-7': [
    { id:'tq1-7a', q:'Quantum computing leverages which physical phenomenon?', options:['Magnetism','Gravity','Superposition & entanglement','Friction'], answer:2 },
  ],
  '1-8': [
    { id:'tq1-8a', q:'Quantum computers use which unit of information?', options:['Bit','Byte','Qubit','Trit'], answer:2 },
  ],
  '1-9': [
    { id:'tq1-9a', q:'If an event has probability 0.3, what is the probability it does NOT occur?', options:['0.3','0.7','1.3','0'], answer:1 },
    { id:'tq1-9b', q:'Probabilities must sum to:', options:['0','0.5','1','2'], answer:2 },
  ],
  '1-10': [
    { id:'tq1-10a', q:'A uniform distribution over 4 outcomes gives each outcome probability:', options:['1','0.5','0.25','0'], answer:2 },
  ],
  '1-11': [
    { id:'tq1-11a', q:'What is the imaginary unit i defined as?', options:['√1','√(-1)','1/2','π'], answer:1 },
    { id:'tq1-11b', q:'What is i² equal to?', options:['1','-1','i','0'], answer:1 },
  ],
  '1-12': [
    { id:'tq1-12a', q:'A vector in 2D space has how many components?', options:['1','2','3','4'], answer:1 },
    { id:'tq1-12b', q:'The length of vector [3,4] is:', options:['7','5','12','1'], answer:1 },
  ],
  '1-13': [
    { id:'tq1-13a', q:'A 2×2 matrix has how many elements?', options:['2','4','6','8'], answer:1 },
    { id:'tq1-13b', q:'The identity matrix multiplied by any vector gives:', options:['Zero vector','The same vector','A rotated vector','The transpose'], answer:1 },
  ],
  '1-14': [
    { id:'tq1-14a', q:'For matrix multiplication AB, the number of columns of A must equal:', options:['Rows of A','Columns of B','Rows of B','Columns of A'], answer:2 },
  ],
  '1-15': [
    { id:'tq1-15a', q:'A linear transformation preserves:', options:['Only magnitude','Addition and scalar multiplication','Only direction','Nothing'], answer:1 },
  ],
  '1-16': [
    { id:'tq1-16a', q:'Two vectors are orthogonal when their dot product equals:', options:['1','-1','0','Infinity'], answer:2 },
  ],
  '1-17': [
    { id:'tq1-17a', q:'In Dirac notation, |ψ⟩ is called a:', options:['Bra','Ket','Bracket','Operator'], answer:1 },
    { id:'tq1-17b', q:'⟨ψ| is the _____ of |ψ⟩:', options:['Inverse','Conjugate transpose','Square','Derivative'], answer:1 },
  ],
  '1-18': [
    { id:'tq1-18a', q:'|0⟩ as a column vector is:', options:['[0,1]ᵀ','[1,0]ᵀ','[1,1]ᵀ','[0,0]ᵀ'], answer:1 },
  ],
  '1-19': [
    { id:'tq1-19a', q:'⟨0| as a row vector is:', options:['[0,1]','[1,0]','[1,1]','[0,0]'], answer:1 },
  ],
  '1-20': [
    { id:'tq1-20a', q:'⟨0|1⟩ equals:', options:['1','0','i','-1'], answer:1 },
    { id:'tq1-20b', q:'⟨0|0⟩ equals:', options:['0','1','2','i'], answer:1 },
  ],
  '1-21': [
    { id:'tq1-21a', q:'A normalized quantum state satisfies:', options:['⟨ψ|ψ⟩ = 0','⟨ψ|ψ⟩ = 1','⟨ψ|ψ⟩ = 2','⟨ψ|ψ⟩ = ∞'], answer:1 },
  ],
  '1-22': [
    { id:'tq1-22a', q:'Which mathematical topic is most essential for quantum computing?', options:['Calculus','Statistics','Linear algebra','Geometry'], answer:2 },
  ],

  // ─── MODULE 2: Qubits & Quantum States ───
  '2-1': [
    { id:'tq2-1a', q:'A qubit is the quantum analog of:', options:['A byte','A bit','A register','A gate'], answer:1 },
    { id:'tq2-1b', q:'Unlike a classical bit, a qubit can be in:', options:['Only 0','Only 1','Superposition of 0 and 1','Only 2'], answer:2 },
  ],
  '2-2': [
    { id:'tq2-2a', q:'A classical bit has how many definite states?', options:['1','2','Infinite','0'], answer:1 },
  ],
  '2-3': [
    { id:'tq2-3a', q:'|0⟩ represents:', options:['The excited state','The ground state','Superposition','Entanglement'], answer:1 },
  ],
  '2-4': [
    { id:'tq2-4a', q:'|1⟩ represents:', options:['The ground state','The excited state','Equal superposition','No state'], answer:1 },
  ],
  '2-5': [
    { id:'tq2-5a', q:'The general qubit state α|0⟩ + β|1⟩ requires:', options:['α + β = 1','|α|² + |β|² = 1','α = β','α² + β² = 0'], answer:1 },
  ],
  '2-6': [
    { id:'tq2-6a', q:'Superposition means a qubit is:', options:['Broken','In a combination of |0⟩ and |1⟩ simultaneously','Always |0⟩','Entangled'], answer:1 },
    { id:'tq2-6b', q:'The |+⟩ state is:', options:['|0⟩','|1⟩','(|0⟩+|1⟩)/√2','(|0⟩-|1⟩)/√2'], answer:2 },
  ],
  '2-7': [
    { id:'tq2-7a', q:'Probability amplitudes are:', options:['Always real','Always positive','Complex numbers','Integers'], answer:2 },
    { id:'tq2-7b', q:'The probability of measuring |0⟩ from state α|0⟩+β|1⟩ is:', options:['α','|α|²','α²','|α|'], answer:1 },
  ],
  '2-8': [
    { id:'tq2-8a', q:'What does qubit normalization ensure?', options:['Speed','Probabilities sum to 1','Entanglement','Gate correctness'], answer:1 },
  ],
  '2-9': [
    { id:'tq2-9a', q:'Relative phase affects:', options:['Nothing observable','Measurement probabilities in different bases','Only global phase','The qubit energy'], answer:1 },
  ],
  '2-10': [
    { id:'tq2-10a', q:'Global phase is:', options:['Always observable','Physically undetectable','Equal to relative phase','A gate type'], answer:1 },
  ],
  '2-11': [
    { id:'tq2-11a', q:'A qubit state vector lives in:', options:['3D space','A 2D complex vector space','Classical phase space','Boolean space'], answer:1 },
  ],
  '2-12': [
    { id:'tq2-12a', q:'The computational basis for 1 qubit consists of:', options:['{|+⟩, |−⟩}','{|0⟩, |1⟩}','{|i⟩, |−i⟩}','{|↑⟩, |↓⟩}'], answer:1 },
  ],
  '2-13': [
    { id:'tq2-13a', q:'The Bloch sphere represents:', options:['Multi-qubit states','A single qubit pure state','Classical bits','Noise models'], answer:1 },
    { id:'tq2-13b', q:'|0⟩ is located at which pole of the Bloch sphere?', options:['South pole','North pole','Equator','Center'], answer:1 },
  ],
  '2-14': [
    { id:'tq2-14a', q:'Which tool visualizes single-qubit states as points on a sphere?', options:['Histogram','Bloch sphere','Bar chart','Circuit diagram'], answer:1 },
  ],
  '2-15': [
    { id:'tq2-15a', q:'Measuring a qubit in superposition:', options:['Returns both 0 and 1','Collapses it to |0⟩ or |1⟩ probabilistically','Has no effect','Destroys the qubit'], answer:1 },
  ],
  '2-16': [
    { id:'tq2-16a', q:'For state (√0.7)|0⟩ + (√0.3)|1⟩, P(|0⟩) is:', options:['0.3','0.7','0.5','1.0'], answer:1 },
  ],
  '2-17': [
    { id:'tq2-17a', q:'After wavefunction collapse, the qubit is in:', options:['Superposition','A definite basis state','An entangled state','A mixed state'], answer:1 },
  ],
  '2-18': [
    { id:'tq2-18a', q:'Measuring the same collapsed state again gives:', options:['A random result','The same result','The opposite result','An error'], answer:1 },
  ],
  '2-19': [
    { id:'tq2-19a', q:'State preparation puts a qubit into:', options:['A random state','A specific desired state','Always |0⟩','Always |1⟩'], answer:1 },
  ],

  // ─── MODULE 3: Single-Qubit Quantum Gates ───
  '3-1': [
    { id:'tq3-1a', q:'Quantum gates are represented by:', options:['Scalar values','Unitary matrices','Classical logic tables','Probability distributions'], answer:1 },
  ],
  '3-2': [
    { id:'tq3-2a', q:'A unitary matrix U satisfies:', options:['U² = I','UU† = I','U = U†','det(U) = 0'], answer:1 },
  ],
  '3-3': [
    { id:'tq3-3a', q:'The identity gate does:', options:['Flips the qubit','Nothing — state unchanged','Creates superposition','Measures the qubit'], answer:1 },
  ],
  '3-4': [
    { id:'tq3-4a', q:'X gate applied to |0⟩ gives:', options:['|0⟩','|1⟩','|+⟩','|−⟩'], answer:1 },
    { id:'tq3-4b', q:'The X gate is equivalent to which classical gate?', options:['AND','OR','NOT','XOR'], answer:2 },
  ],
  '3-5': [
    { id:'tq3-5a', q:'The Y gate matrix is:', options:['[[0,1],[1,0]]','[[0,-i],[i,0]]','[[1,0],[0,-1]]','[[1,0],[0,i]]'], answer:1 },
  ],
  '3-6': [
    { id:'tq3-6a', q:'Z gate applied to |1⟩ gives:', options:['|0⟩','|1⟩','-|1⟩','|+⟩'], answer:2 },
    { id:'tq3-6b', q:'Z gate applied to |0⟩ gives:', options:['|0⟩','|1⟩','-|0⟩','|+⟩'], answer:0 },
  ],
  '3-7': [
    { id:'tq3-7a', q:'H gate applied to |0⟩ produces:', options:['|0⟩','|1⟩','|+⟩ = (|0⟩+|1⟩)/√2','|−⟩'], answer:2 },
    { id:'tq3-7b', q:'H gate applied to |1⟩ produces:', options:['|0⟩','|1⟩','|+⟩','|−⟩ = (|0⟩−|1⟩)/√2'], answer:3 },
    { id:'tq3-7c', q:'Applying H twice returns the qubit to:', options:['Superposition','Its original state','|+⟩','|1⟩'], answer:1 },
  ],
  '3-8': [
    { id:'tq3-8a', q:'S gate adds a phase of:', options:['π','π/2','π/4','2π'], answer:1 },
  ],
  '3-9': [
    { id:'tq3-9a', q:'S† is the _____ of S:', options:['Square','Inverse (adjoint)','Double','Transpose'], answer:1 },
  ],
  '3-10': [
    { id:'tq3-10a', q:'T gate adds a phase of:', options:['π','π/2','π/4','π/8'], answer:2 },
  ],
  '3-11': [
    { id:'tq3-11a', q:'T† gate is also called:', options:['S gate','T-dagger','X gate','H gate'], answer:1 },
  ],
  '3-12': [
    { id:'tq3-12a', q:'The phase gate P(θ) applies phase e^(iθ) to which state?', options:['|0⟩','|1⟩','Both','Neither'], answer:1 },
  ],
  '3-13': [
    { id:'tq3-13a', q:'Rz(π) is equivalent to which gate?', options:['X','Y','Z','H'], answer:2 },
    { id:'tq3-13b', q:'Rotation gates allow:', options:['Only discrete rotations','Continuous parameterized rotations','No rotation','Classical logic'], answer:1 },
  ],
  '3-14': [
    { id:'tq3-14a', q:'The X gate matrix is:', options:['[[1,0],[0,1]]','[[0,1],[1,0]]','[[1,0],[0,-1]]','[[0,-i],[i,0]]'], answer:1 },
  ],
  '3-15': [
    { id:'tq3-15a', q:'Applying gate A then gate B is represented as:', options:['A + B','A × B','BA (B applied to result of A)','AB'], answer:2 },
  ],
  '3-16': [
    { id:'tq3-16a', q:'The inverse of a unitary gate U is:', options:['U²','U†','U','I'], answer:1 },
  ],
  '3-17': [
    { id:'tq3-17a', q:'HZH equals which gate?', options:['Z','X','Y','H'], answer:1 },
  ],
  '3-18': [
    { id:'tq3-18a', q:'Which type of phase is physically observable?', options:['Global phase','Relative phase','Both','Neither'], answer:1 },
  ],
  '3-19': [
    { id:'tq3-19a', q:'On the Bloch sphere, X gate performs rotation around:', options:['X-axis','Y-axis','Z-axis','No axis'], answer:0 },
  ],

  // ─── MODULE 4: Multi-Qubit Systems & Entanglement ───
  '4-1': [
    { id:'tq4-1a', q:'A 2-qubit system has how many basis states?', options:['2','4','8','16'], answer:1 },
    { id:'tq4-1b', q:'An n-qubit system has how many basis states?', options:['n','2n','2ⁿ','n²'], answer:2 },
  ],
  '4-2': [
    { id:'tq4-2a', q:'|01⟩ means:', options:['Both qubits are 0','First qubit is 0, second is 1','Both qubits are 1','First qubit is 1, second is 0'], answer:1 },
  ],
  '4-3': [
    { id:'tq4-3a', q:'The tensor product of |0⟩ and |1⟩ gives:', options:['|0⟩','|1⟩','|01⟩','|10⟩'], answer:2 },
  ],
  '4-4': [
    { id:'tq4-4a', q:'A 2-qubit state vector has how many amplitudes?', options:['2','4','8','1'], answer:1 },
  ],
  '4-5': [
    { id:'tq4-5a', q:'The computational basis for 2 qubits is:', options:['{|0⟩,|1⟩}','{|00⟩,|01⟩,|10⟩,|11⟩}','{|+⟩,|−⟩}','{|00⟩,|11⟩}'], answer:1 },
  ],
  '4-6': [
    { id:'tq4-6a', q:'A controlled operation acts on the target qubit based on:', options:['A random choice','The state of the control qubit','Time','Temperature'], answer:1 },
  ],
  '4-7': [
    { id:'tq4-7a', q:'CNOT flips the target when the control is:', options:['|0⟩','|1⟩','In superposition','Measured'], answer:1 },
    { id:'tq4-7b', q:'CNOT applied to |10⟩ gives:', options:['|10⟩','|11⟩','|00⟩','|01⟩'], answer:1 },
  ],
  '4-8': [
    { id:'tq4-8a', q:'Controlled-X is another name for:', options:['CZ','CNOT','SWAP','Toffoli'], answer:1 },
  ],
  '4-9': [
    { id:'tq4-9a', q:'CZ gate applies a Z gate to the target when control is:', options:['|0⟩','|1⟩','Any state','Measured'], answer:1 },
  ],
  '4-10': [
    { id:'tq4-10a', q:'SWAP gate exchanges:', options:['Amplitudes only','The states of two qubits','Phases only','Nothing'], answer:1 },
  ],
  '4-11': [
    { id:'tq4-11a', q:'Controlled phase gate applies a phase when:', options:['Target is |0⟩','Both control and target are |1⟩','Control is |0⟩','Always'], answer:1 },
  ],
  '4-12': [
    { id:'tq4-12a', q:'Entanglement means:', options:['Qubits are physically touching','Measuring one instantly determines the other','Qubits are identical','Qubits are far apart'], answer:1 },
    { id:'tq4-12b', q:'Entangled states cannot be written as:', options:['Superpositions','Tensor products of individual states','Ket notation','Amplitudes'], answer:1 },
  ],
  '4-13': [
    { id:'tq4-13a', q:'A separable state can be written as:', options:['A Bell state','A tensor product |ψ⟩⊗|φ⟩','An entangled pair','A density matrix'], answer:1 },
  ],
  '4-14': [
    { id:'tq4-14a', q:'How many Bell states exist?', options:['1','2','4','8'], answer:2 },
    { id:'tq4-14b', q:'|Φ+⟩ = (|00⟩+|11⟩)/√2 is a:', options:['Separable state','Product state','Bell state','Mixed state'], answer:2 },
  ],
  '4-15': [
    { id:'tq4-15a', q:'To create a Bell state from |00⟩, apply:', options:['X then Z','H on q0, then CNOT(q0,q1)','Z on both','SWAP'], answer:1 },
  ],
  '4-16': [
    { id:'tq4-16a', q:'Quantum correlations in entangled states:', options:['Obey classical bounds','Can violate classical bounds','Are always zero','Are deterministic'], answer:1 },
  ],
  '4-17': [
    { id:'tq4-17a', q:'Bell inequality violation proves:', options:['Quantum mechanics is wrong','Nature is non-local/non-classical','Hidden variables exist','Nothing useful'], answer:1 },
  ],

  // ─── MODULE 5: Quantum Circuit Design ───
  '5-1': [
    { id:'tq5-1a', q:'A quantum circuit consists of:', options:['Only classical bits','Qubits, gates, and measurements','Only gates','Only measurements'], answer:1 },
  ],
  '5-5': [
    { id:'tq5-5a', q:'Quantum wires represent:', options:['Physical cables','The passage of time for a qubit','Classical connections','Power lines'], answer:1 },
  ],
  '5-7': [
    { id:'tq5-7a', q:'Measurement in a circuit converts:', options:['Classical to quantum','Quantum information to classical bits','Qubits to gates','Nothing'], answer:1 },
  ],
  '5-10': [
    { id:'tq5-10a', q:'Circuit depth measures:', options:['Number of qubits','Longest sequential gate chain','Total number of gates','Classical bit count'], answer:1 },
  ],
  '5-12': [
    { id:'tq5-12a', q:'Ancilla qubits are:', options:['Main computation qubits','Extra helper qubits','Broken qubits','Output qubits'], answer:1 },
  ],
  '5-15': [
    { id:'tq5-15a', q:'Quantum computation is reversible because:', options:['It uses classical logic','All gates are unitary','Measurements are reversible','Bits can be copied'], answer:1 },
  ],

  // ─── MODULE 6: Measurement & Quantum Information ───
  '6-1': [
    { id:'tq6-1a', q:'Measurement extracts:', options:['The full quantum state','Classical information from a quantum state','Nothing','Phase information only'], answer:1 },
  ],
  '6-3': [
    { id:'tq6-3a', q:'Computational basis measurement measures in which basis?', options:['{|+⟩,|−⟩}','{|0⟩,|1⟩}','{|i⟩,|−i⟩}','Any basis'], answer:1 },
  ],
  '6-7': [
    { id:'tq6-7a', q:'Expectation value ⟨O⟩ gives:', options:['A single measurement result','The average outcome over many measurements','The maximum outcome','The minimum outcome'], answer:1 },
  ],
  '6-11': [
    { id:'tq6-11a', q:'More shots in a simulation gives:', options:['Faster results','More accurate probability estimates','Exact probabilities','Less noise'], answer:1 },
  ],
  '6-15': [
    { id:'tq6-15a', q:'After state collapse, the qubit is in:', options:['Superposition','A definite basis state','An entangled state','A mixed state'], answer:1 },
  ],

  // ─── MODULE 7-10: Programming & Algorithms ───
  '7-1': [
    { id:'tq7-1a', q:'Qiskit is developed by:', options:['Google','Microsoft','IBM','Amazon'], answer:2 },
  ],
  '9-1': [
    { id:'tq9-1a', q:'The Deutsch algorithm determines if a function is:', options:['Linear or non-linear','Constant or balanced','Reversible or not','Quantum or classical'], answer:1 },
  ],
  '10-1': [
    { id:'tq10-1a', q:"Grover's algorithm provides a speedup of:", options:['Exponential','Quadratic (√N)','Linear','Logarithmic'], answer:1 },
  ],
};

// Generates exactly 5 questions for any topic dynamically based on its ID and name
export function getTopicQuestions(topicId, topicName = 'this concept') {
  const manualQuestions = TOPIC_QUESTIONS[topicId] || [];

  // Generate general comprehension questions to fill the list up to 5 questions
  const generatedPool = [
    {
      id: `gen-${topicId}-1`,
      q: `What is the primary objective of studying "${topicName}" in quantum computing?`,
      options: [
        'To optimize classical browser caching scripts',
        'To master the physical or mathematical representations required for quantum algorithms',
        'To run SQL database procedures without processors',
        'To replace standard fiber-optic cables with copper wires'
      ],
      answer: 1,
    },
    {
      id: `gen-${topicId}-2`,
      q: `Which of the following elements or structures is directly associated with "${topicName}"?`,
      options: [
        'Quantum operations, state vectors, or related physical representations',
        'A basic HTML button styling structure',
        'A server-side file replication block',
        'An analog magnetic tape partition drive'
      ],
      answer: 0,
    },
    {
      id: `gen-${topicId}-3`,
      q: `How does "${topicName}" distinguish itself in quantum systems compared to classical systems?`,
      options: [
        'It has zero differences; they are completely identical',
        'It incorporates superposition, relative phases, or unitary operators instead of static binary flags',
        'It can only be executed on optical hardware with green lasers',
        'It requires turning off all classical networking nodes'
      ],
      answer: 1,
    },
    {
      id: `gen-${topicId}-4`,
      q: `Why is a solid grasp of "${topicName}" vital for designing practical quantum algorithms?`,
      options: [
        'It automatically removes all classical security risks in a program',
        'It allows developers to predict state evolution, build gates, and manage noise or errors',
        'It guarantees zero power consumption for quantum simulators',
        'It makes compiling circuits unnecessary'
      ],
      answer: 1,
    },
    {
      id: `gen-${topicId}-5`,
      q: `When programming or simulating a system involving "${topicName}" (e.g., inside Qiskit or PennyLane), you typically:`,
      options: [
        'Construct specific quantum operators, apply them to registers, and analyze measurement outputs',
        'Re-install the operating system kernel',
        'Directly measure the spin of a single electron by hand',
        'Change the stylesheet configurations of the cloud environment'
      ],
      answer: 0,
    },
  ];

  // Merge manual questions first, then append generated questions until we have at least 5
  const merged = [...manualQuestions];
  let genIndex = 0;
  while (merged.length < 5 && genIndex < generatedPool.length) {
    merged.push(generatedPool[genIndex]);
    genIndex++;
  }

  return merged.slice(0, 5);
}
