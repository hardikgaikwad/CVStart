"""
LaTeX string escaping and sanitization utilities.
Ensures user-supplied content cannot break LaTeX syntax or inject malicious commands.
"""

import re
from typing import Any

# LaTeX special characters mapping
LATEX_SPECIAL_CHARS = [
    ('\\', r'\textbackslash{}'),
    ('&', r'\&'),
    ('%', r'\%'),
    ('$', r'\$'),
    ('#', r'\#'),
    ('_', r'\_'),
    ('{', r'\{'),
    ('}', r'\}'),
    ('~', r'\textasciitilde{}'),
    ('^', r'\textasciicircum{}'),
]

# Unicode punctuation normalization
UNICODE_REPLACEMENTS = [
    ('“', "``"),
    ('”', "''"),
    ('‘', "`"),
    ('’', "'"),
    ('—', "---"),
    ('–', "--"),
    ('…', "..."),
    ('•', r"\textbullet{}"),
    ('©', r"\textcopyright{}"),
    ('®', r"\textregistered{}"),
    ('™', r"\texttrademark{}"),
    ('°', r"\textdegree{}"),
    ('±', r"$\pm$"),
]

def escape_latex(text: Any) -> str:
    """
    Safely escape a string for inclusion in standard LaTeX text mode.
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)

    # First normalize unicode quotes and dashes
    for orig, rep in UNICODE_REPLACEMENTS:
        text = text.replace(orig, rep)

    # Escape backslash first to prevent escaping replacement backslashes
    text = text.replace('\\', r'\textbackslash{}')

    # Escape other specials
    for char, replacement in LATEX_SPECIAL_CHARS[1:]:
        text = text.replace(char, replacement)

    # Also handle < and > for cleaner PDF text
    text = text.replace('<', r'\textless{}')
    text = text.replace('>', r'\textgreater{}')

    return text

def sanitize_url(url: str) -> str:
    r"""
    Sanitize a URL for use in \href or \url.
    Permits only safe schemes: http, https, mailto, tel.
    """
    if not url:
        return ""
    url = url.strip()
    # Strip javascript: or data: pseudo schemes
    lower = url.lower()
    if lower.startswith(('javascript:', 'data:', 'file:', 'vbscript:')):
        return ""
    if not lower.startswith(('http://', 'https://', 'mailto:', 'tel://')):
        url = 'https://' + url
    # Escape % and # for LaTeX hyperref
    safe_url = url.replace('%', r'\%').replace('#', r'\#')
    return safe_url
