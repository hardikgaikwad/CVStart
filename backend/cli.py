"""
CVstart Command Line Interface and Application Launcher.
Provides the single-command startup experience via `CVstart`.
"""

import os
import sys
import time
import socket
import signal
import webbrowser
import argparse
import platform
import subprocess
from pathlib import Path

# Locate project base directory
BASE_DIR = Path(__file__).resolve().parent.parent

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a network port is already bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.bind((host, port))
            return False
        except OSError:
            return True

def get_python_executable() -> str:
    """Resolve the real python runtime even when launched as a console_script binary."""
    exec_path = Path(sys.executable)
    if exec_path.stem.lower().startswith('python'):
        return str(exec_path)
    candidate = exec_path.parent / ('python.exe' if os.name == 'nt' else 'python')
    if candidate.exists():
        return str(candidate)
    return sys.executable

def run_checks_and_diagnostics(verbose: bool = True) -> bool:
    """Check system prerequisites: Python, LaTeX compiler, Ollama, workspace."""
    # Ensure sys.path includes BASE_DIR
    if str(BASE_DIR) not in sys.path:
        sys.path.insert(0, str(BASE_DIR))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
    import django
    django.setup()

    from backend.apps.system.diagnostics import get_full_diagnostics
    diag = get_full_diagnostics()

    if verbose:
        print("\n" + "=" * 60)
        print("          CVstart - System Readiness Diagnostics")
        print("=" * 60)
        print(f"Platform:        {diag['platform']['os']} {diag['platform']['os_release']} ({diag['platform']['python_version']})")
        print(f"Workspace:       {diag['workspace']['workspace_path']} (writable: {diag['workspace']['is_writable']})")

        latex = diag['latex']
        if latex['available']:
            print(f"LaTeX Compiler:  [OK] {latex['compiler_type']} ({latex.get('version_info', '')})")
            print(f"Path:            {latex['executable_path']}")
        else:
            print(f"LaTeX Compiler:  [WARNING] Missing compiler.")
            print(f"Guidance:        {latex.get('install_guidance', '')}")

        ollama = diag['ollama']
        if ollama['available']:
            print(f"Ollama Server:   [OK] Connected at {ollama['url']} ({ollama['models_count']} model(s) installed)")
            if ollama['models']:
                print(f"Models:          {', '.join(ollama['models'])}")
        else:
            print(f"Ollama Server:   [NOTICE] {ollama.get('error', 'Not connected')}")
            print("Note:            CVstart structured editor & compiler work without Ollama.")
            print("                 Start 'ollama serve' to enable AI natural language features.")

        print("=" * 60 + "\n")

    return True

def ensure_frontend_build():
    """Ensure production React build exists in frontend/dist/."""
    dist_dir = BASE_DIR / "frontend" / "dist"
    index_file = dist_dir / "index.html"
    if not index_file.exists():
        print("Production frontend build not found in frontend/dist/. Building now...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=str(BASE_DIR / "frontend"), check=True)
            print("Frontend build complete.")
        except Exception as e:
            print(f"Warning: Could not build frontend automatically: {e}")
            print("Run 'npm run build' in the frontend/ directory.")

def apply_migrations():
    """Apply any pending database migrations before launching."""
    manage_py = BASE_DIR / "backend" / "manage.py"
    python_bin = get_python_executable()
    try:
        subprocess.run(
            [python_bin, str(manage_py), "migrate", "--noinput"],
            cwd=str(BASE_DIR),
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error applying migrations:\n{e.stderr}")
        raise

def main():
    """Entry point for the CVstart single command."""
    parser = argparse.ArgumentParser(
        prog="CVstart",
        description="CVstart: Local-First, AI-Powered Agentic LaTeX Resume Builder"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=9999,
        help="Port to bind the CVstart server (default: 9999)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host address to bind (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="",
        help="Preferred local Ollama model (e.g. llama3.2, mistral)"
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically open default browser on launch"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Run system dependency diagnostics and exit"
    )
    parser.add_argument(
        "--version",
        action="version",
        version="CVstart 0.1.0"
    )

    args = parser.parse_args()

    # If --check was passed, run diagnostics and exit
    if args.check:
        run_checks_and_diagnostics(verbose=True)
        sys.exit(0)

    # 1. System Readiness Checks
    run_checks_and_diagnostics(verbose=False)

    # 2. Port conflict check
    if is_port_in_use(args.port, args.host):
        print("\n" + "!" * 60)
        print(f"PORT CONFLICT: Port {args.port} is already in use on {args.host}.")
        print("!" * 60)
        print(f"To run CVstart on an alternative port, use the --port option:")
        print(f"    CVstart --port {args.port + 1}")
        print("\nOr terminate the process occupying the port and retry.")
        sys.exit(1)

    # 3. Prepare workspace & database
    workspace_dir = BASE_DIR / "workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)
    apply_migrations()

    # 4. Ensure production frontend build is available
    ensure_frontend_build()

    # 5. Environment configuration
    os.environ["CVSTART_HOST"] = args.host
    if args.model:
        os.environ["CVSTART_MODEL"] = args.model

    server_url = f"http://{args.host}:{args.port}"

    print("\n" + "=" * 60)
    print("  * * * * *   CVstart Local Server Starting   * * * * *")
    print("=" * 60)
    print(f"  URL:           {server_url}")
    print(f"  Mode:          Local-First Production Bundle")
    print(f"  Storage:       SQLite ({workspace_dir / 'cvstart.sqlite3'})")
    print(f"  Default Port:  {args.port}")
    print(f"  Press Ctrl+C to shut down cleanly.")
    print("=" * 60 + "\n")

    # 6. Launch browser if requested
    if not args.no_browser:
        def open_browser():
            time.sleep(1.2)
            try:
                webbrowser.open(server_url)
            except Exception:
                pass
        import threading
        threading.Thread(target=open_browser, daemon=True).start()

    # 7. Start Django development/production-serving process
    manage_py = BASE_DIR / "backend" / "manage.py"
    bind_target = f"{args.host}:{args.port}"
    python_bin = get_python_executable()
    cmd = [
        python_bin,
        str(manage_py),
        "runserver",
        bind_target
    ]

    server_process = None
    try:
        server_process = subprocess.Popen(cmd, cwd=str(BASE_DIR))
        server_process.wait()
    except KeyboardInterrupt:
        print("\nStopping CVstart cleanly...")
    finally:
        if server_process and server_process.poll() is None:
            server_process.terminate()
            try:
                server_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                server_process.kill()
        print("CVstart stopped.")

if __name__ == "__main__":
    main()
