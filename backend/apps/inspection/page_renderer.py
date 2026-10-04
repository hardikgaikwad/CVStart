"""
PDF Page Rendering Utility for CVstart.
Renders PDF pages into PNG images using PyMuPDF for visual inspection and image preview.
"""

import os
import base64
from pathlib import Path
from typing import List, Dict, Any
import pymupdf
from django.conf import settings

def render_pdf_to_images(pdf_path: str, dpi: int = 150) -> List[Dict[str, Any]]:
    """
    Render all pages of a PDF to PNG images.

    Returns:
        List of dicts: [
            {
                'page_number': 1,
                'image_path': '/path/to/page_1.png',
                'base64': 'data:image/png;base64,...',
                'width': 1275,
                'height': 1650
            },
            ...
        ]
    """
    if not os.path.exists(pdf_path):
        return []

    pdf_file = Path(pdf_path)
    output_dir = pdf_file.parent / "rendered_pages"
    output_dir.mkdir(parents=True, exist_ok=True)

    rendered_pages = []
    doc = None
    try:
        doc = pymupdf.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=dpi)
            out_img_path = output_dir / f"page_{page_idx + 1}.png"
            pix.save(str(out_img_path))

            # Encode as base64 for vision models or direct frontend preview
            img_bytes = pix.tobytes("png")
            b64_str = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"

            rendered_pages.append({
                'page_number': page_idx + 1,
                'image_path': str(out_img_path),
                'base64': b64_str,
                'width': pix.width,
                'height': pix.height
            })
    finally:
        if doc is not None:
            doc.close()

    return rendered_pages
