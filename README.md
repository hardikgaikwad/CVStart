# CVstart

**A Local-First, AI-Powered Agentic LaTeX Resume Builder**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://www.python.org/)
[![React: 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![LaTeX: Tectonic](https://img.shields.io/badge/LaTeX-Tectonic-purple.svg)](https://tectonic-typesetting.github.io/)
[![Inference: Ollama](https://img.shields.io/badge/Inference-Ollama%20(Local)-orange.svg)](https://ollama.ai/)
[![Tests: 19 Passed](https://img.shields.io/badge/Tests-19%20Passed-success.svg)](tests/)

---

## Overview

**CVstart** empowers software engineers, students, and professionals to create, edit, format, compile, inspect, and export stunning LaTeX resumes using natural language—without needing to write or debug complex LaTeX syntax.

Unlike conventional AI resume tools that merely generate raw text and dump it into an unverified document, CVstart features a **true agentic compile-inspect-correct loop**:
1. The AI translates user facts or instructions into a structured change plan.
2. The LaTeX engine compiles the source in a secure, sandboxed local environment.
3. The geometry inspection engine analyzes the resulting PDF text bounding boxes, density, margins, and page spills using PyMuPDF.
4. If an overflow or layout flaw is detected, the agent autonomously executes targeted corrections (up to 3 bounded iterations) to produce a flawless document.
5. All operations run **100% locally** on your machine using Ollama and local compilation—**zero cloud calls, zero telemetry, absolute privacy**.

---

## Key Features

- **🚀 One-Command Launch (`CVstart`):** Simply run `CVstart` in your terminal. It verifies all dependencies, runs database migrations, serves the optimized React SPA bundle through Django, and launches your default browser at `http://127.0.0.1:9999`.
- **🔒 100% Local-First Privacy:** Powered by local open-weight language models via Ollama (`llama3.2`, `mistral`, `deepseek-r1`, etc.). Your personal contact details and employment history never leave your computer.
- **📄 Native LaTeX Compilation with Sub-Second Turnaround:** Compiles locally via [Tectonic](https://tectonic-typesetting.github.io/) without shell escapes or security vulnerabilities. First-run bundles are cached for instantaneous subsequent builds.
- **🔍 Agentic Geometric Layout Inspection:** Uses PyMuPDF (`fitz`) to extract exact text bounding boxes, measure printable area density, compute page margins, and detect accidental page spills or cramped sections.
- **🔄 Closed-Loop Auto-Correction:** When layout issues are detected (e.g. 2-line spill onto page 2), the agent iteratively adjusts spacing, padding, and bullet margins within bounded limits (max 3 rounds) until the resume fits perfectly.
- **✍️ Dual-Mode Editing:**
  - **Structured Graphical Editor:** Repeatable forms for Personal Bio, Summary, Experience, Projects, Education, Skills, and Custom Sections.
  - **Direct LaTeX Source Editor:** Code editor with line numbers, syntax validation, error highlighting, copy-to-clipboard, and instant restore to the last valid version.
- **⚖️ Auditable Change Review & Diff Diffs:** Substantive AI changes are presented in a visual diff review card (added, removed, modified). Users retain complete control with one-click **Accept** or **Reject** actions.
- **🛡️ Factual Integrity Guardrail:** Anti-hallucination guardrails detect when an AI model attempts to introduce unverified employer names, degrees, or certifications, warning the user immediately.
- **📦 Multi-Format Export:** Download the publication-ready PDF or export the raw `.tex` source code at any time.

---

## Architecture

CVstart is built with a clean separation of concerns between client, orchestration, typesetting, and inspection:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              User Browser                               │
│        React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons           │
│    (Structured Form Editor | PDF Viewer | LaTeX Editor | AI Drawer)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (Port 9999)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Django 6.1 Application Server                        │
│    ├── Django REST Framework API (/api/resumes, /api/latex, /api/ai)    │
│    ├── Resumes App & SQLite ORM (cvstart.sqlite3)                       │
│    ├── AI Agent Orchestrator & Tool Registry (13 typed tools)           │
│    ├── LaTeX Escaper, Generator & AST Validator (No shell escape)       │
│    ├── Sandboxed Tectonic Compiler Subprocess (Ephemeral tempdir)       │
│    └── PDF Geometry & Density Analyzer (PyMuPDF / fitz)                 │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │ Subprocess                      │ HTTP (Port 11434)
┌───────────────────▼──────────────┐   ┌──────────────▼───────────────────┐
│     Tectonic LaTeX Engine        │   │        Ollama Local AI           │
│  (Locally cached package macro   │   │  (llama3.2, mistral, qwen2.5,    │
│   bundle; sandboxed compilation) │   │   deepseek-r1:7b, llava:vision)  │
└──────────────────────────────────┘   └──────────────────────────────────┘
```

For complete technical specifications, see [docs/architecture.md](docs/architecture.md).

---

## System Requirements

- **Operating System:** Windows 10/11 (Primary target), macOS 12+, or Linux (Ubuntu 22.04+).
- **Python:** Version 3.10 or higher.
- **Node.js:** Version 18+ (Required only if building the frontend from source).
- **Ollama:** Installed and running locally ([Download Ollama](https://ollama.ai/)).
- **LaTeX Compiler:** [Tectonic](https://tectonic-typesetting.github.io/) (Recommended and pre-bundled in `bin/tectonic.exe`) or any standard `pdflatex` on your system `PATH`.

---

## Quick Start in 3 Steps

### 1. Clone & Set Up Virtual Environment

```bash
git clone https://github.com/your-username/cvstart.git
cd cvstart

# Create & activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# (On Linux / macOS)
# python3 -m venv .venv
# source .venv/bin/activate
```

### 2. Run Automated Setup

The setup script installs the Python package in editable mode, applies Django migrations, and builds the frontend:

```bash
python scripts/setup.py
```

### 3. Launch CVstart

```bash
CVstart
```

Your default browser will automatically open to `http://127.0.0.1:9999` with the CVstart workspace ready for use!

---

## CLI Options

The `CVstart` command includes comprehensive CLI flags for custom environments:

```text
usage: CVstart [-h] [--port PORT] [--host HOST] [--model MODEL]
               [--no-browser] [--check] [--version]

Options:
  --port PORT      Port to run the application server on (default: 9999)
  --host HOST      Host address to bind to (default: 127.0.0.1 for local privacy)
  --model MODEL    Default Ollama model to select (e.g. llama3.2, mistral)
  --no-browser     Do not automatically open the browser on startup
  --check          Run dependency and environment diagnostics and exit
  --version        Show application version and exit
```

### Example: Running Environment Diagnostics
```bash
CVstart --check
```
Output:
```text
============================================================
CVstart System & Dependency Diagnostics
============================================================
OS:            Windows 11 (AMD64)
Python:        3.11.9
LaTeX Compiler: [OK] tectonic at bin\tectonic.exe (v0.17.0)
Ollama AI:     [OK] Running at http://127.0.0.1:11434 - Found 3 models
Workspace:     [OK] Writable at z:\...\workspace
Frontend Dist: [OK] Built assets present at frontend/dist/index.html
============================================================
[+] System is ready for full AI generation, compilation, and PDF rendering!
============================================================
```

---

## Verification & Testing

CVstart comes with a comprehensive automated test suite covering unit, integration, and security layers:

```bash
pytest -v
```

### Test Suite Coverage (19/19 Tests Passing)
- **Resume CRUD & Schema:** Pydantic validation, SQLite persistence, version history snapshots, and rollback.
- **LaTeX Escaping:** Strict escaping of `#`, `$`, `%`, `&`, `_`, `{`, `}`, `\`, and URL protocol sanitization.
- **LaTeX Security:** AST and token validation rejecting `\write18`, `\catcode`, `\immediate`, and file inclusion macros.
- **Compilation Engine:** Sandboxed temporary execution, timeout termination, error line parsing, and PDF byte verification.
- **PDF Geometry Inspection:** PyMuPDF extraction of page counts, margins, text block dimensions, and density metrics.
- **AI Tool Registry:** Strict input/output schema validation across all 13 application tools.
- **Factual Integrity Guardrail:** Anti-hallucination validation flagging unverified organizations.

---

## Documentation Index

- [docs/architecture.md](docs/architecture.md) — Comprehensive technical architecture, data models, and sequence diagrams.
- [docs/installation.md](docs/installation.md) — Detailed installation guide for Windows, macOS, and Linux.
- [docs/troubleshooting.md](docs/troubleshooting.md) — Port conflict resolution, Ollama troubleshooting, and compilation diagnostics.
- [docs/security.md](docs/security.md) — LaTeX sandboxing, input sanitization, threat models, and local-first privacy.
- [docs/user_guide.md](docs/user_guide.md) — Step-by-step user manual with feature walkthroughs and workflow tips.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
