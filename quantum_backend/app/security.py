"""Server-side Supabase token verification without exposing credentials."""
from fastapi import Depends, Header, HTTPException
import httpx
from app.config import settings

async def require_configured_auth(authorization: str | None = Header(default=None)):
    # Local development remains usable without Supabase. Once configured, every
    # protected router verifies the actual bearer token with Supabase Auth.
    if not settings.supabase_url or not settings.supabase_anon_key:
        return None
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(f"{settings.supabase_url.rstrip('/')}/auth/v1/user", headers={"apikey": settings.supabase_anon_key, "Authorization": authorization})
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token.")
    return response.json()


async def require_admin(user=Depends(require_configured_auth)):
    """Authorize server-side admin operations from the verified profile role."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication is required for admin operations.")
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Admin operations are unavailable until the backend service role is configured.")
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles?id=eq.{user['id']}&select=role",
            headers=headers,
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=503, detail="Unable to verify administrator role.")
    profiles = response.json()
    if not profiles or profiles[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return user
