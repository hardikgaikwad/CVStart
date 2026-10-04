"""
System views and exception handling for CVstart.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import exception_handler
from .diagnostics import get_full_diagnostics, check_ollama_status, find_latex_compiler

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardize all DRF exception responses to a consistent format:
    {"error": "<message>", "status_code": <code>, "details": <dict/str>}
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'error': str(exc),
            'status_code': response.status_code,
            'details': response.data
        }
        response.data = custom_data
    else:
        logger.exception("Unhandled backend error: %s", exc)
        return Response(
            {
                'error': 'Internal server error occurred.',
                'status_code': 500,
                'details': str(exc)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response

class HealthCheckView(APIView):
    """Health check endpoint for CVstart server."""
    def get(self, request):
        return Response({
            'status': 'healthy',
            'app': 'CVstart',
            'version': '0.1.0'
        }, status=status.HTTP_200_OK)

class DiagnosticsView(APIView):
    """Complete diagnostic report: compiler, Ollama, workspace, platform."""
    def get(self, request):
        data = get_full_diagnostics()
        return Response(data, status=status.HTTP_200_OK)

class OllamaStatusView(APIView):
    """Query current status of Ollama connection and models."""
    def get(self, request):
        url = request.query_params.get('url')
        result = check_ollama_status(url)
        return Response(result, status=status.HTTP_200_OK)

class LatexStatusView(APIView):
    """Query current status of local LaTeX compiler."""
    def get(self, request):
        result = find_latex_compiler()
        return Response(result, status=status.HTTP_200_OK)
