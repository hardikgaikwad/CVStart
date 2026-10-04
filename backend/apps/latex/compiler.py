"""
Secure LaTeX Compilation Engine for CVstart.
Executes sandboxed subprocess compilations, enforces strict timeouts, no shell escapes, and captures structured diagnostics.
"""

import os
import re
import time
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from django.conf import settings
from backend.apps.system.diagnostics import find_latex_compiler
from .validator import validate_latex_source

class CompilationError(Exception):
    """Custom exception raised when compilation fails."""
    def __init__(self, message: str, diagnostics: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.diagnostics = diagnostics or {}

def parse_compiler_errors(output: str) -> List[Dict[str, Any]]:
    """
    Extract LaTeX errors, line numbers, and context snippets from compiler logs.
    """
    errors = []
    lines = output.splitlines()

    i = 0
    while i < len(lines):
        line = lines[i]
        # Common TeX error marker: starts with '!'
        if line.startswith('!') or 'error:' in line.lower():
            err_msg = line.strip()
            line_no = None
            snippet = []

            # Check next few lines for 'l.<number>' indicating line number
            j = i + 1
            while j < min(i + 8, len(lines)):
                next_line = lines[j]
                line_match = re.search(r'l\.(\d+)', next_line)
                if line_match:
                    line_no = int(line_match.group(1))
                    snippet.append(next_line.strip())
                elif next_line.strip() and not next_line.startswith('!'):
                    snippet.append(next_line.strip())
                j += 1

            errors.append({
                'message': err_msg,
                'line_number': line_no,
                'context': ' '.join(snippet[:3])
            })
            i = j
        else:
            i += 1

    return errors

def compile_latex_to_pdf(
    source: str,
    resume_id: str,
    timeout_seconds: Optional[int] = None
) -> Dict[str, Any]:
    """
    Compile LaTeX source code into a valid PDF.

    Args:
        source: LaTeX source code string.
        resume_id: Unique resume identifier for workspace output.
        timeout_seconds: Timeout limit in seconds.

    Returns:
        Structured result dictionary with status, output PDF path, logs, and parsed errors.
    """
    start_time = time.time()
    timeout = timeout_seconds or settings.CVSTART_SETTINGS.get('COMPILATION_TIMEOUT', 30)

    # 1. Pre-compilation safety validation
    validation = validate_latex_source(source)
    if not validation['valid']:
        return {
            'success': False,
            'pdf_path': None,
            'log': '\n'.join(validation['errors']),
            'errors': [{'message': err, 'line_number': None, 'context': ''} for err in validation['errors']],
            'compiler_used': 'pre-validator',
            'duration_seconds': round(time.time() - start_time, 3)
        }

    # 2. Check compiler availability
    compiler_info = find_latex_compiler()
    if not compiler_info['available']:
        return {
            'success': False,
            'pdf_path': None,
            'log': compiler_info['error'],
            'errors': [{
                'message': compiler_info['error'],
                'line_number': None,
                'context': compiler_info.get('install_guidance', '')
            }],
            'compiler_used': None,
            'duration_seconds': round(time.time() - start_time, 3)
        }

    compiler_type = compiler_info['compiler_type']
    compiler_path = compiler_info['executable_path']

    # 3. Dedicated temporary build directory
    with tempfile.TemporaryDirectory(prefix="cvstart_build_") as temp_dir:
        temp_path = Path(temp_dir)
        tex_file = temp_path / "resume.tex"
        tex_file.write_text(source, encoding="utf-8")

        # 4. Construct safe compiler arguments (no shell=True)
        if compiler_type == 'tectonic':
            cmd = [
                compiler_path,
                str(tex_file),
                '-o', str(temp_path),
            ]
        elif compiler_type in ('pdflatex', 'xelatex', 'lualatex'):
            cmd = [
                compiler_path,
                '-interaction=nonstopmode',
                '-no-shell-escape',
                f'-output-directory={temp_path}',
                str(tex_file)
            ]
        else:
            cmd = [compiler_path, str(tex_file)]

        # 5. Execute compilation
        try:
            process = subprocess.run(
                cmd,
                cwd=str(temp_path),
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            raw_stdout = process.stdout or ""
            raw_stderr = process.stderr or ""
            full_log = f"{raw_stdout}\n{raw_stderr}".strip()
            exit_code = process.returncode

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'pdf_path': None,
                'log': f"Compilation timed out after {timeout} seconds.",
                'errors': [{'message': f"Compilation exceeded timeout limit ({timeout}s).", 'line_number': None, 'context': ''}],
                'compiler_used': compiler_type,
                'duration_seconds': round(time.time() - start_time, 3)
            }
        except Exception as e:
            return {
                'success': False,
                'pdf_path': None,
                'log': str(e),
                'errors': [{'message': f"Subprocess execution error: {e}", 'line_number': None, 'context': ''}],
                'compiler_used': compiler_type,
                'duration_seconds': round(time.time() - start_time, 3)
            }

        # 6. Verify and validate generated PDF
        generated_pdf = temp_path / "resume.pdf"
        if not generated_pdf.exists() or generated_pdf.stat().st_size < 100:
            parsed_errors = parse_compiler_errors(full_log)
            if not parsed_errors:
                parsed_errors = [{
                    'message': 'Compiler finished without generating a valid PDF file.',
                    'line_number': None,
                    'context': full_log[-500:] if full_log else ''
                }]

            return {
                'success': False,
                'pdf_path': None,
                'log': full_log,
                'errors': parsed_errors,
                'compiler_used': compiler_type,
                'duration_seconds': round(time.time() - start_time, 3)
            }

        # Validate PDF header (%PDF-)
        try:
            with open(generated_pdf, 'rb') as f:
                header = f.read(5)
                if not header.startswith(b'%PDF-'):
                    return {
                        'success': False,
                        'pdf_path': None,
                        'log': "Output file is not a valid PDF format.",
                        'errors': [{'message': 'Invalid PDF header detected.', 'line_number': None, 'context': ''}],
                        'compiler_used': compiler_type,
                        'duration_seconds': round(time.time() - start_time, 3)
                    }
        except Exception as e:
            return {
                'success': False,
                'pdf_path': None,
                'log': str(e),
                'errors': [{'message': f"Failed reading output PDF: {e}", 'line_number': None, 'context': ''}],
                'compiler_used': compiler_type,
                'duration_seconds': round(time.time() - start_time, 3)
            }

        # 7. Persist to resume workspace
        resume_dir = settings.CVSTART_SETTINGS['WORKSPACE_DIR'] / str(resume_id)
        resume_dir.mkdir(parents=True, exist_ok=True)
        dest_pdf = resume_dir / "resume.pdf"
        shutil.copyfile(str(generated_pdf), str(dest_pdf))

        # Also save source for inspection and reference
        (resume_dir / "resume.tex").write_text(source, encoding="utf-8")

        duration = round(time.time() - start_time, 3)
        return {
            'success': True,
            'pdf_path': str(dest_pdf),
            'log': full_log,
            'errors': [],
            'compiler_used': compiler_type,
            'duration_seconds': duration
        }
