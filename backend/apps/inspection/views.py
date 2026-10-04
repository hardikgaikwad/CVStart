"""
Inspection API views for analyzing PDF geometry and visual layouts.
"""

import os
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from backend.apps.resumes.models import Resume
from .visual_inspector import perform_full_pdf_inspection, is_vision_capable_model

class InspectPdfView(APIView):
    """Run geometry and optional visual analysis on the resume's compiled PDF."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        pdf_path = resume.latest_pdf_path

        if not pdf_path or not os.path.exists(pdf_path):
            return Response({
                'error': 'No compiled PDF found for this resume. Compile the resume before inspecting.',
            }, status=status.HTTP_400_BAD_REQUEST)

        target_pages = int(request.data.get('target_pages', 1))
        model_name = request.data.get('model') or resume.selected_model
        ollama_url = settings.CVSTART_SETTINGS.get('OLLAMA_URL', 'http://127.0.0.1:11434')

        report = perform_full_pdf_inspection(
            pdf_path=pdf_path,
            target_pages=target_pages,
            model_name=model_name,
            ollama_url=ollama_url
        )

        return Response(report, status=status.HTTP_200_OK)

class CheckVisionCapabilityView(APIView):
    """Check if a model name has vision support."""

    def get(self, request):
        model_name = request.query_params.get('model', '')
        has_vision = is_vision_capable_model(model_name)
        return Response({
            'model': model_name,
            'supports_vision': has_vision,
        }, status=status.HTTP_200_OK)
