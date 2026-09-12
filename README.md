<p align="center">
  <strong>⚛ QuantumLearn AI</strong>
</p>

<p align="center">
  <em>An AI-Powered Adaptive Quantum Computing Learning Platform</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/AI_Tutor-Groq_LLM-FF6B35?logo=openai&logoColor=white" alt="AI Tutor" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="License" />
  <img src="https://img.shields.io/badge/Modules-24-blueviolet" alt="Modules" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Application Pages & Routes](#-application-pages--routes)
- [Core Components](#-core-components)
- [Utility Modules (Business Logic)](#-utility-modules-business-logic)
- [State Management](#-state-management)
- [Data Layer](#-data-layer)
- [Curriculum Structure (24 Modules)](#-curriculum-structure-24-modules)
- [Achievement System](#-achievement-system)
- [Authentication & Authorization](#-authentication--authorization)
- [Admin Panel](#-admin-panel)
- [Default Admin Credentials](#-default-admin-credentials)
- [Scripts](#-scripts)
- [Contributing](#-contributing)

---

## 🧭 Overview

**QuantumLearn AI** is a full-featured, single-page web application designed to teach quantum computing from absolute beginner to expert level. The platform combines a structured **24-module curriculum** with interactive tools — a drag-and-drop **Quantum Circuit Builder**, a real-time **3D Bloch Sphere**, an **AI-powered chatbot tutor** (backed by Groq LLM with offline fallback), a **Classical vs. Quantum Race simulator**, and an **adaptive learning engine** that generates personalized roadmaps based on each student's assessed skill profile.

The deployable application is one service: FastAPI serves the compiled React app and its `/api` quantum endpoints. Supabase provides authentication and persistent learner data.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Adaptive Knowledge Test** | Initial assessment quiz that maps student skills across 14 quantum-computing competencies and generates a personalized learning roadmap. |
| **24-Module Curriculum** | Beginner → Expert modules covering math foundations, qubits, gates, circuits, Qiskit, algorithms, QML, noise, error correction, hardware, cryptography, optimization, and simulation. Each module contains topics with video lectures, Dirac-notation math (KaTeX), and interactive exercises. |
| **AI Quantum Tutor** | Floating chatbot powered by the Groq API (multi-model fallback chain). Provides context-aware explanations, hints, code examples, and concept breakdowns in beautifully formatted Markdown. Falls back to keyword-matched offline responses when the API is unavailable. |
| **Quantum Circuit Builder** | Drag-and-drop circuit editor supporting H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, SWAP, CZ, and Measurement gates on up to 8 qubits. Includes real-time state simulation, probability bar charts, save/load circuits, and a one-click "Explain" button. |
| **3D Bloch Sphere** | Interactive Canvas 2D-rendered Bloch sphere with smooth animation and mouse-drag rotation. Visualizes single-qubit state vectors in real time as gates are applied. |
| **AI Circuit Explainer** | Four-tab drawer (AI Insight, State Transformations, Matrices, Concepts) providing step-by-step Dirac-notation state evolution, unitary matrix display, and AI-generated natural-language explanations for any circuit. |
| **Circuit Puzzles** | Drag-and-drop challenges where students must construct circuits that produce target quantum states. Features hint system, state verification (up to global phase), and Bloch sphere preview. |
| **Classical vs. Quantum Race** | Animated side-by-side race simulator for 6 algorithms (Grover, Shor, Deutsch-Jozsa, Simon, HHL, QFT). Adjustable problem size N with live step counters, complexity comparison tables, and educational "How It Works" cards. |
| **Personalized Roadmap** | Goal-driven, prerequisite-aware module ordering engine. Identifies weak/strong skill areas and constructs an optimal learning path for each student. |
| **Skill Map & Progress Tracking** | Radar-style skill visualization across 14 competencies with real-time updates as exercises and modules are completed. |
| **Achievement System** | 12 unlockable badges (Qubit Explorer, Gate Master, Bell State Builder, Quantum Architect, etc.) tied to progress milestones. |
| **Admin Panel** | Protected dashboard with user management, curriculum overview, GitHub-style activity heatmap (Canvas), gate usage bar charts, and module completion funnel analytics. |
| **Quantum Lab** | Experimental workspace for running quantum simulations and experiments. |
| **Glassmorphic Dark UI** | Premium dark-mode interface with Inter + JetBrains Mono typography, gradient accents, smooth animations, and responsive layout. |

---

## 🛠 Tech Stack

> The deployable application is React/Vite + FastAPI. FastAPI serves the production React bundle and handles quantum execution at the same origin. The root-level Flask/Jinja files are legacy material and are not used by `render.yaml`.

| Layer | Technology |
|---|---|
| **Framework** | React 19.1 (JSX, functional components, hooks) |
| **Build Tool** | Vite 8.2 |
| **Routing** | React Router DOM 7.18 |
| **Styling** | Vanilla CSS (glassmorphic dark theme, CSS custom properties) |
| **Math Rendering** | KaTeX 0.18 (Dirac notation, matrices) |
| **Charts** | Chart.js 4.5 + react-chartjs-2 5.3 |
| **Typography** | Google Fonts — Inter (UI), JetBrains Mono (code) |
| **AI Backend** | Groq Cloud API (multi-model fallback: GPT-OSS, Qwen, LLaMA) |
| **Persistence** | Supabase, with local fallback for offline/demo use |
| **Quantum Engine** | Custom pure-JS quantum simulator (complex arithmetic, tensor products, state vectors) |
| **Server** | FastAPI + Uvicorn |
| **Database** | Supabase |
| **Production server** | One Render web service |

---

## 📁 Project Architecture

```
quantumlearn-ai/
├── index.html                  # Entry HTML (SEO meta, font preloads, KaTeX CSS)
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite + React plugin config
├── .env                        # Environment variables (Groq API key)
│
├── public/                     # Static assets
│
└── src/
    ├── main.jsx                # React DOM root + BrowserRouter
    ├── App.jsx                 # Route definitions, ProtectedRoute, MainLayout
    │
    ├── components/
    │   ├── layout/
    │   │   └── Sidebar.jsx     # App sidebar navigation + knowledge score
    │   ├── ai/
    │   │   └── AITutor.jsx     # Floating AI chatbot panel
    │   ├── BlochSphere.jsx     # Interactive 3D Bloch sphere (Canvas 2D)
    │   ├── CircuitExplainer.jsx# 4-tab circuit explanation drawer
    │   └── CircuitPuzzle.jsx   # Drag-and-drop circuit puzzle game
    │
    ├── context/
    │   ├── AuthContext.jsx      # Authentication state (register, login, logout)
    │   └── ProgressContext.jsx  # Progress/skills state (modules, topics, puzzles)
    │
    ├── data/
    │   ├── modules.js           # 24 curriculum modules, goals, skills, achievements
    │   ├── allTopics.js         # Aggregated topic index
    │   ├── topics.js            # Module 1–6 topic content (lectures, videos, exercises)
    │   ├── topics2.js           # Module 7–12 topic content
    │   ├── topics3.js           # Module 13–18 topic content
    │   ├── topics4.js           # Module 19–24 topic content
    │   ├── questions.js         # Knowledge test question bank
    │   ├── topicQuestions.js    # Per-topic quiz questions
    │   └── topicCircuits.js    # Circuit puzzle definitions per topic
    │
    ├── pages/
    │   ├── Auth/AuthPages.jsx           # Login & Register forms
    │   ├── KnowledgeTest/KnowledgeTest.jsx  # Initial skill assessment
    │   ├── Dashboard/Dashboard.jsx      # Student home dashboard
    │   ├── Roadmap/Roadmap.jsx          # Personalized learning roadmap
    │   ├── Module/
    │   │   ├── ModuleList.jsx           # All 24 modules grid
    │   │   └── ModuleDetail.jsx         # Module topics, videos, exercises
    │   ├── CircuitBuilder/CircuitBuilder.jsx # Full circuit editor
    │   ├── QuantumRace/QuantumRace.jsx  # Classical vs Quantum race sim
    │   ├── QuantumLab/QuantumLab.jsx    # Quantum experiment workspace
    │   ├── SkillMap/SkillMap.jsx         # Skill radar visualization
    │   ├── Achievements/Achievements.jsx # Badge gallery
    │   ├── Admin/AdminPanel.jsx         # Admin analytics & management
    │   └── Landing/LandingPage.jsx      # Marketing landing page
    │
    ├── utils/
    │   ├── quantum.js           # Quantum simulation engine (gates, states, measurement)
    │   ├── aiTutor.js           # Groq API integration + fallback responses
    │   ├── adaptive.js          # Roadmap generator, prerequisite checker, skill updater
    │   └── storage.js           # localStorage wrapper (users, progress, skills, circuits)
    │
    └── styles/
        └── index.css            # Global CSS (dark theme, components, animations)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+
- **Python** ≥ 3.10
- **pip**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd qa

# 2. Install the React application
npm ci

# 3. Install the FastAPI service
cd quantum_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 4. Start FastAPI (terminal 1)
uvicorn app.main:app --reload --port 8000

# 5. From the repository root, start Vite (terminal 2)
npm run dev
```

Open the application at `http://localhost:5173`. Vite forwards `/api` requests to FastAPI on port 8000.

### Render deployment

```bash
# Render detects render.yaml automatically. It builds React, then FastAPI serves
# the generated app and its quantum API from one origin.
```

Set the Supabase and provider variables listed in `render.yaml` in the Render dashboard. Keep all provider secrets server-side.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes for React auth | Supabase project URL; used during the frontend build. |
| `VITE_SUPABASE_ANON_KEY` | Yes for React auth | Supabase publishable/anon key; used during the frontend build. |
| `SUPABASE_URL` | Yes for protected API routes | Supabase project URL, configured on FastAPI. |
| `SUPABASE_ANON_KEY` | Yes for protected API routes | Supabase publishable/anon key, configured on FastAPI. |
| `IBM_QUANTUM_API_KEY` | Optional | Enables IBM Quantum hardware operations. |

The root-level Flask/Jinja application is legacy code and is not part of the deployable service.

---

## 🗺 Application Pages & Routes

| Route | Page | Auth | Description |
|---|---|---|---|
| `/` / `/login` | **Login Page** | Public | Email/password login form |
| `/register` | **Register Page** | Public | Registration with name, email, password, education level, and learning goal |
| `/test` | **Knowledge Test** | Protected | 14-skill initial assessment quiz (taken once after registration) |
| `/dashboard` | **Dashboard** | Protected | Student home — stats, next module, skill overview, achievements, quick actions |
| `/roadmap` | **My Roadmap** | Protected | Personalized, goal-driven learning path visualization |
| `/modules` | **Module List** | Protected | Grid of all 24 curriculum modules with category tags and progress |
| `/modules/:id` | **Module Detail** | Protected | Individual module — topic list, video lectures, KaTeX math, exercises, quizzes |
| `/circuit` | **Circuit Builder** | Protected | Full drag-and-drop quantum circuit editor with simulation |
| `/race` | **Quantum Race** | Protected | Classical vs. Quantum algorithm race simulator (6 algorithms) |
| `/lab` | **Quantum Lab** | Protected | Experimental quantum simulation workspace |
| `/skillmap` | **Skill Map** | Protected | Radar chart visualization of 14 quantum competencies |
| `/achievements` | **Achievements** | Protected | Badge gallery showing locked/unlocked achievements |
| `/admin` | **Admin Panel** | Admin only | User management, curriculum overview, platform analytics |

---

## 🧩 Core Components

### `AITutor.jsx` — Floating AI Chatbot

- Persistent floating button (🤖) that expands into a slide-out chat panel
- Sends user messages to the Groq API with conversation history (last 10 messages)
- Context-aware: knows the current module and topic the student is viewing
- Renders AI responses with full Markdown support (headers, bold, code blocks, lists, Dirac notation highlighting)
- Chat history is saved to localStorage per user

### `BlochSphere.jsx` — Interactive 3D Visualization

- Renders a 3D Bloch sphere using Canvas 2D with orthographic projection
- Displays the 6 cardinal states: |0⟩, |1⟩, |+⟩, |−⟩, |+i⟩, |−i⟩
- Animated state vector with purple glow trail and arrowhead
- Mouse drag to rotate the sphere (azimuth + elevation)
- Smooth LERP animation when the state vector changes
- Supports HiDPI/Retina via `devicePixelRatio` scaling

### `CircuitExplainer.jsx` — 4-Tab Explanation Drawer

| Tab | Content |
|---|---|
| **✨ AI Insight** | LLM-generated natural-language explanation of the circuit (with loading animation) |
| **⟨ψ\| State** | Step-by-step Dirac-notation state transformations (Initial → Gate 1 → Gate 2 → ...) |
| **🔢 Matrices** | Unitary gate matrices with name, target qubit, and mathematical description |
| **💡 Concepts** | Auto-detected quantum phenomena (superposition, entanglement, phase flip, etc.) with final measurement probabilities |

### `CircuitPuzzle.jsx` — Interactive Circuit Challenges

- Displays input state → target state with a mini drag-and-drop circuit canvas
- Gate palette: H, X, Y, Z, S, T, CNOT (for multi-qubit puzzles)
- Click a placed gate to remove it
- Solution verification via quantum state vector comparison (tolerant to global phase)
- Integrated Bloch sphere preview for single-qubit puzzles
- Hint system per puzzle

### `Sidebar.jsx` — Navigation

- 8 primary navigation links + conditional Admin link
- Displays real-time Knowledge Score (%) with progress bar
- Sign Out button

---

## ⚙ Utility Modules (Business Logic)

### `quantum.js` — Pure-JS Quantum Simulation Engine

The heart of all circuit simulation. Implements quantum mechanics from first principles:

| Function | Purpose |
|---|---|
| `add`, `mul`, `conj`, `abs2`, `scale`, `c` | Complex number arithmetic |
| `GATES` | Pre-defined gate matrices: I, X, Y, Z, H, S, T |
| `gateMatrix(name, angle)` | Returns matrix for any gate including parametric Rx(θ), Ry(θ), Rz(θ) |
| `tensorProduct(G, n, target)` | Constructs n-qubit unitary by embedding single-qubit gate G via tensor product |
| `cnotMatrix(n, ctrl, tgt)` | Builds CNOT unitary for n-qubit system |
| `swapMatrix(n, q1, q2)` | Builds SWAP unitary for n-qubit system |
| `applyGate(state, nQubits, gate, target, control, angle)` | Applies any gate (including CZ decomposition) to a state vector |
| `initState(nQubits)` | Creates \|00...0⟩ initial state |
| `getProbabilities(state)` | Extracts measurement probabilities from state vector |
| `measure(state, nQubits, shots)` | Monte Carlo measurement simulation (default 1000 shots) |
| `blochCoords(state)` | Converts single-qubit state to Bloch sphere (x, y, z) coordinates |
| `getReducedBlochCoords(state, nQubits, targetQubit)` | Partial trace to get Bloch coords for one qubit in a multi-qubit system |
| `getReducedQubitState(fullState, nQubits, qubitIdx)` | Reduced density matrix → Bloch coordinates with purity check |
| `getQubitProbabilities(fullState, nQubits, qubitIdx)` | Per-qubit |0⟩ / |1⟩ probabilities |
| `simulateCircuit(ops, nQubits)` | Simulates an entire circuit (ops sorted by column) |
| `statesEqual(s1, s2, tolerance)` | Compares two state vectors up to global phase (for puzzle verification) |
| `explainCircuit(ops, nQubits)` | Generates structured explanation: state transformations, matrices, detected concepts |

### `aiTutor.js` — AI Integration Layer

| Function | Purpose |
|---|---|
| `getGroqResponse(message, history, module, topic)` | Sends chat to Groq API with system prompt, conversation history, and module context. Cycles through 7 candidate models on failure. Returns formatted Markdown. |
| `getAIResponse(message, module, topic)` | Synchronous fallback using keyword matching (offline mode) |
| `explainCircuitWithGroq(ops, nQubits)` | Sends circuit gate sequence to LLM for a structured 4-section explanation |
| `cleanResponseContent(text)` | Strips `<think>` reasoning tags from model outputs |
| `buildSystemPrompt(module, topic)` | Constructs the LLM system prompt with formatting requirements and student context |

**Model Fallback Chain:** `openai/gpt-oss-120b` → `openai/gpt-oss-20b` → `qwen/qwen3.6-27b` → `groq/compound` → `qwen/qwen3.8-27b` → `llama-3.3-70b-versatile` → `llama-3.1-8b-instant`

### `adaptive.js` — Adaptive Learning Engine

| Function | Purpose |
|---|---|
| `generateRoadmap(skills, goal, completedModules)` | Generates a personalized module sequence based on skill assessment, learning goal, weak areas, and prerequisite graph. 6 goal profiles available. |
| `getNextModule(progress, skills, goal)` | Returns the next uncompleted module from the generated roadmap |
| `checkPrerequisites(moduleId, skills, completedModules)` | Verifies if a student meets prerequisites (completed modules or skill threshold ≥ 50%) |
| `updateSkillsFromScore(skills, moduleSkills, score)` | Updates skill levels using a weighted formula: `new = max(current, 0.7 × current + (score/100) × 30)` |
| `computeKnowledgeFromTest(answers, questions)` | Computes per-skill and overall scores from the initial knowledge test |

### `storage.js` — LocalStorage Persistence Layer

All keys are prefixed with `ql_` to avoid collisions. Provides typed getters/setters for:

| Data | Key Pattern | Description |
|---|---|---|
| Users list | `ql_users` | Array of all registered user objects |
| Current user | `ql_currentUser` | Active session user |
| Progress | `ql_progress_{userId}` | Completed modules/topics, scores, streak, test history |
| Skills | `ql_skills_{userId}` | 14 quantum competency scores (0–100) |
| Achievements | `ql_achievements_{userId}` | Unlocked achievement IDs |
| Saved Circuits | `ql_circuits_{userId}` | User's saved circuit designs |
| Lab Experiments | `ql_labs_{userId}` | Saved lab experiments |
| Chat History | `ql_chat_{userId}` | AI Tutor conversation log |
| Activity Log | `ql_activity_{userId}` | Daily activity counts (for heatmap) |
| Gate Usage | `ql_gateUsage_{userId}` | Gate usage frequency tracking |
| Puzzle Progress | `ql_puzzles_{userId}` | Completed circuit puzzles |

---

## 🧠 State Management

The app uses **React Context API** with two providers wrapping the entire app:

### `AuthContext`

| Value | Type | Description |
|---|---|---|
| `user` | Object \| null | Current authenticated user (id, name, email, isAdmin, goal, etc.) |
| `loading` | boolean | True while checking for saved session on mount |
| `register(data)` | Function | Creates a new user with default progress & skills |
| `login(email, pw)` | Function | Authenticates against localStorage user list |
| `logout()` | Function | Clears session |
| `updateUser(updates)` | Function | Patches user profile fields |

### `ProgressContext`

| Value | Type | Description |
|---|---|---|
| `progress` | Object | Completed modules, topics, scores, streak, test history |
| `skills` | Object | 14 skill levels (0–100) |
| `updateProgress(updates)` | Function | Patch progress object |
| `updateSkills(updates)` | Function | Patch skills object |
| `completeTopic(moduleId, topicId)` | Function | Marks a topic as completed, logs activity |
| `completeModule(moduleId, score)` | Function | Marks a module as completed with score |
| `recordTestScore(moduleId, score, details)` | Function | Records quiz result in test history |
| `updateSkillFromExercise(skillNames, score)` | Function | Updates skills based on exercise performance |
| `trackGateUsage(gateName)` | Function | Increments gate usage counter |
| `completePuzzle(puzzleId, relatedSkills)` | Function | Marks puzzle done + updates related skills |
| `getOverallKnowledge()` | Function | Returns average across all 14 skills |

---

## 📦 Data Layer

### `modules.js`

- **`MODULES`** — Array of 24 module definitions, each with: `id`, `title`, `desc`, `category`, `prereqs[]`, `skills[]`
- **`MODULE_CATEGORIES`** — `['Foundations', 'Intermediate', 'Advanced', 'Expert']`
- **`GOALS`** — 6 learning goal options used during registration
- **`EDUCATION_LEVELS`** — 6 education levels (High School → Self-learner)
- **`SKILL_LABELS`** — Display names for 14 tracked skills
- **`ACHIEVEMENTS`** — 12 achievement definitions with unlock conditions

### `topics.js` / `topics2.js` / `topics3.js` / `topics4.js`

Each file exports topic content for a range of modules. Each topic includes:
- Title and description
- YouTube video lecture links
- KaTeX math expressions (Dirac notation, matrices)
- Interactive exercises and quizzes
- Related skill tags

### `topicCircuits.js`

Circuit puzzle definitions per topic with:
- `title`, `desc`, `hint`, `qubits` count
- `inputState` / `outputState` (Dirac notation strings)
- `expectedGates[]` — the correct solution sequence
- `verify()` — custom verification function

---

## 📚 Curriculum Structure (24 Modules)

| # | Module | Category | Skills |
|---|---|---|---|
| 1 | Computing, Mathematics & Quantum Foundations | Foundations | Mathematics |
| 2 | Qubits & Quantum States | Foundations | Qubits |
| 3 | Single-Qubit Quantum Gates | Foundations | Gates |
| 4 | Multi-Qubit Systems & Entanglement | Foundations | Gates, Qubits |
| 5 | Quantum Circuit Design | Foundations | Circuits |
| 6 | Measurement & Quantum Information | Foundations | Circuits, Qubits |
| 7 | Quantum Programming with Qiskit | Intermediate | Qiskit |
| 8 | Quantum SDK Ecosystem | Intermediate | Qiskit |
| 9 | Fundamental Quantum Algorithms | Intermediate | Algorithms |
| 10 | Advanced Quantum Algorithms | Intermediate | Algorithms |
| 11 | Quantum Machine Learning | Advanced | QML |
| 12 | Quantum Noise & NISQ | Advanced | Noise |
| 13 | Quantum Error Correction | Advanced | Error Correction |
| 14 | Quantum Circuit Optimization | Advanced | Circuits |
| 15 | Quantum Hardware & Real-World Computing | Advanced | Hardware |
| 16 | Capstone Projects | Advanced | Algorithms, Circuits |
| 17 | Quantum Research, Industry & Careers | Expert | Research |
| 18 | Quantum Cryptography & Communication | Expert | Cryptography |
| 19 | Variational Quantum & Optimization | Expert | Optimization |
| 20 | Quantum Networking & Distributed QC | Expert | Cryptography, Research |
| 21 | Applications, Industry & Careers | Expert | Research |
| 22 | Research Methodology & Projects | Expert | Research |
| 23 | Real Quantum Hardware & Cloud | Expert | Hardware, Qiskit |
| 24 | Quantum Simulation | Expert | Simulation |

---

## 🏆 Achievement System

| Badge | Icon | Unlock Condition |
|---|---|---|
| Qubit Explorer | ⚛️ | Complete Module 2 |
| Gate Master | 🚪 | Complete Modules 3 & 4 |
| Circuit Builder | 🔧 | Complete 5 circuit challenges |
| Bell State Builder | 🔔 | Build a Bell state in the Circuit Builder |
| Quantum Programmer | 💻 | Complete Module 7 |
| Algorithm Explorer | 🧮 | Complete Module 9 |
| Quantum Lab Scientist | 🔬 | Run 10 lab experiments |
| QML Practitioner | 🤖 | Complete Module 11 |
| Quantum Researcher | 📚 | Complete Module 22 |
| Error Correction Expert | 🛡️ | Complete Module 13 |
| Quantum Architect | 🏛️ | Complete all 24 modules |
| Week Warrior | 🔥 | 7-day learning streak |

---

## 🔒 Authentication & Authorization

- **Registration:** Collects name, email, password, education level, and learning goal. Creates default progress (all zeros) and skill profiles.
- **Login:** Validates credentials against the localStorage user list.
- **Session:** Persisted via `ql_currentUser` in localStorage. Auto-restored on page reload.
- **Protected Routes:** All app routes (except `/login`, `/register`) require authentication via the `ProtectedRoute` wrapper.
- **Admin Routes:** `/admin` requires `user.isAdmin === true`.

> ⚠️ **Note:** This is a client-side-only auth system designed for demonstration/educational purposes. Passwords are stored in plaintext in localStorage. Do not use for production with real user credentials.

---

## 📊 Admin Panel

Accessible only to admin users. Contains three tabs:

### 👥 Users Tab
- Table of all registered students with name, email, education, goal
- "Reset Progress" action per user

### 📚 Modules Tab
- Complete curriculum table with module ID, title, category, and skill tags

### 📈 Platform Analytics Tab
- **Stats Cards:** Total users, curriculum modules (24), total gates used
- **Activity Heatmap:** GitHub-style 26-week Canvas heatmap of aggregated user activity
- **Gate Usage Chart:** Canvas bar chart showing most-used quantum gates across all users
- **Completion Funnel:** Category-level completion rates (Foundations → Expert) showing student drop-off

---

## 🔑 Default Admin Credentials

```
Email:    admin@quantumlearn.ai
Password: admin123
```

The admin account is auto-seeded on first load if it doesn't exist.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Production build → `./dist` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run deterministic utility and configuration tests |

The production build lazy-loads route pages to keep the initial JavaScript entry bundle small. The test suite covers Supabase configuration handling, knowledge scoring, roadmap behavior, skill updates, core quantum gates, Bell-state simulation, and global-phase state comparison.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ for quantum computing education
</p>
