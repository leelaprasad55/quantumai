# QuantumLearn unified web service

This FastAPI service is the QuantumLearn server. In production it serves both
the compiled React application and the `/api` quantum endpoints from one origin.

## What it provides
- FastAPI REST API and compiled React application
- Qiskit + Qiskit Aer local simulation
- PennyLane local execution
- Cirq local execution
- Bell/Grover/QFT starter algorithms
- IBM Quantum backend discovery
- IBM Quantum asynchronous job submission/status/result
- Configuration through backend-only `.env`
- Basic request validation
- CORS configuration
- Single-service Docker and Render deployment

## Important
The production deployment uses this service together with the React bundle built
at the repository root. `render.yaml` and `Dockerfile` build both pieces.

Do not put IBM/qBraid API keys in React/Vite `.env` files or frontend code.

## Local development

From the repository root, install the React dependencies with `npm ci`. Then:

    cd quantum_backend
    python -m venv .venv

Windows:
    .venv\Scripts\activate

Install:
    pip install -r requirements.txt

Create `.env` from `.env.example`.

Start the API:
    uvicorn app.main:app --reload --port 8000

In another terminal at the repository root, run `npm run dev`. Vite serves the
React app at `http://127.0.0.1:5173` and proxies `/api` to port 8000. A deployed
or Docker build serves the React app directly at `http://127.0.0.1:8000`.

## Local Qiskit test

POST `/api/quantum/execute`

{
  "framework": "qiskit",
  "shots": 1024,
  "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0,1)\nqc.measure_all()"
}

## IBM test

Configure these ONLY in the backend `.env`:

IBM_QUANTUM_API_KEY=...
IBM_QUANTUM_INSTANCE=...

Then:

GET /api/ibm/backends

POST /api/ibm/run

{
  "shots": 1024
}

The response returns a real IBM job ID. Poll:

GET /api/jobs/ibm/{job_id}

A physical QPU is used only when IBM credentials/instance are valid and an
operational non-simulator backend is selected.

## Security warning

The code execution endpoints in this starter are intended for controlled local
testing. Do NOT expose arbitrary Python execution publicly until the production
sandbox is enabled and audited. The Docker files included here are a foundation,
not a complete hostile-code sandbox.

## qBraid

`qbraid_service.py` provides configuration/status scaffolding. Exact qBraid
provider/device execution should be added only after selecting the intended
qBraid device/provider and validating its current SDK/API contract. No fake
qBraid job submission is included.
