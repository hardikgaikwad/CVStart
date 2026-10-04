"""
System Diagnostics Utility for CVstart.
Checks environment health: LaTeX compilers, Ollama status, storage, and platform details.
"""

import os
import sys
import shutil
import platform
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
import httpx
from django.conf import settings

def find_latex_compiler() -> Dict[str, Any]:
    """
    Detect an installed LaTeX compiler.
    Prioritizes Tectonic in bin/, then in PATH, then pdflatex, xelatex.
    """
    # 1. Check bin/ directory in project root
    bin_tectonic = settings.BASE_DIR / 'bin' / ('tectonic.exe' if os.name == 'nt' else 'tectonic')
    candidates = []
    if bin_tectonic.exists():
        candidates.append(('tectonic', str(bin_tectonic)))

    # 2. Check PATH
    for name in ['tectonic', 'pdflatex', 'xelatex', 'lualatex']:
        path = shutil.which(name)
        if path and (name, path) not in candidates:
            candidates.append((name, path))

    # Test each candidate
    for name, path in candidates:
        try:
            flag = '--version' if name == 'tectonic' else '-version'
            res = subprocess.run(
                [path, flag],
                capture_output=True,
                text=True,
                timeout=5,
                check=False
            )
            if res.returncode == 0:
                first_line = (res.stdout or res.stderr).splitlines()[0] if (res.stdout or res.stderr) else ''
                return {
                    'available': True,
                    'compiler_type': name,
                    'executable_path': path,
                    'version_info': first_line.strip(),
                    'error': None
                }
        except Exception as e:
            continue

    # Not found
    os_name = platform.system()
    if os_name == 'Windows':
        install_help = (
            "No LaTeX compiler detected. Download Tectonic to your bin/ folder "
            "or run: winget install tectonic / choco install tectonic / scoop install tectonic"
        )
    elif os_name == 'Darwin':
        install_help = "Run: brew install tectonic"
    else:
        install_help = "Run: cargo install tectonic or sudo apt-get install texlive-latex-base"

    return {
        'available': False,
        'compiler_type': None,
        'executable_path': None,
        'version_info': None,
        'error': 'No supported LaTeX compiler found in system PATH or bin/',
        'install_guidance': install_help
    }

def check_ollama_status(url: Optional[str] = None) -> Dict[str, Any]:
    """
    Check if local Ollama service is reachable and retrieve installed models.
    """
    base_url = url or settings.CVSTART_SETTINGS.get('OLLAMA_URL', 'http://127.0.0.1:11434')
    endpoint = f"{base_url.rstrip('/')}/api/tags"

    try:
        with httpx.Client(timeout=2.5) as client:
            response = client.get(endpoint)
            if response.status_code == 200:
                data = response.json()
                models = data.get('models', [])
                model_names = [m.get('name') for m in models if isinstance(m, dict)]
                return {
                    'available': True,
                    'url': base_url,
                    'status_code': response.status_code,
                    'models_count': len(models),
                    'models': model_names,
                    'details': models,
                    'error': None,
                }
            else:
                return {
                    'available': False,
                    'url': base_url,
                    'status_code': response.status_code,
                    'models_count': 0,
                    'models': [],
                    'error': f"Ollama returned HTTP {response.status_code}"
                }
    except httpx.ConnectError:
        return {
            'available': False,
            'url': base_url,
            'models_count': 0,
            'models': [],
            'error': "Cannot connect to Ollama. Make sure Ollama is installed and running (`ollama serve`).",
            'install_guidance': "Install Ollama from https://ollama.com and run 'ollama serve'."
        }
    except Exception as e:
        return {
            'available': False,
            'url': base_url,
            'models_count': 0,
            'models': [],
            'error': str(e)
        }

def get_workspace_info() -> Dict[str, Any]:
    """Inspect workspace directories, storage, and database."""
    ws = settings.CVSTART_SETTINGS['WORKSPACE_DIR']
    db_file = ws / 'cvstart.sqlite3'
    db_size = db_file.stat().st_size if db_file.exists() else 0

    return {
        'workspace_path': str(ws),
        'is_writable': os.access(str(ws), os.W_OK),
        'database_exists': db_file.exists(),
        'database_size_bytes': db_size,
    }

def get_full_diagnostics() -> Dict[str, Any]:
    """Collect complete system diagnostics."""
    return {
        'platform': {
            'os': platform.system(),
            'os_release': platform.release(),
            'os_version': platform.version(),
            'python_version': platform.python_version(),
            'executable': sys.executable,
        },
        'latex': find_latex_compiler(),
        'ollama': check_ollama_status(),
        'workspace': get_workspace_info(),
        'app_version': '0.1.0',
    }
