// Topic Key Formulas Mapping
// Provides explicit, scientifically accurate topic-specific mathematical formulas and state representations for EVERY topic across modules 1-24.

export const TOPIC_FORMULAS = {
  // ── Module 1: Computing, Mathematics & Quantum Foundations ──
  '1-1': ['Turing Machine Model: M = (Q, Σ, Γ, δ, q₀, B, F)', 'Transition Function: δ(q, a) = (q\', b, D)'],
  '1-2': ['Classical Bit Domain: b ∈ {0, 1}', 'Deterministic Boolean Function: f: {0,1}ⁿ → {0,1}'],
  '1-3': ['Positional Binary Conversion: N = ∑ᵢ₌₀ⁿ⁻¹ (bᵢ × 2ⁱ)', 'Example: 1101₂ = 1×8 + 1×4 + 0×2 + 1×1 = 13₁₀'],
  '1-4': ['Shannon Information Content: I(x) = -log₂ P(x)', 'Entropy: H(X) = -∑ P(xᵢ) log₂ P(xᵢ)'],
  '1-5': ['Boolean Logic Gates:', 'AND: Y = A · B,  OR: Y = A + B', 'NOT: Y = Ā,  NAND: Y = (A · B)̄ (Universal)'],
  '1-6': ['Exponential Memory Wall: Dim(H) = 2ⁿ states for n quantum particles', 'Time Complexity Limit: P ≠ NP Conjecture'],
  '1-7': ['Quantum Superposition Advantage:', '|ψ⟩ = ∑ᵢ cᵢ |i⟩ in 2ⁿ dimensional Hilbert space'],
  '1-8': ['Quantum Hilbert Space: |ψ⟩ ∈ ℂ²ⁿ', 'Schrödinger Time Evolution: iħ (d/dt)|ψ(t)⟩ = H |ψ(t)⟩'],
  '1-9': ['Probability Axioms: ∑ᵢ P(i) = 1,  0 ≤ P(i) ≤ 1', 'Complement Rule: P(Aᶜ) = 1 - P(A)'],
  '1-10': ['Expected Value: E[X] = ∑ₖ xₖ P(X = xₖ)', 'Variance: Var(X) = E[X²] - (E[X])²'],
  '1-11': ['Complex Number: z = a + bi = r e^(iθ)', 'Euler Identity: e^(iθ) = cos θ + i sin θ', 'Magnitude Square: |z|² = z z* = a² + b²'],
  '1-12': ['Column Vector: |v⟩ = [v₁, v₂]ᵀ', 'Euclidean Norm: ||v|| = √(v₁² + v₂²)'],
  '1-13': ['Matrix A = [[a, b], [c, d]]', 'Determinant: det(A) = ad - bc', 'Trace: Tr(A) = a + d'],
  '1-14': ['Matrix Product: (AB)ᵢⱼ = ∑ₖ Aᵢₖ Bₖⱼ', 'Non-Commutative Property: AB ≠ BA in general'],
  '1-15': ['Linear Operator Transformation:', 'T(α|u⟩ + β|v⟩) = α T(|u⟩) + β T(|v⟩)'],
  '1-16': ['Eigenvalue Problem: A|vₖ⟩ = λₖ|vₖ⟩', 'Characteristic Equation: det(A - λI) = 0'],
  '1-17': ['Ket (Column Vector): |ψ⟩ = [c₀, c₁]ᵀ', 'Bra (Row Vector): ⟨ψ| = (|ψ⟩)† = [c₀*, c₁*]'],
  '1-18': ['Computational Ket Basis:', '|0⟩ = [1, 0]ᵀ,  |1⟩ = [0, 1]ᵀ'],
  '1-19': ['Computational Bra Basis:', '⟨0| = [1, 0],  ⟨1| = [0, 1]'],
  '2-0': ['Inner Product: ⟨ψ|ϕ⟩ = ∑ᵢ aᵢ* bᵢ', 'Orthonormality: ⟨i|j⟩ = δᵢⱼ'],
  '1-20': ['Inner Product: ⟨ψ|ϕ⟩ = ∑ᵢ aᵢ* bᵢ', 'Orthonormality: ⟨i|j⟩ = δᵢⱼ'],
  '1-21': ['State Normalization Constraint:', '⟨ψ|ψ⟩ = ∑ᵢ |cᵢ|² = |α|² + |β|² = 1'],
  '1-22': ['Hermitian Operator: A = A† = (Aᵀ)*', 'Unitary Operator: U U† = U† U = I'],

  // ── Module 2: Qubits & Quantum States ──
  '2-1': ['Qubit Superposition: |ψ⟩ = α|0⟩ + β|1⟩', 'Complex Amplitudes: α, β ∈ ℂ where |α|² + |β|² = 1'],
  '2-2': ['Classical Bit: b ∈ {0, 1}', 'Quantum Qubit: |ψ⟩ = α|0⟩ + β|1⟩ (Infinite continuum of states)'],
  '2-3': ['Ground Basis State |0⟩:', '|0⟩ = [1, 0]ᵀ,  P(|0⟩) = |⟨0|0⟩|² = 1'],
  '2-4': ['Excited Basis State |1⟩:', '|1⟩ = [0, 1]ᵀ,  P(|1⟩) = |⟨1|1⟩|² = 1'],
  '2-5': ['General Qubit State Vector:', '|ψ⟩ = α|0⟩ + β|1⟩,  |α|² + |β|² = 1'],
  '2-6': ['Superposition Basis States:', '|+⟩ = (|0⟩ + |1⟩)/√2,  |−⟩ = (|0⟩ - |1⟩)/√2'],
  '2-7': ['Probability Amplitudes: α = |α|e^(iϕ₀), β = |β|e^(iϕ₁)', 'Born Rule Probabilities: P(0) = |α|²,  P(1) = |β|²'],
  '2-8': ['State Norm: || |ψ⟩ || = √(⟨ψ|ψ⟩) = √(|α|² + |β|²) = 1'],
  '2-9': ['Relative Phase: |ψ⟩ = (|0⟩ + e^(iϕ)|1⟩)/√2', 'Phase angle ϕ determines interference outcome'],
  '2-10': ['Global Phase Factor: e^(iγ)(α|0⟩ + β|1⟩)', '|e^(iγ)|² = 1 (Physically unobservable overall phase)'],
  '2-11': ['State Vector in ℂ²: |ψ⟩ = [α, β]ᵀ', 'Density Matrix: ρ = |ψ⟩⟨ψ| = [[|α|², α β*], [α* β, |β|²]]'],
  '2-12': ['Z-Basis: {|0⟩, |1⟩},  X-Basis: {|+⟩, |−⟩}', 'Y-Basis: {|i+⟩ = (|0⟩+i|1⟩)/√2, |i-⟩ = (|0⟩-i|1⟩)/√2}'],
  '2-13': ['Bloch Sphere Parameterization:', '|ψ⟩ = cos(θ/2)|0⟩ + e^(iϕ) sin(θ/2)|1⟩', 'Spherical Angles: 0 ≤ θ ≤ π,  0 ≤ ϕ < 2π'],
  '2-14': ['Bloch Cartesian Vector Components:', 'r⃗ = (sin θ cos ϕ, sin θ sin ϕ, cos θ)ᵀ', 'Pure State Constraint: ||r⃗|| = 1'],
  '2-15': ['Born Measurement Projection:', 'P(m) = ⟨ψ| Pₘ |ψ⟩ where Pₘ = |m⟩⟨m|'],
  '2-16': ['Z-Basis Outcome Probabilities for α|0⟩ + β|1⟩:', 'P(|0⟩) = |α|²,  P(|1⟩) = |β|²,  P(0) + P(1) = 1'],
  '2-17': ['Wavefunction Collapse Projection:', '|ψ⟩ → |k⟩ with probability |cₖ|² upon measurement'],
  '2-18': ['Idempotent Projection Operator: Pₖ² = Pₖ', 'Post-Measurement Repeat: P(mₖ | mₖ) = 1.0'],
  '2-19': ['Unitary State Initialization: U_prep |0⟩ = |ψ_target⟩'],

  // ── Module 3: Single-Qubit Gates ──
  '3-1': ['Quantum Gate Unitary Constraint: U U† = U† U = I', 'Preserves Inner Product: ⟨Uu|Uv⟩ = ⟨u|v⟩'],
  '3-2': ['Unitary Matrix Inverse: U⁻¹ = U†', 'Determinant: |det(U)| = 1'],
  '3-3': ['Identity Gate I:', 'I = [[1, 0], [0, 1]],  I|ψ⟩ = |ψ⟩'],
  '3-4': ['Pauli-X (NOT) Gate:', 'X = [[0, 1], [1, 0]],  X|0⟩ = |1⟩,  X|1⟩ = |0⟩'],
  '3-5': ['Pauli-Y Gate:', 'Y = [[0, -i], [i, 0]],  Y|0⟩ = i|1⟩,  Y|1⟩ = -i|0⟩'],
  '3-6': ['Pauli-Z Gate:', 'Z = [[1, 0], [0, -1]],  Z|0⟩ = |0⟩,  Z|1⟩ = -|1⟩'],
  '3-7': ['Hadamard Gate H:', 'H = (1/√2)[[1, 1], [1, -1]]', 'H|0⟩ = |+⟩,  H|1⟩ = |−⟩,  H² = I'],
  '3-8': ['Phase Gate S:', 'S = [[1, 0], [0, i]],  S² = Z,  S|1⟩ = i|1⟩'],
  '3-9': ['S-Dagger Gate S†:', 'S† = [[1, 0], [0, -i]],  S S† = I'],
  '3-10': ['Phase Gate T:', 'T = [[1, 0], [0, e^(iπ/4)]],  T² = S,  T⁴ = Z'],
  '3-11': ['T-Dagger Gate T†:', 'T† = [[1, 0], [0, e^(-iπ/4)]],  T T† = I'],
  '3-12': ['Phase Gate P(θ):', 'P(θ) = [[1, 0], [0, e^(iθ)]],  P(θ)|1⟩ = e^(iθ)|1⟩'],
  '3-13': ['Rotation Operators:', 'Rₓ(θ) = cos(θ/2)I - i sin(θ/2)X', 'R_y(θ) = cos(θ/2)I - i sin(θ/2)Y', 'R_z(θ) = cos(θ/2)I - i sin(θ/2)Z'],
  '3-14': ['Pauli Matrices Commutation:', '[X, Y] = 2i Z,  [Y, Z] = 2i X,  [Z, X] = 2i Y'],
  '3-15': ['Sequential Gate Composition:', 'U_total = Uₙ Uₙ₋₁ ... U₂ U₁ (Applied Right to Left)'],
  '3-16': ['Inverse Composite Gate: (U₂ U₁)⁻¹ = U₁† U₂†'],
  '3-17': ['Gate Identities:', 'HXH = Z,  HZH = X,  HYH = -Y,  X² = Y² = Z² = I'],
  '3-18': ['Global vs Relative Phase Transformation:', 'e^(iγ)(α|0⟩ + β|1⟩)  vs  α|0⟩ + e^(iϕ)β|1⟩'],
  '3-19': ['Bloch Rotation Formula: R_n̂(θ) = exp(-i θ n̂ · σ⃗ / 2)'],

  // ── Module 4: Multi-Qubit Circuits & Entanglement ──
  '4-1': ['N-Qubit Hilbert Dimension: N_states = 2ⁿ', 'Basis Set: {|00...0⟩, ..., |11...1⟩}'],
  '4-2': ['2-Qubit State Vector: |ψ⟩ = c₀₀|00⟩ + c₀₁|01⟩ + c₁₀|10⟩ + c₁₁|11⟩', 'Normalization: |c₀₀|² + |c₀₁|² + |c₁₀|² + |c₁₁|² = 1'],
  '4-3': ['Kronecker Tensor Product:', '|u⟩ ⊗ |v⟩ = [u₀v₀, u₀v₁, u₁v₀, u₁v₁]ᵀ'],
  '4-4': ['Multi-Qubit Density Matrix: ρ ∈ ℂ²ⁿ×²ⁿ,  Tr(ρ) = 1'],
  '4-5': ['2-Qubit Computational Basis Kets:', '|00⟩ = [1,0,0,0]ᵀ, |01⟩ = [0,1,0,0]ᵀ, |10⟩ = [0,0,1,0]ᵀ, |11⟩ = [0,0,0,1]ᵀ'],
  '4-6': ['Controlled-U Gate Definition:', 'Controlled-U = |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ U'],
  '4-7': ['CNOT Gate Operator:', 'CNOT |x, y⟩ = |x, x ⊕ y⟩', 'Matrix: [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]'],
  '4-8': ['Controlled-X Transformation:', 'Control = |1⟩ ⇒ Target Qubit flips |0⟩ ↔ |1⟩'],
  '4-9': ['Controlled-Z (CZ) Gate:', 'CZ |x, y⟩ = (-1)^(x·y)|x, y⟩', 'Matrix: diag(1, 1, 1, -1)'],
  '4-10': ['SWAP Gate Operator: SWAP |x, y⟩ = |y, x⟩', 'Decomposition: CNOT₁₂ CNOT₂₁ CNOT₁₂'],
  '4-11': ['Controlled Phase CP(θ):', 'CP(θ)|11⟩ = e^(iθ)|11⟩,  CP(θ)|x,y⟩ = |x,y⟩ for (x,y)≠(1,1)'],
  '4-12': ['Quantum Entanglement Condition:', '|Ψ⟩ ≠ |ψ₁⟩ ⊗ |ψ₂⟩ (Cannot be factorized)'],
  '4-13': ['Separability vs Entanglement:', 'Separable State: ρ_A = Tr_B(|Ψ⟩⟨Ψ|) is pure (Tr(ρ_A²) = 1)'],
  '4-14': ['The 4 Canonical Bell States (EPR Pairs):', '|Φ⁺⟩ = (|00⟩+|11⟩)/√2,  |Φ⁻⟩ = (|00⟩-|11⟩)/√2', '|Ψ⁺⟩ = (|01⟩+|10⟩)/√2,  |Ψ⁻⟩ = (|01⟩-|10⟩)/√2'],
  '4-15': ['Bell State Creation Circuit:', 'Bell(|Φ⁺⟩) = CNOT₁₂ (H₁ ⊗ I₂) |00⟩'],
  '4-16': ['Quantum Correlation Expectation:', 'E(a,b) = ⟨Ψ| (â·σ⃗ ⊗ b̂·σ⃗) |Ψ⟩ = -cos(θ_ab)'],
  '4-17': ['CHSH Bell Inequality Bound:', '|S| = |E(a,b) - E(a,b\') + E(a\',b) + E(a\',b\')| ≤ 2 (Classical) vs 2√2 (Quantum)'],

  // ── Module 5: Quantum Circuit Construction ──
  '5-1': ['Circuit Operator Sequence: |Ψ_out⟩ = Uₘ ... U₂ U₁ |Ψ_in⟩'],
  '5-2': ['Qubit Register Array: q[0], q[1], ..., q[n-1]'],
  '5-3': ['Quantum Register Allocation: q = QuantumRegister(n, "q")'],
  '5-4': ['Classical Bit Register Allocation: c = ClassicalRegister(m, "c")'],
  '5-5': ['Quantum Wire Timeline: ───[ Gate ]───'],
  '5-6': ['Circuit Operator Synthesis: U_circuit = ∏ᵢ U_gate(i)'],
  '5-7': ['Measurement Operator: M = ∑ₖ k |k⟩⟨k|'],
  '5-8': ['Multi-Controlled Gate: Cⁿ(U) |1ⁿ, t⟩ = |1ⁿ⟩ ⊗ U|t⟩'],
  '5-9': ['Circuit Width: w = Total number of active qubits n'],
  '5-10': ['Circuit Depth: d = Maximum gate sequence layers'],
  '5-11': ['Gate Count Complexity: G = ∑_t N_gate(t)'],
  '5-12': ['Ancilla Helper Qubit: |Ψ_full⟩ = |Ψ_work⟩ ⊗ |0⟩_ancilla'],
  '5-13': ['Subcircuit Composition: qc_total = qc1.compose(qc2)'],
  '5-14': ['Basis Gate Decomposition: U → {Rz, X, SX, CNOT}'],
  '5-15': ['Reversible Computation: U U† = I (Zero Thermodynamic Dissipation)'],
  '5-16': ['Circuit Visualizer: qc.draw(output="mpl")'],
  '5-17': ['Unitary Validation: U_circuit U_circuit† = I'],
  '5-18': ['Transpiler Optimization: PassManager([Optimize1qGatesDecomposition()])'],

  // ── Module 6: Quantum Measurement & Observables ──
  '6-1': ['Observable Expectation Value: ⟨A⟩ = ⟨ψ|A|ψ⟩ = Tr(A ρ)'],
  '6-2': ['Projective Measurement Operators: Pₘ = |m⟩⟨m|,  ∑ₘ Pₘ = I'],
  '6-3': ['Computational Z-Basis Probability: P(z) = |⟨z|ψ⟩|² for z ∈ {0,1}ⁿ'],
  '6-4': ['X-Basis Measurement Transformation: Apply H gate before Z-measurement'],
  '6-5': ['Y-Basis Measurement Transformation: Apply S† then H gate before Z-measurement'],
  '6-6': ['Z-Basis Direct Measurement: P(0) = |α|²,  P(1) = |β|²'],
  '6-7': ['Spectral Expectation: ⟨O⟩ = ∑ₖ λₖ P(λₖ) where O|vₖ⟩ = λₖ|vₖ⟩'],
  '6-8': ['Hermitian Observable Property: O = O† with real eigenvalues λ ∈ ℝ'],
  '6-9': ['Pauli Expectation Values: ⟨X⟩ = ⟨ψ|X|ψ⟩,  ⟨Y⟩ = ⟨ψ|Y|ψ⟩,  ⟨Z⟩ = ⟨ψ|Z|ψ⟩'],
  '6-10': ['Measurement Error Standard Deviation: σ = √(⟨O²⟩ - ⟨O⟩²) / √N_shots'],
  '6-11': ['Empirical Shot Frequency: fₖ = count(k) / N_shots ≈ P(k)'],
  '6-12': ['Measurement Probability Vector: P = [f₀₀, f₀₁, f₁₀, f₁₁]'],
  '6-13': ['Born Probability Distribution: P(x) = |c_x|²'],
  '6-14': ['Ensemble Statistical Average: ⟨A⟩ = lim_{N→∞} (1/N) ∑ᵢ aᵢ'],
  '6-15': ['Lüders State Collapse Rule: ρ_after = (Pₘ ρ Pₘ) / Tr(Pₘ ρ)'],

  // ── Module 7: Qiskit Basics ──
  '7-1': ['Qiskit SDK Framework: QuantumCircuit, Sampler, Estimator'],
  '7-2': ['QuantumCircuit Object: qc = QuantumCircuit(num_qubits, num_clbits)'],
  '7-3': ['Quantum Register Class: qr = QuantumRegister(size, name="q")'],
  '7-4': ['Classical Register Class: cr = ClassicalRegister(size, name="c")'],
  '7-5': ['Gate Appends: qc.h(0);  qc.cx(0, 1);  qc.rz(theta, 0)'],
  '7-6': ['Qubit Measurement: qc.measure(qubit, clbit) or qc.measure_all()'],
  '7-7': ['Circuit Rendering: text_diagram = qc.draw(output="text")'],
  '7-8': ['Statevector Class: sv = Statevector.from_instruction(qc)'],
  '7-9': ['Aer Simulator Backend: backend = AerSimulator()'],
  '7-10': ['Execution Job: job = backend.run(qc, shots=1024)'],
  '7-11': ['Shot Convergence Error: Error ∝ 1 / √N_shots'],
  '7-12': ['Result Counts Dictionary: counts = result.get_counts() → {"00": 512, "11": 512}'],
  '7-13': ['Probability Array: probs = Statevector(qc).probabilities()'],
  '7-14': ['Hardware Backend Selection: backend = service.backend("ibm_brisbane")'],
  '7-15': ['Transpilation Pipeline: transpiled_qc = transpile(qc, backend, optimization_level=3)'],
  '7-16': ['Primitive Execution: sampler = Sampler(backend); job = sampler.run([qc])'],
  '7-17': ['Result Parsing: counts = job.result()[0].data.meas.get_counts()'],
  '7-18': ['QPY Circuit Export: qpy.dump(qc, file_stream)'],
  '7-19': ['QPY Circuit Import: qc = qpy.load(file_stream)[0]'],
  '7-20': ['Algorithm Fidelity Metric: F = |⟨ψ_target|ψ_actual⟩|²'],

  // ── Module 8: Quantum SDKs (Qiskit, PennyLane, Cirq) ──
  '8-1': ['Qiskit Core Stack: Circuit + Transpiler + Primitives + Providers'],
  '8-2': ['Qiskit Bell State Workflow: qc.h(0); qc.cx(0,1); qc.measure_all()'],
  '8-3': ['Qiskit Aer Execution: AerSimulator().run(transpile(qc, backend)).result()'],
  '8-4': ['Qiskit Primitives V2: SamplerV2().run([qc])'],
  '8-5': ['PennyLane QNode Decorator: @qml.qnode(dev)'],
  '8-6': ['PennyLane Differentiable Circuit Execution'],
  '8-7': ['PennyLane Gates: qml.Hadamard(wires=0),  qml.CNOT(wires=[0,1])'],
  '8-8': ['Automatic Differentiation: gradient_fn = qml.grad(cost_function)'],
  '8-9': ['Google Cirq Framework: circuit = cirq.Circuit()'],
  '8-10': ['Cirq LineQubit Allocation: q0, q1 = cirq.LineQubit.range(2)'],
  '8-11': ['Cirq Operations: cirq.H(q0),  cirq.CNOT(q0, q1)'],
  '8-12': ['Cirq Simulator: result = cirq.Simulator().simulate(circuit)'],
  '8-13': ['SDK Comparison: Qiskit (Hardware/Algorithms) vs PennyLane (QML) vs Cirq (Physics)'],
  '8-14': ['Framework Selection Criteria: Hardware compatibility vs Differentiability'],
  '8-15': ['Cirq Density Matrix Simulator: cirq.DensityMatrixSimulator()'],

  // ── Module 9: Quantum Algorithms - Part 1 ──
  '9-1': ['Deutsch Algorithm Advantage: Evaluates f(0) ⊕ f(1) in 1 query vs 2 classical'],
  '9-2': ['Deutsch Problem Definition: Function f: {0,1} → {0,1} (Constant vs Balanced)'],
  '9-3': ['Classical Query Lower Bound: 2 queries required'],
  '9-4': ['Deutsch Quantum Transformation: H^⊗2 U_f (H ⊗ H) |01⟩'],
  '9-5': ['Deutsch Oracle Matrix: U_f |x, y⟩ = |x, y ⊕ f(x)⟩'],
  '9-6': ['Deutsch Circuit: (H ⊗ H) → U_f → (H ⊗ I) → Measure q0'],
  '9-7': ['Deutsch Outcome: q0 = 0 (Constant) vs q0 = 1 (Balanced)'],
  '9-8': ['Deutsch-Jozsa Algorithm: Function f: {0,1}ⁿ → {0,1} (1 query vs 2ⁿ⁻¹+1 classical)'],
  '9-9': ['Constant Function Condition: f(x) = c for all x ∈ {0,1}ⁿ'],
  '9-10': ['Balanced Function Condition: ∑_x f(x) = 2ⁿ⁻¹'],
  '9-11': ['DJ Oracle Phase Kickback: U_f |x⟩|−⟩ = (-1)^(f(x)) |x⟩|−⟩'],
  '9-12': ['DJ Final State: (1/2ⁿ/²) ∑_x (-1)^(f(x)) |x⟩ → H^⊗n → |00...0⟩ iff constant'],
  '9-13': ['DJ Speedup: Exponential O(1) quantum queries vs O(2ⁿ⁻¹) classical deterministic'],
  '9-14': ['Bernstein-Vazirani Algorithm: Find hidden s ∈ {0,1}ⁿ where f(x) = s · x (mod 2)'],
  '9-15': ['BV Hidden String Oracle: f(x) = s₁x₁ ⊕ s₂x₂ ⊕ ... ⊕ sₙxₙ'],
  '9-16': ['BV Oracle Transformation: U_f |x⟩|−⟩ = (-1)^(s · x) |x⟩|−⟩'],
  '9-17': ['BV Output State: H^⊗n U_f H^⊗n |0ⁿ⟩|1⟩ = |s⟩|1⟩ (Finds s in 1 query)'],
  '9-18': ["Simon's Algorithm: Find hidden period s ∈ {0,1}ⁿ where f(x)=f(y) ⟺ x⊕y ∈ {0ⁿ, s}"],
  '9-19': ['Hidden Period Invariance: f(x ⊕ s) = f(x)'],
  '9-20': ["Simon's Linear Equation Sampling: Sample y such that s · y = 0 (mod 2)"],
  '9-21': ["Simon's Advantage: O(n) quantum queries vs O(2ⁿ/²) classical queries"],
  '9-22': ['Quantum Teleportation: Transmit |ψ⟩ = α|0⟩ + β|1⟩ via 1 EPR pair + 2 classical bits'],
  '9-23': ['3-Qubit Teleportation Initial State: |ψ⟩_A ⊗ (|00⟩+|11⟩)_AB / √2'],
  '9-24': ['Shared EPR Entanglement Resource: |Φ⁺⟩ = (|00⟩+|11⟩)/√2'],
  '9-25': ['Bell Basis Measurement on Alice System (q_src, q_A)'],
  '9-26': ['Classical Transmission: Send 2 classical bits (b₁, b₂) to Bob'],
  '9-27': ['Bob State Reconstruction Correction: Z^(b₁) X^(b₂) |ψ_Bob⟩ = |ψ⟩'],
  '9-28': ['Superdense Coding: Transmit 2 classical bits using 1 qubit + 1 shared EPR pair'],
  '9-29': ['Superdense Encoding Operations: 00→I, 01→X, 10→Z, 11→XZ'],
  '9-30': ['Superdense Decoding: Apply CNOT then H, measure both qubits to decode 2 bits'],
  '9-31': ['Phase Kickback Verification: U_f |x⟩(|0⟩-|1⟩)/√2 = (-1)^(f(x)) |x⟩(|0⟩-|1⟩)/√2'],

  // ── Module 10: Quantum Algorithms - Part 2 ──
  '10-1': ["Grover's Search Algorithm: O(√N) quantum queries vs O(N) classical queries"],
  '10-2': ['Unstructured Database Search: N = 2ⁿ items with target ω (f(ω) = 1)'],
  '10-3': ['Classical Unstructured Search Average: N/2 queries'],
  '10-4': ['Grover Phase Oracle: U_ω = I - 2|ω⟩⟨ω|,  U_ω|x⟩ = (-1)^(f(x))|x⟩'],
  '10-5': ['Phase Oracle Matrix: diag(1, ..., -1, ..., 1)'],
  '10-6': ['Grover Diffusion Operator: D = 2|s⟩⟨s| - I where |s⟩ = (1/√N) ∑ |x⟩'],
  '10-7': ['Amplitude Amplification Iteration: G = D U_ω (Rotation angle θ ≈ 2/√N)'],
  '10-8': ['Optimal Grover Iterations: R ≈ (π/4) √N'],
  '10-9': ['2-Qubit Grover (N=4): Target found in R = 1 iteration (100% probability)'],
  '10-10': ['3-Qubit Grover (N=8): Target found in R = 2 iterations'],
  '10-11': ['Grover Complexity Bound: Quadratic Speedup O(√N) (Proven optimal)'],
  '10-12': ['Quantum Fourier Transform: |j⟩ → (1/√N) ∑_{k=0}^{N-1} e^(2πi j k / N) |k⟩'],
  '10-13': ['QFT Basis Change: Computational Z-basis → Frequency/Phase domain'],
  '10-14': ['QFT Matrix Element: F_{j,k} = (1/√N) ω^{j k} where ω = e^(2πi / N)'],
  '10-15': ['QFT Circuit Composition: H gates and Controlled Phase Rotations R_k'],
  '10-16': ['Inverse QFT Transformation: QFT† QFT = I'],
  '10-17': ['QFT Applications: Phase Estimation, Period Finding, Shor Algorithm'],
  '10-18': ["Shor's Factoring Algorithm: Prime factoring N in polynomial time O((log N)³)"],
  '10-19': ['Prime Factoring Problem: Given N = p × q, find p and q'],
  '10-20': ['Modular Period Finding: Order r of aʳ ≡ 1 (mod N)'],
  '10-21': ['Modular Arithmetic Factors: gcd(a^(r/2) ± 1, N) yields factors p, q'],
  '10-22': ['Phase Estimation Peak: Measures phase ϕ = s / r'],
  '10-23': ['RSA Cryptographic Breakdown: Factoring 2048-bit RSA keys in polynomial time'],

  // ── Module 11: Quantum Machine Learning ──
  '11-1': ['QML Feature Space Advantage: Processing in 2ⁿ dimensional Hilbert Space'],
  '11-2': ['Quantum Data Encoding: |x⟩ = U(x)|0⟩'],
  '11-3': ['Classical Vector Mapping: x ∈ ℝᵈ → |ψ(x)⟩ ∈ ℂ²ⁿ'],
  '11-4': ['Basis Encoding Scheme: x = 101₂ → |101⟩'],
  '11-5': ['Angle Encoding Scheme: |ψ(x)⟩ = ⨂_i (cos(x_i)|0⟩ + sin(x_i)|1⟩)'],
  '11-6': ['Amplitude Encoding Scheme: |ψ(x)⟩ = ∑_{i=0}^{2ⁿ-1} x_i |i⟩ where ||x|| = 1'],
  '11-7': ['Parameterized Quantum Circuit: U(θ) = ∏_k U_k(θ_k)'],
  '11-8': ['Variational Hybrid Loop: Quantum State Evaluation → Classical Parameter Update'],
  '11-9': ['Quantum Feature Map Function: Φ: x → |Ψ(x)⟩'],
  '11-10': ['Quantum Kernel Matrix Element: K(x_i, x_j) = |⟨Ψ(x_i)|Ψ(x_j)⟩|²'],
  '11-11': ['Variational Quantum Classifier: y(x, θ) = sgn(⟨Ψ(x)| U†(θ) Z U(θ) |Ψ(x)⟩)'],
  '11-12': ['Hybrid QML Frameworks: PyTorch / TensorFlow + PennyLane / Qiskit'],
  '11-13': ['Loss Function Definition: L(θ) = ∑_i (y_i - f(x_i; θ))²'],
  '11-14': ['Gradient Optimization Update: θ_{t+1} = θ_t - η ∇L(θ_t)'],
  '11-15': ['Parameter Shift Rule Gradient: ∂⟨O⟩/∂θ_i = (⟨O⟩_{θ_i + π/2} - ⟨O⟩_{θ_i - π/2}) / 2'],
  '11-16': ['Barren Plateau Phenomenon: Var[∂L/∂θ_i] ∈ O(2⁻ⁿ) for random circuits'],
  '11-17': ['QML Expressibility vs Trainability Trade-off'],

  // ── Module 12: Quantum Noise & Decoherence ──
  '12-1': ['NISQ Era Reality: Physical qubits interact with noisy environment'],
  '12-2': ['Physical Hardware Imperfections: Gate errors, thermal noise, readout error'],
  '12-3': ['Kraus Operator Noise Model: ρ → E(ρ) = ∑_k E_k ρ E_k† where ∑_k E_k† E_k = I'],
  '12-4': ['Decoherence Process: Loss of quantum coherence (off-diagonal density terms)'],
  '12-5': ['Pure Dephasing T₂: Off-diagonal term ρ₀₁(t) = ρ₀₁(0) e^(-t/T₂)'],
  '12-6': ['Energy Relaxation T₁: Excited State |1⟩ → Ground State |0⟩ decay e^(-t/T₁)'],
  '12-7': ['Bit Flip Channel Kraus Operators: E₀ = √(1-p) I,  E₁ = √p X'],
  '12-8': ['Phase Flip Channel Kraus Operators: E₀ = √(1-p) I,  E₁ = √p Z'],
  '12-9': ['Bit-Phase Flip Channel Kraus Operators: E₀ = √(1-p) I,  E₁ = √p Y'],
  '12-10': ['Depolarizing Channel: E(ρ) = (1-p)ρ + (p/3)(XρX + YρY + ZρZ)'],
  '12-11': ['Readout Error Matrix: M = [[P(0|0), P(0|1)], [P(1|0), P(1|1)]]'],
  '12-12': ['Qiskit Noise Model Class: qiskit_aer.noise.NoiseModel()'],
  '12-13': ['Noisy Simulation Execution: AerSimulator(noise_model=noise_model)'],
  '12-14': ['Gate Error Rate Metric: ε = 1 - F (1-qubit ~10⁻⁴, 2-qubit ~10⁻²)'],
  '12-15': ['Quantum State Fidelity: F(ρ, σ) = (Tr √(√ρ σ √ρ))²'],
  '12-16': ['NISQ Constraints: 50-1000 noisy qubits without full QEC'],

  // ── Module 13: Quantum Error Correction ──
  '13-1': ['Logical Qubit Encoding: |ψ_L⟩ = α|0_L⟩ + β|1_L⟩ using n physical qubits'],
  '13-2': ['Classical 3-Bit Repetition Code: 0 → 000,  1 → 111 (Majority Vote)'],
  '13-3': ['Obstacles to QEC: No-Cloning Theorem, Continuous Errors, Measurement Collapse'],
  '13-4': ['Bit Flip Code Encoding: |0_L⟩ = |000⟩,  |1_L⟩ = |111⟩ (Corrects 1 bit flip)'],
  '13-5': ['Phase Flip Code Encoding: |0_L⟩ = |+++⟩,  |1_L⟩ = |---⟩'],
  '13-6': ['3-Qubit Repetition Code Stabilizers: Z₁ Z₂ and Z₂ Z₃'],
  '13-7': ['Ancilla Qubit Non-Destructive Syndrome Extraction'],
  '13-8': ['Stabilizer Measurement: S_i |ψ_L⟩ = (+1)|ψ_L⟩,  S_i E_k |ψ_L⟩ = (-1) E_k |ψ_L⟩'],
  '13-9': ['Error Syndrome Decoding: Map syndrome vector s to error operator E'],
  '13-10': ['Shor 9-Qubit Code: Protects against arbitrary single-qubit error (X, Y, or Z)'],
  '13-11': ['Steane 7-Qubit CSS Code: Encodes 1 logical qubit into 7 physical qubits'],
  '13-12': ['Surface Code Lattice: X-check & Z-check plaquettes (Threshold ~1%)'],
  '13-13': ['Fault-Tolerant Threshold Theorem: Error rate p < p_th ⇒ Arbitrary length QC'],
  '13-14': ['Lattice Surgery & Logical Qubit Braiding'],

  // ── Module 14: Circuit Optimization & Transpilation ──
  '14-1': ['Transpilation Goal: Minimize 2-Qubit Gate Count & Circuit Depth'],
  '14-2': ['Native Gate Count Metric: N_native'],
  '14-3': ['Critical Path Depth Metric: d_critical'],
  '14-4': ['Two-Qubit Gate Error Cost: CNOT / ECR / CZ error rate ~10x higher than 1-qubit'],
  '14-5': ['Gate Cancellation Rule: U U† = I,  X X = I,  H H = I,  Z Z = I'],
  '14-6': ['Commutation Relations: Rz(θ) CZ = CZ Rz(θ)'],
  '14-7': ['K-Qubit Unitary Synthesis & Resynthesis'],
  '14-8': ['Euler Angle Gate Decomposition: U3(θ, ϕ, λ) = Rz(ϕ) Ry(θ) Rz(λ)'],
  '14-9': ['Qiskit Transpiler Manager: transpile(qc, backend, optimization_level=0..3)'],
  '14-10': ['Hardware Coupling Map Graph: G = (V, E) of physical qubit connectivity'],
  '14-11': ['SWAP Insertion Routing: Inserting SWAP gates to satisfy physical coupling'],
  '14-12': ['PassManager Pipeline: PassManager([Unroller(), CXCancellation()])'],
  '14-13': ['Noise-Aware Layout Mapping: Map active qubits to physical qubits with lowest error'],
  '14-14': ['Fault-Tolerant Resource Estimation: Physical Qubits & Runtime Calculation'],
  '14-15': ['AI Compiler Optimization for Quantum Circuits'],

  // ── Module 15: Quantum Hardware & Physical Implementations ──
  '15-1': ['Physical Qubit Technologies: Superconducting, Trapped Ion, Photonic, Neutral Atom'],
  '15-2': ['Superconducting Transmon Qubit: Josephson Junction LC Nonlinear Resonator'],
  '15-3': ['Trapped Ion Qubit: Laser-Controlled ⁴⁰Ca⁺ or ¹⁷¹Yb⁺ Ion Energy Levels in Paul Trap'],
  '15-4': ['Photonic QC: Single Photons, Beam Splitters, Phase Shifters, Photodetectors'],
  '15-5': ['Neutral Atom Array: Optical Tweezers Array with Rydberg State Interaction'],
  '15-6': ['Topological QC: Non-Abelian Anyons (Majorana Zero Modes)'],
  '15-7': ['IBM Quantum Processors: Eagle (127q), Osprey (433q), Condor (1121q), Heron (133q)'],
  '15-8': ['Single Qubit Gate Fidelity: F_1q > 99.9%'],
  '15-9': ['Two Qubit Gate Fidelity: F_2q > 99.5%'],
  '15-10': ['Coherence Times: Relaxation T₁ (~100-300 μs), Dephasing T₂ (~100-300 μs)'],
  '15-11': ['Qubit Coupling Topology: Heavy-Hex, Grid, All-to-All Ion Connectivity'],
  '15-12': ['Hardware Constraints: Cross-talk, Cryogenic Thermal Fluctuations (mK), Laser Jitter'],
  '15-13': ['Cloud QPU Execution: Submitting Jobs via IBM Quantum / AWS Braket API'],
  '15-14': ['Job Queue Scheduling & Latency Monitoring'],
  '15-15': ['NISQ Era Capabilities: Noisy 50-1000 qubit executions'],
  '15-16': ['Fault Tolerance Target: Logical Qubits with Surface Code QEC'],
  '15-17': ['Quantum Advantage Demonstration: Quantum task outperforms classical supercomputers'],
  '15-18': ['Core Applications: Quantum Chemistry, Materials Science, Optimization'],
  '15-19': ['Industry Impact: Battery Design, Catalyst Synthesis, Risk Analysis'],
  '20-20': ['Future Roadmap: Million-Qubit Fault-Tolerant Quantum Supercomputers'],
  '15-20': ['Future Roadmap: Million-Qubit Fault-Tolerant Quantum Supercomputers'],

  // ── Module 16: Hands-On Projects ──
  '16-1': ['Bell State Project: Construct & Measure all 4 Bell States |Φ⁺⟩, |Φ⁻⟩, |Ψ⁺⟩, |Ψ⁻⟩'],
  '16-2': ['Teleportation Project: End-to-End Quantum Teleportation Protocol Implementation'],
  '16-3': ['Grover Project: 3-Qubit Grover Search with Custom Oracle Construction'],
  '16-4': ['Classifier Project: Quantum Variational Classifier on Dataset'],
  '16-5': ['Optimization Project: QAOA Max-Cut Graph Partitioning Solver'],
  '16-6': ['Noise Analysis: Comparing Ideal vs Noisy Aer Simulation Performance'],
  '16-7': ['Project Theory: Theoretical Analysis & Mathematical Validation'],
  '16-8': ['Circuit Design: Modular Circuit Construction & Subroutine Reuse'],
  '16-9': ['Qiskit Project: Production Qiskit Scripting & Transpiler Pipeline'],
  '16-10': ['Results Analysis: Plotting Histograms, State Tomography & Confidence Bounds'],
  '16-11': ['Documentation: Technical Report & Jupyter Notebook Documentation'],
  '16-12': ['Capstone: End-to-End Portfolio Capstone Project'],

  // ── Module 17: Career Roadmap ──
  '17-1': ['Research Landscape: Academic & Industrial Quantum Information Science'],
  '17-2': ['Industry Ecosystem: Hardware Vendors, Software Startups, Enterprise Users'],
  '17-3': ['Quantum Enterprises: IBM Quantum, Google Quantum AI, Rigetti, IonQ, Quantinuum'],
  '17-4': ['Software Career Path: SDK Developer, Transpiler Architect, Cloud Engineer'],
  '17-5': ['Researcher Career Path: Information Theorist, Physicist, Algorithm Developer'],
  '17-6': ['QML Career Path: Quantum Machine Learning Scientist & Hybrid AI Developer'],
  '17-7': ['Hardware Career Path: Cryogenic Engineer, RF Engineer, Quantum Physicist'],
  '17-8': ['Literature Analysis: Navigating arXiv (quant-ph) & Quantum Journals'],
  '17-9': ['Open Source Contribution: Qiskit, PennyLane, Cirq GitHub Repositories'],
  '17-10': ['Hackathons: IBM Qiskit Fall Fest, MIT iqHack'],
  '17-11': ['Professional Credentials: IBM Certified Associate Developer - Quantum'],
  '17-12': ['Portfolio Building: GitHub Repositories & Interactive Quantum Demos'],
  '17-13': ['Internships & Fellowships: Research Fellowships & Industry Internships'],
  '17-14': ['Interview Prep: Core Linear Algebra & Qiskit Coding Assessment'],

  // ── Module 18: Quantum Cryptography ──
  '18-1': ['Quantum Cryptography Principle: Security based on Laws of Physics'],
  '18-2': ['Classical Public-Key Cryptography: RSA, ECC Computational Hardness'],
  '18-3': ['RSA Threat: Factoring Composite N = p × q in Polynomial Time by Shor'],
  '18-4': ['Cryptographic Threat Model: Harvest Now, Decrypt Later (HNDL)'],
  '18-5': ['Quantum Key Distribution: Secure Symmetric Key Exchange over Quantum Channel'],
  '18-6': ['BB84 Protocol States: 4 States {|0⟩, |1⟩, |+⟩, |−⟩} in 2 Bases {Z, X}'],
  '18-7': ['BB84 Protocol Sequence: Alice Prep → Channel → Bob Basis Measure → Sifting'],
  '18-8': ['E91 Protocol: Entanglement-Based QKD using EPR pairs & Bell Inequality'],
  '18-9': ['No-Cloning Theorem Proof: Unknown |ψ⟩ cannot be cloned (U|ψ0⟩ ≠ |ψψ⟩)'],
  '18-10': ['Eavesdropping Detection: Eve\'s measurement induces QBER > 11% error threshold'],
  '18-11': ['Post-Quantum Cryptography: NIST PQC Standards (ML-KEM, ML-DSA)'],
  '18-12': ['Lattice Cryptography: Learning With Errors (LWE) Hardness'],
  '18-13': ['Quantum Digital Signatures & Authentication Protocols'],
  '18-14': ['Quantum Random Number Generation: True Hardware Randomness from Collapse'],

  // ── Module 19: Quantum Optimization ──
  '19-1': ['Quantum Optimization: Combinatorial Optimization using Variational Algorithms'],
  '19-2': ['QUBO Model: Min xᵀ Q x where x ∈ {0,1}ⁿ'],
  '19-3': ['Ising Model Spin Hamiltonian: H = ∑_i h_i Z_i + ∑_{i<j} J_{ij} Z_i Z_j'],
  '19-4': ['QAOA Algorithm: Quantum Approximate Optimization Algorithm'],
  '19-5': ['QAOA Trial State: |γ, β⟩ = ∏_{k=1}^p e^(-i β_k H_M) e^(-i γ_k H_C) |+⟩^⊗n'],
  '19-6': ['Cost Hamiltonian Encoding: H_C |x⟩ = C(x)|x⟩'],
  '19-7': ['Mixer Hamiltonian Driver: H_M = ∑_{i=1}^n X_i'],
  '19-8': ['QAOA Parameters: Variational Angles γ_k ∈ [0, 2π) and β_k ∈ [0, π)'],
  '19-9': ['Classical Optimizer Update: COBYLA / SPSA minimizing ⟨H_C⟩'],
  '19-10': ['Variational Quantum Eigensolver: Ground state energy E₀ ≤ ⟨ψ(θ)|H|ψ(θ)⟩'],
  '19-11': ['Ansatz Design: Hardware-efficient, UCCSD, RealAmplitudes Circuits'],
  '19-12': ['MaxCut QAOA Hamiltonian: H_C = ∑_{(i,j)∈E} (I - Z_i Z_j)/2'],
  '19-13': ['Quantum Annealing Adiabatic Evolution: H(t) = (1 - t/T) H_init + (t/T) H_final'],

  // ── Module 20: Quantum Networks & Cloud ──
  '20-1': ['Quantum Networking: Interconnecting Quantum Processors via Photons'],
  '20-2': ['Quantum Internet: Long-Distance Entanglement Distribution & Teleportation'],
  '20-3': ['Network Layer Architecture: Physical, Link, Network, Application Layers'],
  '20-4': ['Quantum Repeaters: Overcoming Photonic Loss via Entanglement Swapping'],
  '20-5': ['Entanglement Distribution: Generating Shared Bell Pairs between Distant Nodes'],
  '20-6': ['Entanglement Swapping Protocol: Teleporting Entanglement across Nodes'],
  '20-7': ['Network Protocols: Memory Management & Link Layer Signalling'],
  '20-8': ['Distributed Quantum Computing: Linking small QPUs into large virtual QPU'],
  '20-9': ['Quantum Cloud Access: Remote Quantum Hardware Access via APIs'],
  '20-10': ['QC as a Service Platforms: IBM Quantum, AWS Braket, Azure Quantum'],
  '20-11': ['Network Applications: Clock Synchronization, Blind QC, Distributed Sensing'],
  '20-12': ['Network Simulators: SimulaQron & NetSquid Frameworks'],
  '20-13': ['Network Security: QKD Encryption & Quantum-Safe Cloud Execution'],
  '20-14': ['Global Satellite QKD Links & Fault-Tolerant Quantum Internet'],

  // ── Module 21: Quantum Applications & Industry ──
  '21-1': ['Near-Term NISQ vs Long-Term Fault-Tolerant Application Domains'],
  '21-2': ['Healthcare Applications: Protein Folding & Molecular Binding Simulation'],
  '21-3': ['Drug Discovery: Simulating Electronic Structure of Active Compounds'],
  '21-4': ['Finance Applications: Portfolio Risk Optimization & Option Pricing'],
  '21-5': ['Cybersecurity Applications: Migration to PQC & Enterprise QKD'],
  '21-6': ['Logistics Applications: Vehicle Routing & Supply Chain via QAOA'],
  '21-7': ['Energy & Materials: Nitrogen Fixation Catalyst Synthesis'],
  '21-8': ['QML Industry Applications: Anomaly Detection & High-Dim Classification'],
  '21-9': ['Quantum Sensing: NV-Center Diamond Magnetometry & Atomic Clocks'],
  '21-10': ['Quantum Metrology Precision: Heisenberg Limit Δθ ∝ 1/N vs Shot Noise 1/√N'],
  '21-11': ['Industry Ecosystem Map: Hardware, Software, Consultancy & Enterprise'],
  '21-12': ['Career Pathways & Educational Preparation'],
  '21-13': ['Open Source Ecosystem: Qiskit Advocate Program & Unitary Fund'],
  '21-14': ['Industry Technical Credentials & Certifications'],
  '21-15': ['Future Roadmap: 2026-2035 Technological Milestones'],
  '21-16': ['Interview Technical Preparation & Algorithm Whiteboarding'],

  // ── Module 22: Quantum Research & Methodology ──
  '22-1': ['Core Research Areas: Algorithms, QEC, QML, Hardware, Information Theory'],
  '22-2': ['Open Research Problems in NISQ Mitigation & Fault Tolerance'],
  '22-3': ['Analyzing Scientific Literature: Reading arXiv (quant-ph) & Journals'],
  '22-4': ['Literature Review: Prior Art Mapping & Baseline Benchmarking'],
  '22-5': ['Scientific Research Methodology: Simulation & Hardware Validation'],
  '22-6': ['Reproducing Research: Replicating Published Quantum Benchmark Results'],
  '22-7': ['Algorithm Research: Designing Novel Oracles & Query Complexity Bounds'],
  '22-8': ['QML Research: Expressibility & Barren Plateau Mitigation'],
  '22-9': ['Open Source Contributions to Qiskit & PennyLane'],
  '22-10': ['Unitary Synthesis & Circuit Optimization Research'],
  '22-11': ['Quantum Benchmarking Metrics: Randomized Benchmarking & Quantum Volume'],
  '22-12': ['Publishing Manuscripts: LaTeX Preparation & Peer Review'],
  '22-13': ['Scientific Communication & Presentation'],
  '22-14': ['Research Reproducibility: Code Packaging & Open Seeded Pipelines'],
  '22-15': ['Designing Independent Quantum Research Projects'],

  // ── Module 23: Quantum Cloud & Hardware Access ──
  '23-1': ['Cloud Quantum Computing Architecture'],
  '23-2': ['Remote QPU Access: API Authentication & Execution Queue Management'],
  '23-3': ['IBM Quantum Service: IBM Cloud & Qiskit Runtime Primitives'],
  '23-4': ['IBM Quantum Composer: Drag-and-Drop Builder & OpenQASM 3.0'],
  '23-5': ['Job Lifecycle: Created → Queued → Running → Completed'],
  '23-6': ['Hardware Results Parsing & Readout Error Mitigation'],
  '23-7': ['PennyLane Hardware Execution: Remote QNode Execution on IBM QPUs'],
  '23-8': ['Amazon Braket: IonQ Trapped Ion & Rigetti Superconducting Access'],
  '23-9': ['Azure Quantum: Quantinuum & IonQ Remote Access'],
  '23-10': ['Cloud Platform Comparison: Pricing, Latency, Native Gates, Calibration'],

  // ── Module 24: Quantum Simulation & Chemistry ──
  '24-1': ['Feynman Simulation Principle: "Simulate physics with quantum computers"'],
  '24-2': ['Digital Quantum Simulation of Physical Systems'],
  '24-3': ['Hamiltonian Time Evolution Operator: U(t) = e^(-i H t / ħ)'],
  '24-4': ['Simulating Quantum Dynamics of Molecular Systems'],
  '24-5': ['Electronic Structure Problem: H |Ψ⟩ = E |Ψ⟩'],
  '24-6': ['Molecular Energy Curves: H₂, LiH, H₂O Ground State Simulation'],
  '24-7': ['Jordan-Wigner Transformation: Mapping Fermionic Operators to Pauli Operators'],
  '24-8': ['Suzuki-Trotter Decomposition: e^(-i (A+B) t) ≈ (e^(-i A t/n) e^(-i B t/n))^n'],
  '24-9': ['Spin Chain Simulation: Heisenberg & XXZ Model Dynamics'],
  '24-10': ['Transverse Field Ising Model (TFIM) Phase Transitions'],
  '24-11': ['Strongly Correlated Quantum Many-Body System Simulation'],
  '24-12': ['Benchmarking Ground State Accuracy: Quantum VQE vs Classical FCI / CCSD(T)'],
};

// Helper getter function for topic formulas with exact lookup and robust keyword fallback
export function getTopicFormula(topic, moduleId) {
  if (!topic) return ['|ψ⟩ = α|0⟩ + β|1⟩', '|α|² + |β|² = 1'];

  // 1. Direct 1-to-1 lookup by topic ID
  if (TOPIC_FORMULAS[topic.id]) {
    return TOPIC_FORMULAS[topic.id];
  }

  // 2. Keyword fallback matching based on topic title
  const t = (topic.t || '').toLowerCase();

  if (t.includes('classical') || t.includes('bit')) {
    return ['Bit Domain: b ∈ {0, 1}', 'Boolean Logic Function: f: {0,1}ⁿ → {0,1}'];
  }
  if (t.includes('binary')) {
    return ['Positional Binary Value: N = ∑ (bᵢ × 2ⁱ)', 'Example: 101₂ = 1×4 + 0×2 + 1×1 = 5₁₀'];
  }
  if (t.includes('matrix') || t.includes('matrices')) {
    return ['Matrix Transformation: A|v⟩ = |w⟩', 'Product: (AB)ᵢⱼ = ∑ₖ Aᵢₖ Bₖⱼ'];
  }
  if (t.includes('vector') || t.includes('linear algebra')) {
    return ['State Vector: |v⟩ = [v₁, v₂, ..., vₙ]ᵀ', 'Norm: ||v|| = √(∑ |vᵢ|²) = 1'];
  }
  if (t.includes('bra') || t.includes('ket') || t.includes('dirac')) {
    return ['Ket Vector: |ψ⟩ = [c₀, c₁]ᵀ', 'Bra Vector: ⟨ψ| = [c₀*, c₁*]', 'Inner Product: ⟨ψ|ϕ⟩ = ∑ aᵢ* bᵢ'];
  }
  if (t.includes('hadamard') || t.includes('h gate')) {
    return ['Hadamard Gate: H = (1/√2) [[1, 1], [1, -1]]', 'H|0⟩ = |+⟩,  H|1⟩ = |−⟩'];
  }
  if (t.includes('x gate') || t.includes('not gate')) {
    return ['Pauli-X Gate: X = [[0, 1], [1, 0]]', 'X|0⟩ = |1⟩,  X|1⟩ = |0⟩'];
  }
  if (t.includes('y gate')) {
    return ['Pauli-Y Gate: Y = [[0, -i], [i, 0]]', 'Y|0⟩ = i|1⟩,  Y|1⟩ = -i|0⟩'];
  }
  if (t.includes('z gate')) {
    return ['Pauli-Z Gate: Z = [[1, 0], [0, -1]]', 'Z|0⟩ = |0⟩,  Z|1⟩ = -|1⟩'];
  }
  if (t.includes('bloch')) {
    return ['Bloch Sphere State:', '|ψ⟩ = cos(θ/2)|0⟩ + e^(iϕ) sin(θ/2)|1⟩', 'Bloch Vector: r⃗ = (sin θ cos ϕ, sin θ sin ϕ, cos θ)ᵀ'];
  }
  if (t.includes('bell') || t.includes('entangle')) {
    return ['Bell State: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2', 'Entangled Condition: |Ψ⟩ ≠ |ψ₁⟩ ⊗ |ψ₂⟩'];
  }
  if (t.includes('cnot') || t.includes('controlled')) {
    return ['CNOT Gate: CNOT |x, y⟩ = |x, x ⊕ y⟩', 'Matrix: |0⟩⟨0| ⊗ I + |1⟩⟨1| ⊗ X'];
  }
  if (t.includes('grover')) {
    return ['Grover Oracle & Diffusion: G = (2|s⟩⟨s| - I) U_ω', 'Optimal Iterations: R ≈ (π/4) √N'];
  }
  if (t.includes('fourier') || t.includes('qft')) {
    return ['Quantum Fourier Transform:', '|j⟩ → (1/√N) ∑ₖ e^(2πi j k / N) |k⟩'];
  }
  if (t.includes('shor')) {
    return ["Shor's Period Finding: aʳ ≡ 1 (mod N)", 'Order r computed via Quantum Phase Estimation'];
  }
  if (t.includes('vqe') || t.includes('variational')) {
    return ['Variational Ground State Minimum:', 'E₀ ≤ ⟨ψ(θ)| H |ψ(θ)⟩'];
  }
  if (t.includes('qaoa')) {
    return ['QAOA Trial State:', '|γ, β⟩ = e^(-i β H_M) e^(-i γ H_C) |+⟩^⊗n'];
  }
  if (t.includes('noise') || t.includes('decoher')) {
    return ['Density Operator Noise Evolution:', 'ρ → ∑ₖ Eₖ ρ Eₖ† where ∑ₖ Eₖ† Eₖ = I'];
  }

  // 3. Fallback for unlisted custom topics
  return [
    `Module ${moduleId || 1} — ${topic.t}`,
    `State Evolution: |ψ_out⟩ = U_{${(topic.t || 'topic').replace(/[^a-zA-Z0-9]/g, '')}} |ψ_in⟩`
  ];
}
