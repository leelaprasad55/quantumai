import time
import json
from pathlib import Path
from collections import defaultdict, deque
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, quantum, ibm, jobs


app = FastAPI(
    title="QuantumLearn Quantum Backend",
    version="1.0.0",
)

_request_times: dict[str, deque] = defaultdict(deque)
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/") and request.method == "POST":
        client = request.client.host if request.client else "unknown"
        now, window = time.monotonic(), 60
        timestamps = _request_times[client]
        while timestamps and timestamps[0] <= now - window: timestamps.popleft()
        if len(timestamps) >= settings.rate_limit_per_minute:
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again shortly."})
        timestamps.append(now)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


app.include_router(health.router)
app.include_router(quantum.router)
app.include_router(ibm.router)
app.include_router(jobs.router)

_backend_root = Path(__file__).resolve().parents[1]
_frontend_dist = next(
    (candidate for candidate in (_backend_root / "dist", _backend_root.parent / "dist") if candidate.is_dir()),
    None,
)


@app.get("/runtime-config.js", include_in_schema=False)
def runtime_config():
    """Expose only browser-safe runtime configuration to the React bundle."""
    config = {
        "VITE_SUPABASE_URL": settings.supabase_url or "",
        "VITE_SUPABASE_ANON_KEY": settings.supabase_anon_key or "",
    }
    return Response(
        content=f"window.__QUANTUMLEARN_CONFIG__ = {json.dumps(config)};",
        media_type="application/javascript",
        headers={"Cache-Control": "no-store"},
    )


@app.get("/", include_in_schema=False)
def root():
    if _frontend_dist:
        return FileResponse(_frontend_dist / "index.html")
    return {
        "success": True,
        "service": "QuantumLearn Quantum Backend",
        "docs": "/docs",
    }


@app.get("/{frontend_path:path}", include_in_schema=False)
def frontend(frontend_path: str):
    """Serve compiled React assets and support browser-router deep links."""
    if not _frontend_dist:
        return JSONResponse(status_code=404, content={"detail": "Frontend build was not found."})

    requested = (_frontend_dist / frontend_path).resolve()
    if requested.is_relative_to(_frontend_dist.resolve()) and requested.is_file():
        return FileResponse(requested)
    return FileResponse(_frontend_dist / "index.html")
