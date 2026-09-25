from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.config import settings
from app.routers import ibm, jobs


client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_execute_returns_real_measurements(monkeypatch):
    # Unit tests exercise the local simulator; authenticated integration tests
    # should supply a real Supabase JWT separately.
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    response = client.post("/api/quantum/execute", json={
        "framework": "qiskit",
        "shots": 64,
        "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()",
    })
    assert response.status_code == 200
    assert response.json()["measurements"] == {"1": 64}


def test_sandbox_rejects_file_access(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    response = client.post("/api/quantum/execute", json={
        "framework": "qiskit", "shots": 64, "code": "open('secret.txt')",
    })
    assert response.status_code == 422


@pytest.mark.parametrize(("framework", "code"), [
    ("qiskit", "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()"),
    ("pennylane", "import pennylane as qml\n@qml.qnode(None)\ndef circuit():\n    qml.RY(1.5708, wires=0)\n    return qml.counts()"),
    ("cirq", "import cirq\nqubits = [cirq.LineQubit(i) for i in range(1)]\ncircuit = cirq.Circuit()\ncircuit.append(cirq.X(qubits[0]))"),
])
def test_execute_api_runs_each_supported_framework(monkeypatch, framework, code):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    response = client.post("/api/quantum/execute", json={"framework": framework, "shots": 64, "code": code})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["framework"] == framework
    assert sum(body["measurements"].values()) == 64
    assert body["result_id"]


def test_ibm_submission_and_job_status_routes_forward_backend_data(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    captured = {}

    def submit_circuit(*, code, backend_name, shots):
        captured.update(code=code, backend_name=backend_name, shots=shots)
        return {"job_id": "job-123", "backend": backend_name, "status": "QUEUED"}

    monkeypatch.setattr(ibm, "submit_circuit", submit_circuit)
    monkeypatch.setattr(jobs, "get_job", lambda job_id: {"job_id": job_id, "status": "DONE", "counts": {"1": 100}})
    source = "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()"
    submission = client.post("/api/ibm/run", json={"backend": "ibm_test", "shots": 100, "code": source})
    assert submission.status_code == 200
    assert submission.json() == {"success": True, "job_id": "job-123", "backend": "ibm_test", "status": "QUEUED"}
    assert captured == {"code": source, "backend_name": "ibm_test", "shots": 100}

    status = client.get("/api/jobs/ibm/job-123")
    assert status.status_code == 200
    assert status.json() == {"success": True, "job_id": "job-123", "status": "DONE", "counts": {"1": 100}}
