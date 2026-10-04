"""
Serializers and Pydantic validation schemas for Resume data.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, EmailStr, field_validator
from rest_framework import serializers
from .models import Resume, ResumeVersion, default_resume_structure

# --- Pydantic Validation Schemas ---

class PersonalInfoSchema(BaseModel):
    full_name: str = Field(default="", max_length=200)
    title: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=100)
    location: str = Field(default="", max_length=200)
    website: str = Field(default="", max_length=300)
    github: str = Field(default="", max_length=300)
    linkedin: str = Field(default="", max_length=300)

class EducationItemSchema(BaseModel):
    institution: str = Field(default="")
    degree: str = Field(default="")
    field_of_study: str = Field(default="")
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    gpa: str = Field(default="")
    coursework: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)

class ExperienceItemSchema(BaseModel):
    company: str = Field(default="")
    role: str = Field(default="")
    location: str = Field(default="")
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    current: bool = Field(default=False)
    description: str = Field(default="")
    highlights: List[str] = Field(default_factory=list)

class ProjectItemSchema(BaseModel):
    name: str = Field(default="")
    description: str = Field(default="")
    technologies: List[str] = Field(default_factory=list)
    url: str = Field(default="")
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    highlights: List[str] = Field(default_factory=list)

class CertificationItemSchema(BaseModel):
    name: str = Field(default="")
    issuer: str = Field(default="")
    date: str = Field(default="")
    url: str = Field(default="")

class AchievementItemSchema(BaseModel):
    title: str = Field(default="")
    description: str = Field(default="")
    date: str = Field(default="")

class PublicationItemSchema(BaseModel):
    title: str = Field(default="")
    publisher: str = Field(default="")
    date: str = Field(default="")
    url: str = Field(default="")

class CustomSectionSchema(BaseModel):
    heading: str = Field(default="")
    items: List[Any] = Field(default_factory=list)

class StructuredResumeSchema(BaseModel):
    personal: PersonalInfoSchema = Field(default_factory=PersonalInfoSchema)
    summary: str = Field(default="")
    education: List[EducationItemSchema] = Field(default_factory=list)
    experience: List[ExperienceItemSchema] = Field(default_factory=list)
    projects: List[ProjectItemSchema] = Field(default_factory=list)
    skills: Dict[str, List[str]] = Field(default_factory=lambda: {
        "languages": [],
        "frameworks": [],
        "developer_tools": [],
        "libraries": [],
    })
    certifications: List[CertificationItemSchema] = Field(default_factory=list)
    achievements: List[AchievementItemSchema] = Field(default_factory=list)
    publications: List[PublicationItemSchema] = Field(default_factory=list)
    custom_sections: List[CustomSectionSchema] = Field(default_factory=list)

def validate_structured_data(data: Any) -> Dict[str, Any]:
    """Validate and normalize raw input data against StructuredResumeSchema."""
    if not isinstance(data, dict):
        raise ValueError("Structured data must be a dictionary")
    schema = StructuredResumeSchema(**data)
    return schema.model_dump()

# --- Django REST Framework Serializers ---

class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = [
            'id',
            'version_number',
            'change_summary',
            'structured_data',
            'latex_source',
            'pdf_path',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class ResumeSerializer(serializers.ModelSerializer):
    versions_count = serializers.IntegerField(source='versions.count', read_only=True)

    class Meta:
        model = Resume
        fields = [
            'id',
            'title',
            'target_role',
            'structured_data',
            'selected_template',
            'preferred_page_size',
            'selected_model',
            'current_latex',
            'latest_pdf_path',
            'version',
            'versions_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'version']

    def validate_structured_data(self, value):
        """Strict validation of structured resume data using Pydantic."""
        try:
            return validate_structured_data(value)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid structured resume format: {e}")
