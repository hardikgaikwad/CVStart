#!/usr/bin/env python3
"""One-time project setup script for CVstart.
Installs backend dependencies in editable mode, applies Django migrations, and builds the frontend.
"""
import subprocess
import sys
from pathlib import Path

def run_cmd(cmd, cwd=None):
    cmd_str = ' '.join(str(c) for c in cmd)
    print(f"[*] Running: {cmd_str}")
    subprocess.run(cmd, cwd=cwd, check=True)

def main():
    root = Path(__file__).resolve().parent.parent
    python_exe = sys.executable
    
    print("=" * 60)
    print("Setting up CVstart development & production environment")
    print("=" * 60)
    
    # 1. Install package in editable mode
    print("\n[Step 1/3] Installing Python package in editable mode...")
    run_cmd([python_exe, '-m', 'pip', 'install', '-e', '.'], cwd=root)
    
    # 2. Run Django migrations
    print("\n[Step 2/3] Applying database migrations...")
    manage_py = root / 'backend' / 'manage.py'
    run_cmd([python_exe, str(manage_py), 'migrate'], cwd=root)
    
    # 3. Build frontend if node/npm are available
    print("\n[Step 3/3] Checking and building frontend assets...")
    frontend_dir = root / 'frontend'
    if frontend_dir.exists():
        npm_cmd = 'npm.cmd' if sys.platform == 'win32' else 'npm'
        try:
            run_cmd([npm_cmd, 'install'], cwd=frontend_dir)
            run_cmd([npm_cmd, 'run', 'build'], cwd=frontend_dir)
            print("[+] Frontend build succeeded!")
        except Exception as e:
            print(f"[!] Warning: Could not complete frontend build ({e}). You may need to run `npm install && npm run build` inside frontend/ manually.")
            
    print("\n" + "=" * 60)
    print("[SUCCESS] Setup complete! You can now launch CVstart with:")
    print("   CVstart")
    print("or:")
    print("   python -m backend.cli")
    print("=" * 60)

if __name__ == '__main__':
    main()
