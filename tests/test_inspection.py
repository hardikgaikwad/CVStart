"""
Unit tests for PyMuPDF geometry extraction, page rendering, and layout inspection.
"""

import os
import pytest
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.compiler import compile_latex_to_pdf
from backend.apps.inspection.pdf_analyzer import analyze_pdf_geometry
from backend.apps.inspection.page_renderer import render_pdf_to_images
from backend.apps.inspection.visual_inspector import is_vision_capable_model

@pytest.mark.django_db
def test_pdf_geometry_and_rendering():
    """Verify that PyMuPDF extracts geometry and renders pages from a compiled resume."""
    data = {
        "personal": {
            "full_name": "Sam Rivera",
            "title": "Data Scientist",
            "email": "sam@example.com"
        },
        "summary": "Data scientist with expertise in statistical modeling and machine learning.",
        "experience": [
            {
                "company": "Analytics Lab",
                "role": "Data Scientist",
                "start_date": "2021",
                "end_date": "2024",
                "highlights": ["Trained customer churn forecasting models."]
            }
        ],
        "education": [],
        "skills": {"languages": ["Python", "SQL", "R"]}
    }

    latex = generate_latex_resume(data, "modern_technical")
    comp_res = compile_latex_to_pdf(latex, "test-inspection-resume")
    assert comp_res['success'] is True
    pdf_path = comp_res['pdf_path']

    # Test geometry analysis
    report = analyze_pdf_geometry(pdf_path, target_pages=1)
    assert report['success'] is True
    assert report['pages_count'] == 1
    assert report['total_words'] > 0
    assert report['satisfies_page_target'] is True
    assert len(report['pages']) == 1

    # Verify margins and dimensions exist
    p1 = report['pages'][0]
    assert p1['dimensions']['width_pt'] > 500
    assert p1['dimensions']['height_pt'] > 700
    assert p1['margins']['top'] > 0
    assert p1['margins']['bottom'] > 0

    # Test rendering to PNG images
    images = render_pdf_to_images(pdf_path)
    assert len(images) == 1
    assert os.path.exists(images[0]['image_path'])
    assert images[0]['base64'].startswith('data:image/png;base64,')

def test_vision_capability_detection():
    """Verify that vision models are correctly identified and text-only models are not."""
    assert is_vision_capable_model("llava:latest") is True
    assert is_vision_capable_model("llama3.2-vision:11b") is True
    assert is_vision_capable_model("bakllava") is True
    assert is_vision_capable_model("mistral:7b") is False
    assert is_vision_capable_model("llama3.2:3b") is False
