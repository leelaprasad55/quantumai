from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas import AdminContentRequest, AdminRoleRequest, AdminSettingRequest
from app.security import require_admin
from app.services.admin_service import CONTENT_TABLES, store

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def page_args(page: int, page_size: int):
    return max(page, 1), min(max(page_size, 1), 100)


@router.get("/dashboard")
async def dashboard(user=Depends(require_admin)):
    return {"success": True, "metrics": await store.dashboard()}


@router.get("/settings")
async def get_settings(user=Depends(require_admin)):
    return {"success": True, "settings": await store.platform_settings()}


@router.put("/settings")
async def update_settings(request: AdminSettingRequest, user=Depends(require_admin)):
    return {"success": True, "settings": await store.update_platform_settings(request.model_dump(), user["id"])}


@router.get("/users")
async def users(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), search: str | None = Query(None, max_length=100), user=Depends(require_admin)):
    page, page_size = page_args(page, page_size)
    return {"success": True, "users": await store.users(page, page_size, search), "page": page, "page_size": page_size}


@router.patch("/users/{user_id}/role")
async def set_user_role(user_id: UUID, request: AdminRoleRequest, user=Depends(require_admin)):
    try:
        updated = await store.set_role(str(user_id), request.role, user["id"])
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    if not updated:
        raise HTTPException(404, "User not found.")
    return {"success": True, "user": updated}


@router.get("/audit-logs")
async def audit_logs(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), user=Depends(require_admin)):
    page, page_size = page_args(page, page_size)
    return {"success": True, "logs": await store.audit_logs(page, page_size), "page": page, "page_size": page_size}


@router.get("/content/{entity}")
async def list_content(entity: Literal["modules", "topics", "resources", "questions", "circuit-challenges", "coding-challenges", "achievements", "projects", "announcements"], page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), search: str | None = Query(None, max_length=100), user=Depends(require_admin)):
    page, page_size = page_args(page, page_size)
    return {"success": True, "items": await store.list_content(entity, search, page, page_size), "page": page, "page_size": page_size}


@router.post("/content/{entity}")
async def create_content(entity: Literal["modules", "topics", "resources", "questions", "circuit-challenges", "coding-challenges", "achievements", "projects", "announcements"], request: AdminContentRequest, user=Depends(require_admin)):
    return {"success": True, "item": await store.create_content(entity, request.model_dump(), user["id"])}


@router.put("/content/{entity}/{record_id}")
async def update_content(entity: Literal["modules", "topics", "resources", "questions", "circuit-challenges", "coding-challenges", "achievements", "projects", "announcements"], record_id: UUID, request: AdminContentRequest, user=Depends(require_admin)):
    item = await store.update_content(entity, str(record_id), request.model_dump(), user["id"])
    if not item:
        raise HTTPException(404, "Content record not found.")
    return {"success": True, "item": item}


@router.delete("/content/{entity}/{record_id}")
async def archive_content(entity: Literal["modules", "topics", "resources", "questions", "circuit-challenges", "coding-challenges", "achievements", "projects", "announcements"], record_id: UUID, user=Depends(require_admin)):
    item = await store.archive_content(entity, str(record_id), user["id"])
    if not item:
        raise HTTPException(404, "Content record not found.")
    return {"success": True, "item": item, "message": "Content was archived; historical records were preserved."}
