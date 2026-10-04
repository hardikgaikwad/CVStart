"""
LaTeX Safety and Syntax Validator.
Scans LaTeX source for prohibited execution primitives, unbalanced environments, and structural defects.
"""

import re
from typing import Dict, Any, List

DANGEROUS_PATTERNS = [
    (r'\\write18\b', "Shell escape primitive '\\write18' is strictly prohibited."),
    (r'\\immediate\s*\\write', "Direct file output primitives are prohibited."),
    (r'\\openin\b', "Raw file input primitives are prohibited."),
    (r'\\openout\b', "Raw file output primitives are prohibited."),
    (r'\\input\s*\{', "Arbitrary file inclusion via '\\input' is prohibited."),
    (r'\\include\s*\{', "Arbitrary file inclusion via '\\include' is prohibited."),
    (r'\\directlua\b', "Lua execution via '\\directlua' is prohibited."),
    (r'\\catcode\b', "Low-level catcode manipulation is restricted."),
    (r'\\special\s*\{', "Raw driver specials are restricted."),
    (r'\\def\\', "Recursive macro redefinition is restricted."),
]

def strip_latex_comments(source: str) -> str:
    r"""Remove LaTeX comments (% to end of line, unless escaped with \%)."""
    lines = source.splitlines()
    clean_lines = []
    for line in lines:
        # Match % not preceded by \
        clean_line = re.sub(r'(?<!\\)%.*$', '', line)
        clean_lines.append(clean_line)
    return '\n'.join(clean_lines)

def validate_latex_source(source: str) -> Dict[str, Any]:
    """
    Validate LaTeX source against security and structural guidelines.
    Returns:
        {
            'valid': bool,
            'errors': List[str],
            'warnings': List[str]
        }
    """
    errors: List[str] = []
    warnings: List[str] = []

    if not source or not source.strip():
        return {
            'valid': False,
            'errors': ['LaTeX source is empty.'],
            'warnings': []
        }

    # Check dangerous patterns
    for pattern, msg in DANGEROUS_PATTERNS:
        if re.search(pattern, source, re.IGNORECASE):
            errors.append(f"Security error: {msg}")

    cleaned = strip_latex_comments(source)

    # Required document structure
    if r'\documentclass' not in cleaned:
        errors.append("Document is missing '\\documentclass'.")
    if r'\begin{document}' not in cleaned:
        errors.append("Document is missing '\\begin{document}'.")
    if r'\end{document}' not in cleaned:
        errors.append("Document is missing '\\end{document}'.")

    # Check balanced braces outside comments
    open_braces = cleaned.count('{') - cleaned.count(r'\{')
    close_braces = cleaned.count('}') - cleaned.count(r'\}')
    if open_braces != close_braces:
        errors.append(f"Unbalanced curly braces: {open_braces} opening vs {close_braces} closing.")

    # Check balanced environments
    begin_envs = re.findall(r'\\begin\{([a-zA-Z0-9*]+)\}', cleaned)
    end_envs = re.findall(r'\\end\{([a-zA-Z0-9*]+)\}', cleaned)

    if len(begin_envs) != len(end_envs):
        warnings.append(f"Mismatched environment count: {len(begin_envs)} \\begin vs {len(end_envs)} \\end.")
    else:
        # Verify stack order
        stack = []
        tokens = re.finditer(r'\\(begin|end)\{([a-zA-Z0-9*]+)\}', cleaned)
        for t in tokens:
            tag_type = t.group(1)
            env_name = t.group(2)
            if tag_type == 'begin':
                stack.append(env_name)
            elif tag_type == 'end':
                if not stack:
                    errors.append(f"Found '\\end{{{env_name}}}' without matching '\\begin'.")
                    break
                expected = stack.pop()
                if expected != env_name:
                    errors.append(f"Mismatched environment nesting: expected '\\end{{{expected}}}' but found '\\end{{{env_name}}}'.")
                    break

    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings
    }
