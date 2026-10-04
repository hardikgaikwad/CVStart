# CVstart Installation Guide

This guide covers installing and configuring **CVstart** on Windows, macOS, and Linux.

---

## 1. System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **Operating System** | Windows 10/11 64-bit, macOS 12+, Linux (Ubuntu 22.04+) | Windows 11 64-bit |
| **Python** | Python 3.10+ | Python 3.11 or 3.12 |
| **Node.js** (dev only) | Node.js 18+ & npm 9+ | Node.js 20 LTS |
| **RAM** | 8 GB | 16 GB+ (for local LLMs) |
| **Storage** | 2 GB free space | 10 GB free space (for Ollama models) |
| **GPU** (optional) | CPU inference supported | NVIDIA GPU with 6GB+ VRAM for fast inference |

---

## 2. Core Dependencies Setup

### 2.1 Install Ollama (Local AI Engine)

CVstart utilizes [Ollama](https://ollama.ai/) for running open-weight AI models locally without transmitting resume data to cloud servers.

1. **Download & Install Ollama:**
   - **Windows:** Download and run the Windows installer from [ollama.ai/download/windows](https://ollama.ai/download/windows).
   - **macOS:** Download the macOS `.zip` from [ollama.ai/download/mac](https://ollama.ai/download/mac).
   - **Linux:** Run `curl -fsSL https://ollama.ai/install.sh | sh`.

2. **Verify Ollama is Running:**
   ```bash
   ollama --version
   ```

3. **Pull a Recommended Model:**
   Open a terminal and pull a capable local model:
   ```bash
   # Lightweight & fast (recommended default, ~2.0 GB)
   ollama pull llama3.2

   # Or for larger context & stronger reasoning (~4.1 GB)
   ollama pull mistral
   ```

### 2.2 Install a LaTeX Compiler

CVstart uses a local LaTeX engine to compile resumes into professional PDFs in seconds. We strongly recommend **Tectonic**, a modern, standalone LaTeX engine that automatically caches required packages.

#### Option A: Tectonic (Recommended)
- **Windows (Bundled or Manual):**
  CVstart includes `tectonic.exe` in its `bin/` directory. Alternatively, install via Scoop or Cargo:
  ```powershell
  # Using Scoop
  scoop install tectonic

  # Using Winget
  winget install tectonic
  ```
- **macOS:**
  ```bash
  brew install tectonic
  ```
- **Linux:**
  ```bash
  # Ubuntu/Debian
  sudo apt-get install tectonic
  # Arch Linux
  sudo pacman -S tectonic
  ```

#### Option B: TeX Live / MiKTeX (Alternative)
- If you already have `pdflatex` or `xelatex` installed via TeX Live or MiKTeX on your system `PATH`, CVstart will automatically detect and utilize it.

---

## 3. CVstart Installation Steps

### 3.1 Clone the Repository
```bash
git clone https://github.com/your-username/cvstart.git
cd cvstart
```

### 3.2 Create and Activate a Python Virtual Environment

- **On Windows (PowerShell):**
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
- **On Linux / macOS:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

### 3.3 One-Step Automated Setup

Run the automated setup script, which installs the Python package in editable mode, applies database migrations, and builds the frontend assets:

```bash
python scripts/setup.py
```

### 3.4 Manual Installation (Alternative)

If you prefer to configure components individually:

1. **Install Python Package & Dependencies:**
   ```bash
   pip install -e .
   ```

2. **Apply Database Migrations:**
   ```bash
   python backend/manage.py migrate
   ```

3. **Build the React Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Verify Dependencies:**
   ```bash
   python scripts/check_dependencies.py
   ```

---

## 4. Launching the Application

Once installed, launch CVstart with the single command:

```bash
CVstart
```

- CVstart will automatically:
  1. Verify the operating system and Python environment.
  2. Confirm Ollama availability and discover installed models.
  3. Validate the LaTeX compiler.
  4. Ensure database migrations and frontend production assets are ready.
  5. Launch the unified server on `http://127.0.0.1:9999`.
  6. Automatically open your default web browser to the application dashboard.

To stop the server at any time, press `Ctrl + C` in the terminal window.
