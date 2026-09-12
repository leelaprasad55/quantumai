import math
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def _run(qc, name, shots, explanation):
    simulator = AerSimulator(); counts = dict(simulator.run(transpile(qc, simulator), shots=shots).result().get_counts())
    return {"success": True, "algorithm": name, "shots": shots, "counts": counts, "circuit": str(qc), "explanation": explanation}

def run_bell(shots=1024):
    qc = QuantumCircuit(2, 2); qc.h(0); qc.cx(0, 1); qc.measure([0, 1], [0, 1]); return _run(qc, "bell", shots, "Creates the maximally entangled Bell state.")
def run_deutsch_jozsa(shots=1024):
    qc = QuantumCircuit(2, 1); qc.x(1); qc.h([0, 1]); qc.cx(0, 1); qc.h(0); qc.measure(0, 0); return _run(qc, "deutsch_jozsa", shots, "A balanced one-bit oracle produces measurement 1.")
def run_bernstein_vazirani(shots=1024):
    qc = QuantumCircuit(3, 2); qc.x(2); qc.h([0, 1, 2]); qc.cx(0, 2); qc.cx(1, 2); qc.h([0, 1]); qc.measure([0, 1], [0, 1]); return _run(qc, "bernstein_vazirani", shots, "Recovers hidden string 11 in one oracle query.")
def run_grover(shots=1024):
    qc = QuantumCircuit(2, 2); qc.h([0, 1]); qc.cz(0, 1); qc.h([0, 1]); qc.x([0, 1]); qc.cz(0, 1); qc.x([0, 1]); qc.h([0, 1]); qc.measure([0, 1], [0, 1]); return _run(qc, "grover", shots, "One Grover iteration amplifies marked state 11.")
def run_qft(shots=1024):
    qc = QuantumCircuit(2, 2); qc.x(0); qc.h(1); qc.cp(math.pi / 2, 1, 0); qc.h(0); qc.swap(0, 1); qc.measure([0, 1], [0, 1]); return _run(qc, "qft", shots, "Applies a two-qubit quantum Fourier transform.")
def run_phase_estimation(shots=1024):
    qc = QuantumCircuit(2, 1); qc.x(1); qc.h(0); qc.cp(math.pi, 0, 1); qc.h(0); qc.measure(0, 0); return _run(qc, "phase_estimation", shots, "Estimates a π phase using one precision qubit.")
def run_shor(shots=1024):
    qc = QuantumCircuit(4, 2); qc.h([0, 1]); qc.x(2); qc.cx(0, 2); qc.cx(1, 3); qc.h([0, 1]); qc.measure([0, 1], [0, 1]); return _run(qc, "shor", shots, "Educational order-finding subroutine for Shor's factoring workflow.")
