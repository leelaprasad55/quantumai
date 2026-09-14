# QuantumLearn AI — Project Overview

## Purpose

QuantumLearn AI is an adaptive quantum-computing education platform. Learners take a diagnostic assessment, follow a 24-module curriculum, build and simulate quantum circuits, complete puzzles and quizzes, and track their skills and achievements. The platform also provides an AI tutor, a quantum-algorithm comparison visualizer, and a lab for running quantum code.

## Production architecture

```text
Browser
  │
  ├─ React + Vite single-page application
  │    ├─ Supabase Auth and learner-data client
  │    └─ /api requests (same origin in production)
  │
  └─ FastAPI service
       ├─ serves the compiled React bundle
       ├─ local Qiskit, PennyLane, and Cirq execution
       ├─ IBM Quantum backend and job integration
       └─ optional qBraid status integration

Supabase
  ├─ authentication
  ├─ learner profile and progress data
  └─ row-level security policies
```

`render.yaml` deploys one Docker-based web service. The Docker build compiles the frontend first, then FastAPI serves the resulting `dist/` directory and the API from port 8000.

## Main directories

| Path | Responsibility |
|---|---|
| `src/` | React SPA source: screens, components, contexts, data, services, styles, and utility logic. |
| `quantum_backend/` | FastAPI API, execution services, tests, Docker assets, and backend configuration. |
| `supabase/migrations/` | SQL schema, RLS policies, RPCs, and avatar-storage setup. |
| `public/` | Browser-served static assets and runtime configuration script. |
| `docs/` | Project-report HTML and PDF artifacts. |
| `templates/`, `static/`, `app.py`, `curriculum.py` | Legacy Flask/Jinja implementation; not used by the configured production deployment. |

## Frontend

The frontend uses React 19, React Router, Vite, Chart.js, KaTeX, and the Supabase JavaScript client.

### Major screens

| Route | Screen |
|---|---|
| `/`, `/login`, `/register` | Authentication flow |
| `/test` | Initial knowledge assessment |
| `/dashboard` | Learner progress summary |
| `/roadmap` | Adaptive learning sequence |
| `/modules`, `/modules/:id` | Curriculum and module content |
| `/circuit` | Circuit builder, simulator, and explainer |
| `/lab` | Quantum-code experimentation workspace |
| `/race` | Classical versus quantum algorithm comparison |
| `/skillmap` | Skill visualization |
| `/achievements` | Badge progress |
| `/admin` | Administrator analytics and management |

`AuthContext` owns the session and user identity. `ProgressContext` owns learner progress, skills, assessments, puzzles, activity, and gate-usage updates. When Supabase is unavailable, the client remains usable in local-only mode through the storage utilities.

Curriculum data is stored locally in `src/data/`: 24 modules, topic content, knowledge-test questions, quizzes, formulas, and circuit-puzzle definitions. `src/utils/quantum.js` is the browser-side state-vector simulator used by the interactive circuit features.

## Backend API

FastAPI’s health routes are public. Quantum, IBM, and job routes verify a Supabase bearer token when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured; without them, local development is permitted without configured authentication.

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Backend status and environment |
| `GET /api/capabilities` | Reports installed/configured execution providers |
| `GET /api/qbraid/status` | qBraid configuration status |
| `POST /api/quantum/execute` | Run submitted Qiskit, PennyLane, or Cirq code |
| `POST /api/quantum/circuit` | Alias for circuit execution |
| `POST /api/quantum/simulate` | Alias for simulation execution |
| `GET /api/quantum/result?result_id=...` | Read an in-memory execution result |
| `POST /api/quantum/algorithm` | Run a built-in Qiskit algorithm |
| `GET /api/ibm/backends` | Discover IBM Quantum backends |
| `POST /api/ibm/run` | Submit the starter Bell-state job to IBM Quantum |
| `GET /api/jobs/ibm/{job_id}` | Poll an IBM Quantum job |

Built-in algorithms include Bell state, Deutsch–Jozsa, Bernstein–Vazirani, Grover, QFT, phase estimation, and Shor. Requests are validated for framework, shot count, and code size; a basic source-token denylist, request rate limit, and execution timeout configuration are present. This is not a complete hostile-code sandbox, so arbitrary code execution must not be exposed publicly until a hardened sandbox is in place.

## Supabase data model

The canonical migration creates these user-scoped resources:

- `profiles` and `user_progress`
- `user_skills`
- `module_progress`, `topic_progress`, and `test_attempts`
- `saved_circuits` and `lab_experiments`
- `activity_log`, `gate_usage`, and `puzzle_progress`
- `ai_chat_messages`

Database migrations also establish profile creation for new auth users; subsequent migrations add row-level-security policies, administrative RPCs, user RPCs, constraints, and avatar storage.

## Configuration

Do not commit secrets. The root `.env.example` is for browser-safe Supabase build variables. Backend secrets belong in `quantum_backend/.env`.

| Variable | Used by | Required when |
|---|---|---|
| `VITE_SUPABASE_URL` | React build/runtime | Using Supabase in the frontend |
| `VITE_SUPABASE_ANON_KEY` | React build/runtime | Using Supabase in the frontend |
| `SUPABASE_URL` | FastAPI | Enabling protected API requests |
| `SUPABASE_ANON_KEY` | FastAPI | Enabling protected API requests |
| `IBM_QUANTUM_API_KEY` | FastAPI | IBM backend or job operations |
| `IBM_QUANTUM_INSTANCE` | FastAPI | IBM instance selection |
| `QBRAID_API_KEY` | FastAPI | qBraid integration |
| `GROQ_API_KEY` | FastAPI configuration | Server-side Groq usage, if enabled |
| `CORS_ORIGINS` | FastAPI | Restricting allowed browser origins |

`/runtime-config.js` exposes only the browser-safe Supabase URL and anon key to a production React bundle. Provider keys must stay on the backend.

## Local development

```powershell
# Repository root: install and run the frontend
npm ci
npm run dev

# In another terminal: create and run the backend
cd quantum_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Vite runs at `http://127.0.0.1:5173` and proxies `/api` to FastAPI at port 8000. For a production-like single-service build, use the Dockerfile or Render deployment; FastAPI then serves both the API and compiled SPA at port 8000.

## Verification commands

```powershell
# Frontend unit/configuration tests
npm test

# Frontend production build
npm run build

# Backend tests (from quantum_backend)
pytest
```

## Important implementation notes

- The app retains a local storage fallback for demonstrations/offline use, but Supabase is the intended persistent backend.
- FastAPI stores local execution results in process memory, so those result IDs are ephemeral and are not shared across instances.
- The React app lazy-loads most pages to reduce initial bundle size.
- The old Flask/Jinja files coexist with the active stack; avoid extending them unless the project intentionally returns to Flask.
