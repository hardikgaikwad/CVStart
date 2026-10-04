"""
Output and Content Integrity Validators for Model Generated Changes.
Prevents hallucination and enforces strict schema compliance.
"""

from typing import Dict, Any, List, Tuple
from backend.apps.resumes.serializers import validate_structured_data

def validate_model_resume_payload(payload: Any) -> Tuple[bool, Optional[Dict[str, Any]], List[str]]:
    """
    Validate that model payload matches the structured resume schema.
    Returns (is_valid, validated_data, error_messages).
    """
    if not isinstance(payload, dict):
        return False, None, ["Model output is not a valid JSON dictionary."]

    try:
        clean_data = validate_structured_data(payload)
        return True, clean_data, []
    except Exception as e:
        return False, None, [f"Schema validation failed: {e}"]

def verify_factual_integrity(
    original_data: Dict[str, Any],
    proposed_data: Dict[str, Any],
    user_instruction: str
) -> Tuple[bool, List[str]]:
    """
    Check that the model has not invented unauthorized employers or institutions.
    """
    warnings = []
    instruction_lower = user_instruction.lower()

    # Check companies in experience
    orig_companies = {
        exp.get('company', '').strip().lower()
        for exp in original_data.get('experience', [])
        if exp.get('company')
    }
    prop_companies_map = {
        exp.get('company', '').strip().lower(): exp.get('company', '').strip()
        for exp in proposed_data.get('experience', [])
        if exp.get('company')
    }

    new_companies = set(prop_companies_map.keys()) - orig_companies
    if new_companies:
        for comp_lower in new_companies:
            if comp_lower not in instruction_lower:
                comp_orig = prop_companies_map[comp_lower]
                warnings.append(
                    f"Warning: Novel employer '{comp_orig}' introduced that was not in original data or prompt."
                )

    # Check institutions in education
    orig_insts = {
        edu.get('institution', '').strip().lower()
        for edu in original_data.get('education', [])
        if edu.get('institution')
    }
    prop_insts_map = {
        edu.get('institution', '').strip().lower(): edu.get('institution', '').strip()
        for edu in proposed_data.get('education', [])
        if edu.get('institution')
    }

    new_insts = set(prop_insts_map.keys()) - orig_insts
    if new_insts:
        for inst_lower in new_insts:
            if inst_lower not in instruction_lower:
                inst_orig = prop_insts_map[inst_lower]
                warnings.append(
                    f"Warning: Novel institution '{inst_orig}' introduced that was not in original data or prompt."
                )

    return len(warnings) == 0, warnings
