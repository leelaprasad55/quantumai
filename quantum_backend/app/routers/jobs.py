from fastapi import APIRouter, HTTPException, Depends
from app.services.ibm_service import get_job
from app.security import require_configured_auth


router = APIRouter(prefix="/api/jobs", tags=["Jobs"], dependencies=[Depends(require_configured_auth)])


@router.get("/ibm/{job_id}")
def ibm_job(job_id: str):
    try:
        return {
            "success": True,
            **get_job(job_id),
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
