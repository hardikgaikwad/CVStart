"""
Unit tests for Resume models, serializers, versioning, and validation.
"""

import pytest
from backend.apps.resumes.models import Resume, ResumeVersion
from backend.apps.resumes.serializers import validate_structured_data, StructuredResumeSchema

@pytest.mark.django_db
def test_create_resume():
    """Verify resume creation with default structured schema."""
    resume = Resume.objects.create(
        title="Test Engineer Resume",
        target_role="Full Stack Engineer",
        selected_template="modern_technical"
    )
    assert resume.id is not None
    assert resume.version == 1
    assert "personal" in resume.structured_data
    assert "skills" in resume.structured_data

@pytest.mark.django_db
def test_resume_version_history():
    """Verify version snapshot creation and rollback."""
    resume = Resume.objects.create(
        title="Software Engineer",
        structured_data={"summary": "Initial summary"}
    )
    ResumeVersion.objects.create(
        resume=resume,
        version_number=1,
        change_summary="Initial version",
        structured_data=resume.structured_data,
        latex_source=""
    )

    # Update resume and create version 2
    resume.structured_data = {"summary": "Updated second summary"}
    resume.version = 2
    resume.save()
    ResumeVersion.objects.create(
        resume=resume,
        version_number=2,
        change_summary="Updated summary",
        structured_data=resume.structured_data,
        latex_source=""
    )

    assert resume.versions.count() == 2
    v1 = resume.versions.get(version_number=1)
    assert v1.structured_data["summary"] == "Initial summary"

def test_pydantic_schema_validation():
    """Test strict schema validation using Pydantic."""
    valid_data = {
        "personal": {
            "full_name": "Jane Doe",
            "title": "Systems Engineer",
            "email": "jane@example.com"
        },
        "summary": "Experienced engineer.",
        "education": [],
        "experience": [
            {
                "company": "Tech Corp",
                "role": "Engineer",
                "start_date": "2020",
                "end_date": "2023",
                "highlights": ["Built distributed systems."]
            }
        ],
        "projects": [],
        "skills": {
            "languages": ["Python", "Go"]
        }
    }

    clean = validate_structured_data(valid_data)
    assert clean["personal"]["full_name"] == "Jane Doe"
    assert len(clean["experience"]) == 1
    assert clean["skills"]["languages"] == ["Python", "Go"]

def test_pydantic_schema_rejects_non_dict():
    """Verify schema raises error on invalid non-dict input."""
    with pytest.raises(ValueError):
        validate_structured_data("invalid string")
