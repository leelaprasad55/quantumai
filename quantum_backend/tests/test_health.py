from fastapi.testclient import TestClient
from app.main import app
from app.config import settings


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
