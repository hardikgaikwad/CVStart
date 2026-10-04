"""
Data models for resumes and version history.
"""

import uuid
from django.db import models

def default_resume_structure():
    """Return default empty structured resume schema."""
    return {
        "personal": {
            "full_name": "",
            "title": "",
            "email": "",
            "phone": "",
            "location": "",
            "website": "",
            "github": "",
            "linkedin": "",
        },
        "summary": "",
        "education": [],
        "experience": [],
        "projects": [],
        "skills": {
            "languages": [],
            "frameworks": [],
            "developer_tools": [],
            "libraries": [],
        },
        "certifications": [],
        "achievements": [],
        "publications": [],
        "custom_sections": []
    }

class Resume(models.Model):
    """Primary Resume entity representing a structured user resume."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, default="Untitled Resume")
    target_role = models.CharField(max_length=255, blank=True, default="")
    structured_data = models.JSONField(default=default_resume_structure)
    selected_template = models.CharField(max_length=100, default="modern_technical")
    preferred_page_size = models.CharField(max_length=20, default="letter") # 'letter' or 'a4'
    selected_model = models.CharField(max_length=100, blank=True, default="")
    current_latex = models.TextField(blank=True, default="")
    latest_pdf_path = models.CharField(max_length=500, blank=True, default="")
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} (v{self.version})"

class ResumeVersion(models.Model):
    """Snapshot of a resume's state at a particular version point."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    change_summary = models.TextField(blank=True, default="")
    structured_data = models.JSONField()
    latex_source = models.TextField(blank=True, default="")
    pdf_path = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('resume', 'version_number')

    def __str__(self):
        return f"{self.resume.title} - Revision v{self.version_number}"
