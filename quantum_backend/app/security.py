"""Server-side Supabase token verification without exposing credentials."""
from fastapi import Header, HTTPException
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
