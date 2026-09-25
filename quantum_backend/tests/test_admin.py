import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.security import require_admin
from app.services.admin_service import store


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
