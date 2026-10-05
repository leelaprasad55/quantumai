from fastapi.testclient import TestClient
import pytest
from app.main import app, _request_times
from app.config import settings
from app.routers import ibm, jobs, quantum as quantum_router


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


def test_production_protected_routes_fail_closed_without_supabase(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    response = client.post("/api/quantum/execute", json={
        "framework": "qiskit",
        "shots": 8,
        "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)\nqc.measure_all()",
    })
    assert response.status_code == 503


def test_runtime_shot_and_source_length_limits_are_enforced(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    monkeypatch.setattr(settings, "max_shots", 32)
    monkeypatch.setattr(settings, "max_code_length", 64)
    too_many_shots = client.post("/api/quantum/execute", json={
        "framework": "qiskit", "shots": 33,
        "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1)",
    })
    oversized_code = client.post("/api/quantum/execute", json={
        "framework": "qiskit", "shots": 8, "code": "x" * 65,
    })
    assert too_many_shots.status_code == 422
    assert oversized_code.status_code == 422


def test_runtime_qubit_limit_is_enforced(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    monkeypatch.setattr(settings, "max_qubits", 1)
    response = client.post("/api/quantum/execute", json={
        "framework": "qiskit", "shots": 8,
        "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.measure_all()",
    })
    assert response.status_code == 400


def test_post_rate_limit_returns_429(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    monkeypatch.setattr(settings, "rate_limit_per_minute", 2)
    _request_times.clear()
    request = {"algorithm": "bell", "shots": 0}
    try:
        assert client.post("/api/quantum/algorithm", json=request).status_code == 422
        assert client.post("/api/quantum/algorithm", json=request).status_code == 422
        assert client.post("/api/quantum/algorithm", json=request).status_code == 429
    finally:
        _request_times.clear()


def test_quantum_result_cache_expires_and_caps_entries(monkeypatch):
    monkeypatch.setattr(settings, "result_cache_ttl_seconds", 10, raising=False)
    monkeypatch.setattr(settings, "max_cached_results", 2, raising=False)
    quantum_router._results.clear()
    quantum_router._results.update({
        "expired": {"completed_at": 989},
        "oldest": {"completed_at": 991},
        "newest": {"completed_at": 992},
    })
    try:
        quantum_router._prune_results(1000)
        assert set(quantum_router._results) == {"oldest", "newest"}
        quantum_router._results["latest"] = {"completed_at": 1000}
        quantum_router._prune_results(1000)
        assert set(quantum_router._results) == {"newest", "latest"}
    finally:
        quantum_router._results.clear()


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
