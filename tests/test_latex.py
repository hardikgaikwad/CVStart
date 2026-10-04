"""
Unit tests for LaTeX escaping, template generation, security validation, and compilation.
"""

import pytest
from backend.apps.latex.escaper import escape_latex, sanitize_url
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.validator import validate_latex_source
from backend.apps.latex.compiler import compile_latex_to_pdf

def test_latex_escaping():
    """Verify that dangerous and special characters are escaped properly."""
    raw = "C# & C++ in R&D: 100% of $50k _budget_ {with braces} ~tilde^"
    escaped = escape_latex(raw)
    assert r"\&" in escaped
    assert r"\%" in escaped
    assert r"\$" in escaped
    assert r"\#" in escaped
    assert r"\_" in escaped
    assert r"\{" in escaped
    assert r"\}" in escaped
    assert r"\textasciitilde{}" in escaped
    assert r"\textasciicircum{}" in escaped

def test_url_sanitization():
    """Verify URL sanitizer blocks pseudo-schemes and escapes % and #."""
    assert sanitize_url("javascript:alert(1)") == ""
    assert sanitize_url("data:text/html,bad") == ""
    safe = sanitize_url("https://github.com/user/proj#readme")
    assert r"\#" in safe

def test_latex_generation_templates():
    """Verify LaTeX generation across all templates."""
    data = {
        "personal": {
            "full_name": "Taylor Smith",
            "title": "Staff Engineer",
            "email": "taylor@example.com"
        },
        "summary": "Proven leader.",
        "experience": [
            {
                "company": "Acme Inc",
                "role": "Staff Engineer",
                "start_date": "2020",
                "end_date": "Present",
                "current": True,
                "highlights": ["Led engineering teams."]
            }
        ],
        "education": [],
        "skills": {"languages": ["Python", "Rust"]}
    }

    for tpl in ["modern_technical", "minimalist", "executive"]:
        tex = generate_latex_resume(data, template_name=tpl)
        assert r"\documentclass" in tex
        assert r"\begin{document}" in tex
        assert r"\end{document}" in tex
        assert "Taylor Smith" in tex
        assert "Staff Engineer" in tex
        assert "Acme Inc" in tex

def test_latex_security_validator():
    """Verify that dangerous primitives and malformed structure are caught."""
    # Prohibited shell escape
    malicious = r"\documentclass{article}\begin{document}\write18{ls}\end{document}"
    val = validate_latex_source(malicious)
    assert not val['valid']
    assert any("write18" in e for e in val['errors'])

    # Missing document tags
    missing = r"\documentclass{article}Some text without begin document"
    val2 = validate_latex_source(missing)
    assert not val2['valid']

    # Unbalanced braces
    unbalanced = r"\documentclass{article}\begin{document}{unbalanced\end{document}"
    val3 = validate_latex_source(unbalanced)
    assert not val3['valid']

@pytest.mark.django_db
def test_real_tectonic_compilation():
    """Verify that a clean resume compiles into a valid PDF using local Tectonic."""
    data = {
        "personal": {
            "full_name": "Jordan Bell",
            "title": "DevOps Engineer",
            "email": "jordan@example.com"
        },
        "summary": "Infrastructure specialist.",
        "experience": [
            {
                "company": "Cloud Corp",
                "role": "DevOps Engineer",
                "start_date": "2022",
                "end_date": "Present",
                "current": True,
                "highlights": ["Automated Kubernetes clusters."]
            }
        ],
        "education": [],
        "skills": {"languages": ["Go", "Bash", "Python"]}
    }

    latex = generate_latex_resume(data, "modern_technical")
    result = compile_latex_to_pdf(latex, "test-unit-resume-1")

    assert result['success'] is True
    assert result['pdf_path'] is not None
    assert result['compiler_used'] == 'tectonic'
