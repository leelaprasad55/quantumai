"""Bounded, audited admin data access. No browser receives service-role credentials."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings


CONTENT_TABLES = {
    "modules": "admin_modules",
    "topics": "admin_topics",
    "resources": "learning_resources",
    "questions": "question_bank",
    "circuit-challenges": "circuit_challenges",
    "coding-challenges": "coding_challenges",
    "achievements": "achievement_definitions",
    "projects": "learning_projects",
    "announcements": "announcements",
}

DEFAULT_PLATFORM_SETTINGS = {
    "contest_submission_limit": 10,
    "allow_contest_resubmissions": True,
    "maintenance_message": "",
}


class AdminStore:
    def __init__(self):
        self.base = (settings.supabase_url or "").rstrip("/")
        self.key = settings.supabase_service_role_key

    def _headers(self, extra: dict[str, str] | None = None):
        return {"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json", **(extra or {})}

    async def request(self, method: str, path: str, **kwargs):
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.request(method, f"{self.base}/rest/v1/{path}", headers=self._headers(kwargs.pop("headers", None)), **kwargs)
        if response.status_code >= 400:
            raise RuntimeError(f"Admin storage request failed: {response.text[:300]}")
        return response.json() if response.content else None

    async def audit(self, admin_id: str, action: str, entity_type: str, entity_id: str | None, metadata: dict[str, Any] | None = None):
        payload = {"admin_id": admin_id, "action": action, "entity_type": entity_type, "entity_id": entity_id, "metadata": metadata or {}}
        await self.request("POST", "audit_logs", json=payload)

    async def platform_settings(self):
        rows = await self.request("GET", "admin_settings?setting_key=eq.platform&select=value")
        stored = rows[0].get("value") if rows else {}
        return {**DEFAULT_PLATFORM_SETTINGS, **(stored if isinstance(stored, dict) else {})}

    async def update_platform_settings(self, values: dict[str, Any], admin_id: str):
        payload = {"setting_key": "platform", "value": values, "updated_by": admin_id, "updated_at": datetime.now(timezone.utc).isoformat()}
        rows = await self.request("POST", "admin_settings?on_conflict=setting_key", json=payload, headers={"Prefer": "resolution=merge-duplicates,return=representation"})
        await self.audit(admin_id, "update", "platform_settings", "platform", {"changed_keys": sorted(values)})
        return {**DEFAULT_PLATFORM_SETTINGS, **(rows[0].get("value") if rows else values)}

    async def dashboard(self):
        # Only real persisted totals are returned; unavailable metrics remain null.
        endpoints = {
            "users": "profiles?select=id",
            "modules": "admin_modules?select=id,status",
            "topics": "admin_topics?select=id,status",
            "contests": "contests?select=id,start_time,end_time",
            "submissions": "contest_submissions?select=id",
            "jobs": "lab_experiments?select=id",
            "recent_activity": "audit_logs?select=action,entity_type,created_at&order=created_at.desc&limit=8",
        }
        result: dict[str, Any] = {}
        for name, endpoint in endpoints.items():
            try:
                result[name] = await self.request("GET", endpoint)
            except RuntimeError:
                result[name] = None
        now = datetime.now(timezone.utc)
        contests = result.get("contests") or []
        return {
            "total_users": len(result["users"]) if result["users"] is not None else None,
            "total_modules": len(result["modules"]) if result["modules"] is not None else None,
            "published_modules": sum(row.get("status") == "published" for row in result["modules"] or []),
            "total_topics": len(result["topics"]) if result["topics"] is not None else None,
            "total_contests": len(contests) if result["contests"] is not None else None,
            "live_contests": sum(datetime.fromisoformat(row["start_time"].replace("Z", "+00:00")) <= now < datetime.fromisoformat(row["end_time"].replace("Z", "+00:00")) for row in contests),
            "total_submissions": len(result["submissions"]) if result["submissions"] is not None else None,
            "total_quantum_jobs": len(result["jobs"]) if result["jobs"] is not None else None,
            "recent_activity": result["recent_activity"] or [],
        }

    async def list_content(self, entity: str, search: str | None, page: int, page_size: int):
        table = CONTENT_TABLES[entity]
        query = f"{table}?select=*&order=updated_at.desc&limit={page_size}&offset={(page - 1) * page_size}"
        if search:
            # REST filter value is bounded by validation in the router and encoded by httpx URL handling.
            query += f"&title=ilike.*{search}*"
        return await self.request("GET", query)

    async def create_content(self, entity: str, values: dict[str, Any], admin_id: str):
        table = CONTENT_TABLES[entity]
        payload = {**values, "created_by": admin_id, "updated_by": admin_id}
        rows = await self.request("POST", table, json=payload, headers={"Prefer": "return=representation"})
        await self.audit(admin_id, "create", entity, rows[0]["id"], {"title": rows[0]["title"]})
        return rows[0]

    async def update_content(self, entity: str, record_id: str, values: dict[str, Any], admin_id: str):
        table = CONTENT_TABLES[entity]
        rows = await self.request("PATCH", f"{table}?id=eq.{record_id}", json={**values, "updated_by": admin_id}, headers={"Prefer": "return=representation"})
        if not rows:
            return None
        await self.audit(admin_id, "update", entity, record_id, {"title": rows[0]["title"], "status": rows[0]["status"]})
        return rows[0]

    async def archive_content(self, entity: str, record_id: str, admin_id: str):
        record = await self.update_content(entity, record_id, {"status": "archived"}, admin_id)
        if record:
            await self.audit(admin_id, "archive", entity, record_id)
        return record

    async def users(self, page: int, page_size: int, search: str | None):
        query = f"profiles?select=id,full_name,avatar_url,role,total_xp,current_streak,knowledge_score,created_at&order=created_at.desc&limit={page_size}&offset={(page - 1) * page_size}"
        if search:
            query += f"&full_name=ilike.*{search}*"
        return await self.request("GET", query)

    async def set_role(self, user_id: str, role: str, admin_id: str):
        if user_id == admin_id and role != "admin":
            raise ValueError("You cannot remove your own administrator role.")
        rows = await self.request("PATCH", f"profiles?id=eq.{user_id}", json={"role": role}, headers={"Prefer": "return=representation"})
        if not rows:
            return None
        await self.audit(admin_id, "role_change", "user", user_id, {"role": role})
        return rows[0]

    async def audit_logs(self, page: int, page_size: int):
        return await self.request("GET", f"audit_logs?select=*&order=created_at.desc&limit={page_size}&offset={(page - 1) * page_size}")


store = AdminStore()
