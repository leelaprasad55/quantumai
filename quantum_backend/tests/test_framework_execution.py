import pytest

from app.services.cirq_service import run_cirq
from app.services.pennylane_service import run_pennylane
from app.services.qiskit_service import run_qiskit


@pytest.mark.parametrize(("runner", "source", "states"), [
    (
        run_qiskit,
        "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])",
        {"00", "11"},
    ),
    (
        run_pennylane,
        "import pennylane as qml\ndev = qml.device('default.qubit', wires=2, shots=128)\n@qml.qnode(dev)\ndef circuit():\n    qml.Hadamard(wires=0)\n    qml.CNOT(wires=[0, 1])\n    return qml.counts()\nresults = circuit()",
        {"00", "11"},
    ),
    (
        run_cirq,
        "import cirq\nqubits = [cirq.LineQubit(i) for i in range(2)]\ncircuit = cirq.Circuit()\ncircuit.append(cirq.ry(1.5708)(qubits[0]))\ncircuit.append(cirq.CNOT(qubits[0], qubits[1]))\ncircuit.append(cirq.measure(*qubits, key='result'))",
        {"00", "11"},
    ),
])
def test_generated_framework_code_executes(runner, source, states):
    result = runner(source, 128)
    assert result["success"] is True
    assert set(result["measurements"]).issubset(states)
    assert sum(result["measurements"].values()) == 128
    assert sum(result["probabilities"].values()) == pytest.approx(1)
