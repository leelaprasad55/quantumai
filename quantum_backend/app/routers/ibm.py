from fastapi import APIRouter, HTTPException, Depends

from app.schemas import IBMRunRequest
from app.services.ibm_service import get_backends, submit_bell
from app.security import require_configured_auth


router = APIRouter(prefix="/api/ibm", tags=["IBM Quantum"], dependencies=[Depends(require_configured_auth)])


@router.get("/backends")
def backends():
    try:
        return {
            "success": True,
            "backends": get_backends(),
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("/run")
def run(request: IBMRunRequest):
    try:
        result = submit_bell(
            backend_name=request.backend,
            shots=request.shots,
        )
        return {
            "success": True,
            **result,
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
