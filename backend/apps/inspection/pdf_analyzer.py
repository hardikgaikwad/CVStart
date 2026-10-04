"""
Objective PDF Geometry and Layout Analyzer using PyMuPDF.
Extracts bounding boxes, text spans, margins, overflows, density, and formatting anomalies.
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymupdf

def analyze_pdf_geometry(pdf_path: str, target_pages: int = 1) -> Dict[str, Any]:
    """
    Extract objective layout metrics and potential formatting issues from a PDF.
    """
    if not os.path.exists(pdf_path):
        return {
            'success': False,
            'error': f"PDF file not found at path: {pdf_path}",
            'pages_count': 0,
            'issues': []
        }

    doc = None
    try:
        doc = pymupdf.open(pdf_path)
        total_pages = len(doc)
        pages_analysis = []
        issues = []
        suggestions = []

        # Check multi-page spill
        if total_pages > target_pages:
            issues.append({
                'type': 'page_spill',
                'severity': 'high' if total_pages > target_pages + 1 else 'medium',
                'message': f"Resume spans {total_pages} pages, exceeding the target of {target_pages} page(s).",
                'details': f"Document spilled onto page {total_pages}."
            })
            suggestions.append("Adjust section spacing, reduce margins slightly (e.g. to 0.4in), or make descriptions more concise.")

        total_word_count = 0

        for page_idx in range(total_pages):
            page = doc[page_idx]
            rect = page.rect
            width, height = rect.width, rect.height

            # Extract structured text blocks
            # block format: (x0, y0, x1, y1, text, block_no, block_type)
            text_page = page.get_text("blocks")
            blocks = []
            font_sizes = set()

            min_x, min_y = width, height
            max_x, max_y = 0.0, 0.0

            page_words = 0

            for b in text_page:
                if len(b) >= 5:
                    x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
                    if not text.strip():
                        continue

                    words = len(text.split())
                    page_words += words
                    min_x = min(min_x, x0)
                    min_y = min(min_y, y0)
                    max_x = max(max_x, x1)
                    max_y = max(max_y, y1)

                    blocks.append({
                        'bbox': [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                        'text_snippet': text.strip().replace('\n', ' ')[:80],
                        'lines_count': text.count('\n') + 1,
                        'word_count': words
                    })

            # Detailed span inspection for font sizes
            page_dict = page.get_text("dict")
            for block in page_dict.get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        size = span.get("size")
                        if size:
                            font_sizes.add(round(size, 1))

            total_word_count += page_words

            # Measured margins
            top_margin = round(min_y, 1) if min_y < height else 0.0
            bottom_margin = round(height - max_y, 1) if max_y > 0 else 0.0
            left_margin = round(min_x, 1) if min_x < width else 0.0
            right_margin = round(width - max_x, 1) if max_x > 0 else 0.0

            content_height = round(max_y - min_y, 1) if max_y >= min_y else 0.0
            printable_height = height - 72.0 # approx 0.5in top & bottom
            density = round((content_height / printable_height), 2) if printable_height > 0 else 0.0

            # Detect anomalies
            # 1. Trailing spill (Page 2 has very little text - classic orphan spill)
            if page_idx == 1 and page_words < 60:
                issues.append({
                    'type': 'orphan_spill',
                    'severity': 'high',
                    'message': f"Page 2 contains only {page_words} words. The document barely spills onto a second page.",
                    'details': "A tiny vertical adjustment will pull all content back to 1 single page."
                })
                suggestions.append("Apply a compact spacing option to bring the trailing items onto page 1.")

            # 2. Bottom margin cramped
            if bottom_margin < 20.0 and page_idx == 0 and total_pages == 1:
                issues.append({
                    'type': 'bottom_cramped',
                    'severity': 'low',
                    'message': f"Bottom margin is very tight ({bottom_margin} pt). Content is close to the bottom edge.",
                    'details': "Risk of clipping on certain printers."
                })

            # 3. Excessive empty space at bottom of 1-page resume
            if total_pages == 1 and bottom_margin > 240.0:
                issues.append({
                    'type': 'excessive_whitespace',
                    'severity': 'low',
                    'message': f"Significant unused vertical space at bottom ({bottom_margin} pt).",
                    'details': "The resume could comfortably expand section descriptions or add relevant projects."
                })

            pages_analysis.append({
                'page_number': page_idx + 1,
                'dimensions': {
                    'width_pt': round(width, 1),
                    'height_pt': round(height, 1),
                },
                'margins': {
                    'top': top_margin,
                    'bottom': bottom_margin,
                    'left': left_margin,
                    'right': right_margin,
                },
                'content_height_pt': content_height,
                'vertical_density': density,
                'blocks_count': len(blocks),
                'word_count': page_words,
                'font_sizes_detected': sorted(list(font_sizes)),
                'sample_blocks': blocks[:10],
            })

        return {
            'success': True,
            'pages_count': total_pages,
            'total_words': total_word_count,
            'target_pages': target_pages,
            'satisfies_page_target': total_pages <= target_pages,
            'issues': issues,
            'suggestions': suggestions,
            'pages': pages_analysis,
            'inspection_type': 'geometry'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f"Failed to inspect PDF geometry: {e}",
            'pages_count': 0,
            'issues': []
        }
    finally:
        if doc is not None:
            doc.close()
