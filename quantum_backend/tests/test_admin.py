import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.security import require_admin
from app.services.admin_service import AdminStore, store


client = TestClient(app)


def test_admin_endpoint_rejects_unauthenticated_requests(monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "supabase_url", None)
    monkeypatch.setattr(settings, "supabase_anon_key", None)
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 401


def test_admin_dashboard_requires_dependency_and_returns_real_service_shape(monkeypatch):
    async def admin_user():
        return {"id": "00000000-0000-0000-0000-000000000001"}

    async def dashboard():
        return {"total_users": 3, "recent_activity": []}

    monkeypatch.setattr(store, "dashboard", dashboard)
    app.dependency_overrides[require_admin] = admin_user
    try:
        response = client.get("/api/admin/dashboard")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["metrics"]["total_users"] == 3


def test_admin_content_schema_rejects_invalid_title(monkeypatch):
    async def admin_user():
        return {"id": "00000000-0000-0000-0000-000000000001"}

    app.dependency_overrides[require_admin] = admin_user
    try:
        response = client.post("/api/admin/content/modules", json={"title": ""})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 422


def test_admin_settings_are_secured_and_validated(monkeypatch):
    async def admin_user():
        return {"id": "00000000-0000-0000-0000-000000000001"}

    async def settings():
        return {"contest_submission_limit": 10, "allow_contest_resubmissions": True, "maintenance_message": ""}

    monkeypatch.setattr(store, "platform_settings", settings)
    app.dependency_overrides[require_admin] = admin_user
    try:
        response = client.get("/api/admin/settings")
        invalid = client.put("/api/admin/settings", json={"contest_submission_limit": 0})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["settings"]["contest_submission_limit"] == 10
    assert invalid.status_code == 422


def test_admin_can_create_contest(monkeypatch):
    async def admin_user():
        return {"id": "00000000-0000-0000-0000-000000000001"}

    async def create_contest(payload, admin_id):
        assert admin_id == "00000000-0000-0000-0000-000000000001"
        assert payload["title"] == "Demo contest"
        assert payload["problems"][0]["title"] == "Create a Bell state"
        return {"id": "10000000-0000-0000-0000-000000000001", **payload}

    monkeypatch.setattr(store, "create_contest", create_contest)
    app.dependency_overrides[require_admin] = admin_user
    try:
        response = client.post(
            "/api/admin/contests",
            json={
                "title": "Demo contest",
                "description": "Demo",
                "start_time": "2026-10-10T10:00:00Z",
                "end_time": "2026-10-12T10:00:00Z",
                "is_rated": True,
                "problems": [{
                    "title": "Create a Bell state",
                    "statement": "Create an equal superposition of |00> and |11>.",
                    "contest_type": "circuit_building",
                    "framework": "qiskit",
                    "qubit_budget": 2,
                    "gate_budget": 2,
                    "par_gates": 2,
                    "par_depth": 2,
                    "reference_ops": [
                        {"gate": "H", "target": 0, "col": 0},
                        {"gate": "CNOT", "control": 0, "target": 1, "col": 1},
                    ],
                }],
            },
        )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["contest"]["title"] == "Demo contest"


def test_admin_store_creates_contest_and_playable_problem_without_rpc(monkeypatch):
    admin_store = AdminStore()
    requests = []
    payload = {
        "title": "Bell-state challenge",
        "description": "Prepare the target state.",
        "start_time": "2026-10-10T10:00:00Z",
        "end_time": "2026-10-12T10:00:00Z",
        "is_rated": True,
        "problems": [{
            "title": "Create a Bell state",
            "statement": "Create an equal superposition of |00> and |11>.",
            "contest_type": "circuit_building",
            "framework": "qiskit",
            "qubit_budget": 2,
            "gate_budget": 2,
            "par_gates": 2,
            "par_depth": 2,
            "pass_threshold": 0.95,
            "order_index": 0,
            "reference_ops": [
                {"gate": "H", "target": 0, "col": 0},
                {"gate": "CNOT", "control": 0, "target": 1, "col": 1},
            ],
        }],
    }

    async def request(method, path, **kwargs):
        requests.append((method, path, kwargs.get("json")))
        if path == "rpc/admin_create_contest_with_problem":
            return {
                "contest": {"id": "10000000-0000-0000-0000-000000000001", "title": payload["title"]},
                "problems": [{"id": "20000000-0000-0000-0000-000000000001", **payload["problems"][0]}],
            }
        raise AssertionError(f"Unexpected storage path: {path}")

    async def audit(*args, **kwargs):
        return None

    monkeypatch.setattr(admin_store, "request", request)
    monkeypatch.setattr(admin_store, "audit", audit)
    result = asyncio.run(admin_store.create_contest(payload, "00000000-0000-0000-0000-000000000001"))

    assert [path for _, path, _ in requests] == ["rpc/admin_create_contest_with_problem"]
    assert requests[0][2]["payload"]["problems"][0]["title"] == "Create a Bell state"
    assert result["id"] == "10000000-0000-0000-0000-000000000001"
    assert result["problems"][0]["reference_ops"] == payload["problems"][0]["reference_ops"]


def test_admin_contest_creation_requires_a_problem():
    async def admin_user():
        return {"id": "00000000-0000-0000-0000-000000000001"}

    app.dependency_overrides[require_admin] = admin_user
    try:
        response = client.post(
            "/api/admin/contests",
            json={
                "title": "Contest without a problem",
                "start_time": "2026-10-10T10:00:00Z",
                "end_time": "2026-10-12T10:00:00Z",
                "problems": [],
            },
        )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 422
