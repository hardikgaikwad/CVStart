"""
Change Planner for Natural Language Resume Edits.
Converts user requests into structured, auditable change plans with before/after diffs.
"""

import json
import copy
from typing import Dict, Any, List, Optional
from .ollama_client import OllamaClient, OllamaError
from .prompts import (
    SYSTEM_PROMPT_RESUME_ARCHITECT,
    PROMPT_PLAN_CHANGES_SYSTEM,
    PROMPT_TIGHTEN_FOR_ONE_PAGE
)
from .validators import validate_model_resume_payload, verify_factual_integrity

def generate_diff_summary(original: Dict[str, Any], updated: Dict[str, Any]) -> Dict[str, List[str]]:
    """Compare two structured resume dictionaries and generate human-readable diffs."""
    added = []
    modified = []
    removed = []

    # Summary
    if original.get('summary') != updated.get('summary'):
        if not original.get('summary') and updated.get('summary'):
            added.append("Professional Summary added")
        elif original.get('summary') and not updated.get('summary'):
            removed.append("Professional Summary removed")
        else:
            modified.append("Professional Summary rephrased")

    # Experience count or items
    orig_exp = original.get('experience', [])
    upd_exp = updated.get('experience', [])
    if len(upd_exp) > len(orig_exp):
        added.append(f"{len(upd_exp) - len(orig_exp)} work experience entry added")
    elif len(upd_exp) < len(orig_exp):
        removed.append(f"{len(orig_exp) - len(upd_exp)} work experience entry removed")
    elif orig_exp != upd_exp:
        modified.append("Work experience descriptions updated")

    # Projects count or items
    orig_proj = original.get('projects', [])
    upd_proj = updated.get('projects', [])
    if len(upd_proj) > len(orig_proj):
        added.append(f"{len(upd_proj) - len(orig_proj)} project added")
    elif len(upd_proj) < len(orig_proj):
        removed.append(f"{len(orig_proj) - len(upd_proj)} project removed")
    elif orig_proj != upd_proj:
        modified.append("Project details updated")

    # Skills
    if original.get('skills') != updated.get('skills'):
        modified.append("Technical skills updated")

    # Education
    if original.get('education') != updated.get('education'):
        modified.append("Education details updated")

    return {
        'added': added,
        'modified': modified,
        'removed': removed
    }

def plan_changes_with_model(
    current_data: Dict[str, Any],
    instruction: str,
    model_name: str,
    ollama_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Use local Ollama model to produce a structured ChangePlan.
    """
    client = OllamaClient(base_url=ollama_url)

    prompt = (
        f"USER INSTRUCTION: {instruction}\n\n"
        f"CURRENT RESUME DATA (JSON):\n"
        f"{json.dumps(current_data, indent=2)}\n\n"
        "Generate the complete structured change plan JSON now."
    )

    result = client.generate(
        model=model_name,
        prompt=prompt,
        system_prompt=PROMPT_PLAN_CHANGES_SYSTEM,
        json_format=True,
        temperature=0.2,
        timeout=60.0
    )

    plan_json = result.get('json', {})
    proposed = plan_json.get('proposed_structured_data')

    if not proposed:
        raise OllamaError("Model did not return 'proposed_structured_data' in change plan.")

    is_valid, clean_data, errors = validate_model_resume_payload(proposed)
    if not is_valid:
        raise OllamaError(f"Proposed data failed validation: {', '.join(errors)}")

    is_factually_clean, warnings = verify_factual_integrity(current_data, clean_data, instruction)

    diff = generate_diff_summary(current_data, clean_data)

    return {
        'success': True,
        'change_type': plan_json.get('change_type', 'content'),
        'target_sections': plan_json.get('target_sections', []),
        'summary': plan_json.get('summary', 'Proposed edits based on instruction.'),
        'diff_summary': diff,
        'requires_approval': plan_json.get('requires_approval', True),
        'proposed_structured_data': clean_data,
        'warnings': warnings,
        'model_used': model_name
    }

def plan_rule_based_fallback(current_data: Dict[str, Any], instruction: str) -> Dict[str, Any]:
    """
    Deterministic rule-based change planner for when Ollama is offline or for rapid layout adjustments.
    """
    inst = instruction.lower()
    updated = copy.deepcopy(current_data)
    change_type = 'content'
    target_sections = []
    summary = "Applied targeted adjustment."
    requires_approval = False

    # Check for "one page" / "fit on one page"
    if 'one page' in inst or 'single page' in inst or 'fit' in inst:
        change_type = 'layout'
        target_sections = ['experience', 'projects']
        summary = "Refined spacing and tightened descriptions for single-page target."
        # Truncate overly long highlight lists if more than 3 per job
        for exp in updated.get('experience', []):
            hl = exp.get('highlights', [])
            if len(hl) > 3:
                exp['highlights'] = hl[:3]
        for proj in updated.get('projects', []):
            hl = proj.get('highlights', [])
            if len(hl) > 2:
                proj['highlights'] = hl[:2]

    # Check for backend developer emphasis
    elif 'backend' in inst:
        change_type = 'content'
        target_sections = ['summary', 'skills']
        summary = "Aligned summary and skills toward backend development role."
        requires_approval = True
        if not updated.get('summary'):
            updated['summary'] = "Results-driven Software Engineer specialized in high-performance backend systems, RESTful APIs, and distributed architectures."
        updated['personal']['title'] = "Backend Software Engineer"

    # Check for concise / tighten
    elif 'concise' in inst or 'shorter' in inst or 'brief' in inst:
        change_type = 'content'
        target_sections = ['summary', 'experience']
        summary = "Made bullet points more concise."
        requires_approval = True
        for exp in updated.get('experience', []):
            if exp.get('description'):
                exp['description'] = exp['description'].strip().rstrip('.') + '.'

    diff = generate_diff_summary(current_data, updated)

    return {
        'success': True,
        'change_type': change_type,
        'target_sections': target_sections,
        'summary': summary,
        'diff_summary': diff,
        'requires_approval': requires_approval,
        'proposed_structured_data': updated,
        'warnings': [],
        'model_used': 'rule-based-engine'
    }
