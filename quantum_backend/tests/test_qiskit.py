from app.services.qiskit_service import run_qiskit


def test_bell():
    code = '''
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()
'''

    result = run_qiskit(code, 100)
    assert result["success"] is True
    assert result["shots"] == 100
    assert set(result["counts"]).issubset({"00", "11"})
