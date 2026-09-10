import time
import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import CircuitRequest, AlgorithmRequest
from app.services.qiskit_service import run_qiskit
from app.services.pennylane_service import run_pennylane
from app.services.cirq_service import run_cirq
from app.services.algorithms import run_bell, run_deutsch_jozsa, run_bernstein_vazirani, run_grover, run_qft, run_phase_estimation, run_shor
from app.security import require_configured_auth

router = APIRouter(prefix="/api/quantum", tags=["Quantum"], dependencies=[Depends(require_configured_auth)])
_results: dict[str, dict] = {}


def _run(request: CircuitRequest):
    runner = {"qiskit": run_qiskit, "pennylane": run_pennylane, "cirq": run_cirq}[request.framework]
    try:
        data = runner(request.code, request.shots)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Quantum execution failed safely: " + str(error)) from error
    data["result_id"] = str(uuid.uuid4())
    _results[data["result_id"]] = {**data, "completed_at": time.time()}
    return data


@router.post("/execute")
def execute(request: CircuitRequest): return _run(request)


@router.post("/circuit")
def circuit(request: CircuitRequest): return _run(request)


@router.post("/simulate")
def simulate(request: CircuitRequest): return _run(request)


@router.get("/result")
def result(result_id: str):
    saved = _results.get(result_id)
    if not saved: raise HTTPException(status_code=404, detail="Execution result not found or expired.")
    return saved


@router.post("/algorithm")
def algorithm(request: AlgorithmRequest):
    if request.framework != "qiskit": raise HTTPException(status_code=400, detail="Algorithms are currently implemented with Qiskit Aer only.")
    runners = {"bell": run_bell, "deutsch_jozsa": run_deutsch_jozsa, "bernstein_vazirani": run_bernstein_vazirani, "grover": run_grover, "qft": run_qft, "phase_estimation": run_phase_estimation, "shor": run_shor}
    if request.algorithm not in runners: raise HTTPException(status_code=501, detail=f"{request.algorithm} is not implemented yet.")
    try:
        data = runners[request.algorithm](request.shots)
        counts = data.pop("counts", {})
        return {**data, "measurements": counts, "probabilities": {state: count / request.shots for state, count in counts.items()}, "explanation": f"Qiskit Aer executed {request.algorithm}.", "error": None}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
