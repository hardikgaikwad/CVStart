"""
Visual Inspection Engine for CVstart.
Coordinates objective PDF geometry analysis with optional local vision model inspection.
"""

from typing import Dict, Any, List, Optional
import httpx
from .pdf_analyzer import analyze_pdf_geometry
from .page_renderer import render_pdf_to_images

KNOWN_VISION_MODELS = [
    'llava',
    'llama3.2-vision',
    'bakllava',
    'minicpm-v',
    'moondream',
    'qwen2-vl',
    'qwen2.5-vl',
    'internvl',
]

def is_vision_capable_model(model_name: str, model_details: Optional[Dict[str, Any]] = None) -> bool:
    """
    Determine if a given Ollama model supports multimodal vision input.
    """
    if not model_name:
        return False
    lower_name = model_name.lower()
    for pattern in KNOWN_VISION_MODELS:
        if pattern in lower_name:
            return True

    # Check model families in metadata if provided
    if model_details and isinstance(model_details, dict):
        details = model_details.get('details', {})
        families = details.get('families', [])
        if any('clip' in str(f).lower() or 'vision' in str(f).lower() for f in families):
            return True

    return False

def inspect_page_with_vision(
    image_base64_data: str,
    model_name: str,
    ollama_url: str = 'http://127.0.0.1:11434'
) -> Optional[Dict[str, Any]]:
    """
    Send rendered resume page image to a local vision model for aesthetic layout critique.
    """
    # Strip data URL header if present
    raw_b64 = image_base64_data.split(',')[-1] if ',' in image_base64_data else image_base64_data

    prompt = (
        "You are an expert resume design and typography critic. "
        "Inspect this rendered resume page image. Evaluate the visual balance, margin consistency, "
        "section headers, vertical spacing, and whether any text appears cramped or overflowing. "
        "Provide a concise, 2-3 sentence visual critique with actionable suggestions if any."
    )

    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                f"{ollama_url.rstrip('/')}/api/generate",
                json={
                    "model": model_name,
                    "prompt": prompt,
                    "images": [raw_b64],
                    "stream": False,
                }
            )
            if resp.status_code == 200:
                result_text = resp.json().get('response', '').strip()
                return {
                    'model_used': model_name,
                    'visual_critique': result_text,
                    'successful': True,
                }
    except Exception as e:
        return {
            'model_used': model_name,
            'visual_critique': None,
            'error': str(e),
            'successful': False
        }

    return None

def perform_full_pdf_inspection(
    pdf_path: str,
    target_pages: int = 1,
    model_name: Optional[str] = None,
    ollama_url: str = 'http://127.0.0.1:11434'
) -> Dict[str, Any]:
    """
    Unified inspection entry point:
    1. Objective geometry analysis (PyMuPDF).
    2. Render pages to images.
    3. Vision-based inspection if a compatible vision model is selected.
    """
    # 1. Objective analysis
    geometry_report = analyze_pdf_geometry(pdf_path, target_pages=target_pages)
    if not geometry_report.get('success'):
        return geometry_report

    # 2. Render pages
    rendered_images = render_pdf_to_images(pdf_path, dpi=150)
    geometry_report['rendered_pages'] = [
        {
            'page_number': p['page_number'],
            'image_path': p['image_path'],
            'base64': p['base64'],
            'width': p['width'],
            'height': p['height'],
        }
        for p in rendered_images
    ]

    # 3. Vision inspection check
    vision_report = None
    if model_name and is_vision_capable_model(model_name) and rendered_images:
        geometry_report['inspection_type'] = 'geometry_and_vision'
        # Inspect page 1 with vision model
        p1_b64 = rendered_images[0]['base64']
        vision_report = inspect_page_with_vision(p1_b64, model_name, ollama_url)
        geometry_report['vision_analysis'] = vision_report
    else:
        geometry_report['inspection_type'] = 'geometry_only'
        geometry_report['vision_analysis'] = {
            'status': 'skipped',
            'reason': (
                f"Selected model '{model_name or 'none'}' does not support vision, "
                "or no vision model specified. Relying on objective PyMuPDF geometry extraction."
            )
        }

    return geometry_report
