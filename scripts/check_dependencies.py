#!/usr/bin/env python3
"""Dependency and environment verification script for CVstart.
Checks Python version, required modules, Ollama availability, LaTeX compiler, and frontend build.
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path so backend imports work
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.apps.system.diagnostics import check_all_diagnostics

def main():
    print("=" * 60)
    print("CVstart System & Dependency Diagnostics")
    print("=" * 60)
    
    diag = check_all_diagnostics()
    
    # OS
    os_info = diag.get("os", {})
    print(f"OS:            {os_info.get('system')} {os_info.get('release')} ({os_info.get('machine')})")
    print(f"Python:        {os_info.get('python_version')}")
    
    # LaTeX
    latex = diag.get("latex", {})
    if latex.get("available"):
        print(f"LaTeX Compiler: [OK] {latex.get('compiler')} at {latex.get('path')} (v{latex.get('version')})")
    else:
        print(f"LaTeX Compiler: [WARN] Not available. {latex.get('help', '')}")
        
    # Ollama
    ollama = diag.get("ollama", {})
    if ollama.get("running"):
        models = [m.get("name") for m in ollama.get("models", [])]
        print(f"Ollama AI:     [OK] Running at {ollama.get('base_url')} - Found {len(models)} models: {models}")
    else:
        print(f"Ollama AI:     [WARN] Not running at {ollama.get('base_url')}. {ollama.get('help', '')}")
        
    # Storage
    storage = diag.get("storage", {})
    if storage.get("writable"):
        print(f"Workspace:     [OK] Writable at {storage.get('workspace_path')}")
    else:
        print(f"Workspace:     [ERROR] Not writable at {storage.get('workspace_path')}")
        
    # Frontend Build
    frontend_dist = root / "frontend" / "dist" / "index.html"
    if frontend_dist.exists():
        print(f"Frontend Dist: [OK] Built assets present at {frontend_dist}")
    else:
        print(f"Frontend Dist: [WARN] Built assets missing at {frontend_dist}. Run `python scripts/build_frontend.py`")
        
    print("=" * 60)
    ready = diag.get("ready_for_generation", False)
    if ready:
        print("[+] System is ready for full AI generation, compilation, and PDF rendering!")
    else:
        print("[!] Note: CVstart can still be used for structured resume editing even without Ollama or LaTeX.")
    print("=" * 60)

if __name__ == '__main__':
    main()
