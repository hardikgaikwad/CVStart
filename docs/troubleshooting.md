# CVstart Troubleshooting Guide

This document provides solutions for common issues encountered during setup, compilation, and model inference.

---

## 1. Port Conflicts (`Port 9999 is already in use`)

### Symptom
When running `CVstart`, you see an error:
```
[ERROR] Port 9999 is already in use on 127.0.0.1.
To specify a different port, run:
    CVstart --port <PORT>
```

### Solutions
1. **Specify an alternative port:**
   ```bash
   CVstart --port 10000
   ```
2. **Find and terminate the process holding port 9999:**
   - **On Windows (PowerShell):**
     ```powershell
     netstat -ano | findstr :9999
     # Identify the PID in the rightmost column, then terminate:
     Stop-Process -Id <PID> -Force
     ```
   - **On Linux / macOS:**
     ```bash
     lsof -i :9999
     kill -9 <PID>
     ```

---

## 2. Ollama Connection Issues

### Symptom A: `Ollama is not running at http://127.0.0.1:11434`
- CVstart shows a warning banner: *"Ollama server is unreachable."*
- Model selector in settings displays no installed models.

### Solutions
1. **Verify Ollama is started:**
   - Open a terminal and run `ollama list`.
   - If Ollama is not running as a background service, start it manually:
     ```bash
     ollama serve
     ```
2. **Custom Ollama Host/Port:**
   - If your Ollama server is running on a custom port or remote LAN address, specify it in your `.env` file:
     ```env
     OLLAMA_BASE_URL=http://localhost:11434
     ```

### Symptom B: `No models found in Ollama`
- Ollama is running, but no models appear in the CVstart Model dropdown.

### Solution
- Download a model using the command line:
  ```bash
  ollama pull llama3.2
  ```
- Navigate to the **Model Settings** page in CVstart and click **Refresh Models**.

---

## 3. LaTeX Compilation & PDF Generation Issues

### Symptom A: `No supported LaTeX compiler found on system PATH`
- CVstart reports that compilation is unavailable.

### Solutions
1. **Verify compiler installation:**
   - Check if `tectonic` or `pdflatex` is installed:
     ```bash
     tectonic --version
     # or
     pdflatex --version
     ```
2. **Check executable location:**
   - CVstart automatically checks the project's `bin/` directory for `tectonic.exe` or `tectonic`.
   - If installed in a non-standard directory, set the path in `.env`:
     ```env
     TECTONIC_PATH=C:\tools\tectonic\tectonic.exe
     ```
3. **Ensure directory is on PATH:**
   - On Windows, verify that your compiler folder is included in the System `PATH` environment variable.

### Symptom B: First compilation with Tectonic takes 10-15 seconds
- On the very first compilation, Tectonic downloads the required standard TeX packages (e.g., `titlesec`, `enumitem`, `xcolor`) from its package repository and caches them in your local user directory (`%LOCALAPPDATA%\Tectonic\cache`).
- **Resolution:** Subsequent compilations read from the local cache and complete in **under 1 second**.

### Symptom C: `LaTeX compilation failed with errors`
- This occurs when invalid syntax is entered into the **LaTeX Source Editor**.
- **Resolution:**
  1. Open the **Diagnostics** drawer at the bottom of the editor.
  2. Inspect the highlighted line numbers and error descriptions.
  3. Click **Restore Last Valid Version** in the toolbar to revert to the last working build.

---

## 4. Frontend Assets Missing (`frontend/dist/index.html not found`)

### Symptom
Launching `CVstart` outputs:
```
[ERROR] Frontend build not found at frontend/dist/index.html.
Run `npm run build` in the frontend/ directory first.
```

### Solution
Build the React frontend using the provided helper:
```bash
python scripts/build_frontend.py
```
Or manually:
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 5. System Diagnostics Command

To diagnose all subsystem dependencies in a single output, run:

```bash
CVstart --check
# or
python scripts/check_dependencies.py
```

This will test Python, Ollama, LaTeX, storage permissions, and frontend assets, providing immediate actionable guidance for any failing component.
