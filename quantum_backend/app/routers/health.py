from fastapi import APIRouter
from app.config import settings
from app.services.qbraid_service import get_qbraid_status


router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
def health():
    return {
        "success": True,
        "service": "Quantum Backend",
        "environment": settings.app_env,
    }


@router.get("/capabilities")
def capabilities():
    return {
        "qiskit": True,
        "qiskit_aer": True,
        "pennylane": True,
        "cirq": True,
        "ibm_quantum": bool(settings.ibm_quantum_api_key),
        "qbraid": bool(settings.qbraid_api_key),
    }


@router.get("/qbraid/status")
def qbraid_status():
    return {
        "success": True,
        **get_qbraid_status(),
    }
