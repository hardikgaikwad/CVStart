#!/usr/bin/env python3
"""Build script for the CVstart React frontend.

Runs `npm run build` inside the frontend directory to produce the production assets in `frontend/dist/`.
"""
import subprocess
import sys
from pathlib import Path

def main():
    root = Path(__file__).resolve().parent.parent
    frontend_dir = root / 'frontend'
    
    if not frontend_dir.exists():
        print(f"[ERROR] Frontend directory not found at {frontend_dir}", file=sys.stderr)
        sys.exit(1)
        
    print(f"[*] Building React frontend in {frontend_dir}...")
    try:
        # On Windows, npm is npm.cmd
        cmd = ['npm.cmd', 'run', 'build'] if sys.platform == 'win32' else ['npm', 'run', 'build']
        result = subprocess.run(cmd, cwd=frontend_dir, check=True)
        print("[+] Frontend build successful! Output generated in frontend/dist/")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Frontend build failed with return code {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)
    except FileNotFoundError:
        print("[ERROR] npm executable not found on PATH. Ensure Node.js and npm are installed.", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
