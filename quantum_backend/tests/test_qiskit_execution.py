import pytest

from app.services.qiskit_service import run_qiskit


@pytest.mark.parametrize(("source", "states"), [
    ("from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.measure_all()", {"0"}),
    ("from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()", {"1"}),
    ("from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.h(0)\nqc.measure_all()", {"0", "1"}),
    ("from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()", {"00", "11"}),
    ("from qiskit import QuantumCircuit\nqc = QuantumCircuit(3)\nqc.h(0)\nqc.cx(0, 1)\nqc.cx(1, 2)\nqc.measure_all()", {"000", "111"}),
])
def test_real_aer_execution(source, states):
    result = run_qiskit(source, 128)
    assert result["success"] is True
    assert set(result["measurements"]).issubset(states)
    assert sum(result["measurements"].values()) == 128
    assert sum(result["probabilities"].values()) == pytest.approx(1)


def test_rejects_unsupported_operation():
    with pytest.raises(ValueError, match="Unsupported"):
        run_qiskit("from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.reset(0)", 10)


def test_rejects_invalid_python():
    with pytest.raises(ValueError, match="Invalid Python"):
        run_qiskit("qc = QuantumCircuit(", 10)
