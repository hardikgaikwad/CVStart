"""
Unit tests for AI client, change planning, factual integrity checks, and tool registry.
"""

import pytest
from backend.apps.ai.ollama_client import OllamaClient
from backend.apps.ai.change_planner import plan_rule_based_fallback, generate_diff_summary
from backend.apps.ai.validators import verify_factual_integrity
from backend.apps.ai.tool_registry import tool_registry

def test_ollama_client_offline_handling():
    """Verify OllamaClient returns clear diagnostic when connecting to invalid port."""
    client = OllamaClient(base_url="http://127.0.0.1:59999")
    health = client.check_health()
    assert health['reachable'] is False
    assert health['error'] is not None

def test_rule_based_change_planner():
    """Verify rule based change planner handles single-page tightening."""
    initial_data = {
        "personal": {"full_name": "Dev User", "title": "Developer"},
        "summary": "Existing summary.",
        "experience": [
            {
                "company": "Company A",
                "role": "Developer",
                "highlights": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
            }
        ]
    }

    plan = plan_rule_based_fallback(initial_data, "Make this fit on one page")
    assert plan['success'] is True
    assert plan['change_type'] == 'layout'
    # Highlights should be trimmed to at most 3
    assert len(plan['proposed_structured_data']['experience'][0]['highlights']) <= 3

def test_factual_integrity_check():
    """Verify validator flags novel unstated companies as unauthorized."""
    orig = {
        "experience": [{"company": "Alpha Corp"}]
    }
    prop_clean = {
        "experience": [{"company": "Alpha Corp"}]
    }
    clean_ok, _ = verify_factual_integrity(orig, prop_clean, "Make descriptions punchy")
    assert clean_ok is True

    # Novel unrequested company introduced
    prop_hallucinated = {
        "experience": [{"company": "Alpha Corp"}, {"company": "Google"}]
    }
    hallucinated_ok, warnings = verify_factual_integrity(orig, prop_hallucinated, "Make descriptions punchy")
    assert hallucinated_ok is False
    assert any("Google" in w for w in warnings)

def test_tool_registry_tools():
    """Verify all 13 application tools are registered with schemas."""
    expected_tools = [
        "get_resume_data",
        "plan_resume_changes",
        "update_resume_data",
        "generate_latex",
        "validate_latex",
        "compile_latex",
        "render_pdf",
        "inspect_pdf",
        "inspect_layout",
        "edit_latex",
        "get_compile_diagnostics",
        "save_resume_version",
        "export_resume"
    ]

    for tool_name in expected_tools:
        tool = tool_registry.get_tool(tool_name)
        assert tool is not None, f"Tool '{tool_name}' missing from registry"
        assert tool.input_schema is not None
        assert callable(tool.handler)
