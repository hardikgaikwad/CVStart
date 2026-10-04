"""
API endpoints for LaTeX generation, validation, compilation, PDF preview, and export.
"""

import os
import io
import zipfile
from pathlib import Path
from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from backend.apps.resumes.models import Resume, ResumeVersion
from .generator import generate_latex_resume
from .validator import validate_latex_source
from .compiler import compile_latex_to_pdf

class GenerateLatexView(APIView):
    """Generate LaTeX from the resume's structured data using the selected template."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        template_name = request.data.get('template', resume.selected_template)
        options = {
            'paper_size': request.data.get('paper_size', resume.preferred_page_size),
            'font_size': request.data.get('font_size', '10pt'),
            'margin': request.data.get('margin', '0.5in'),
        }

        latex_source = generate_latex_resume(resume.structured_data, template_name, options)

        # Update resume record
        resume.current_latex = latex_source
        resume.selected_template = template_name
        resume.preferred_page_size = options['paper_size']
        resume.save(update_fields=['current_latex', 'selected_template', 'preferred_page_size'])

        return Response({
            'resume_id': str(resume.id),
            'latex_source': latex_source,
            'template': template_name,
            'options': options,
        }, status=status.HTTP_200_OK)

class ValidateLatexView(APIView):
    """Validate LaTeX syntax and security without compiling."""

    def post(self, request):
        source = request.data.get('source', '')
        result = validate_latex_source(source)
        return Response(result, status=status.HTTP_200_OK)

class CompileLatexView(APIView):
    """Compile LaTeX source for a resume into a PDF."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        source = request.data.get('source') or resume.current_latex

        if not source or not source.strip():
            # If no latex exists yet, generate it first
            source = generate_latex_resume(resume.structured_data, resume.selected_template)
            resume.current_latex = source
            resume.save(update_fields=['current_latex'])

        result = compile_latex_to_pdf(source, str(resume.id))

        if result['success']:
            resume.latest_pdf_path = result['pdf_path']
            resume.current_latex = source
            resume.save(update_fields=['latest_pdf_path', 'current_latex'])

            # If user explicitly requested saving a version with compile
            if request.data.get('save_version', False):
                resume.version += 1
                resume.save(update_fields=['version'])
                ResumeVersion.objects.create(
                    resume=resume,
                    version_number=resume.version,
                    change_summary=request.data.get('change_summary', 'Compiled new PDF'),
                    structured_data=resume.structured_data,
                    latex_source=resume.current_latex,
                    pdf_path=resume.latest_pdf_path
                )

        return Response({
            'success': result['success'],
            'pdf_url': f"/api/latex/pdf/{resume.id}/" if result['success'] else None,
            'errors': result['errors'],
            'log': result['log'],
            'compiler_used': result['compiler_used'],
            'duration_seconds': result['duration_seconds'],
        }, status=status.HTTP_200_OK)

class PdfServeView(APIView):
    """Stream the compiled PDF for live browser preview."""

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        pdf_path = resume.latest_pdf_path

        if not pdf_path or not os.path.exists(pdf_path):
            if not resume.current_latex:
                resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)
                resume.save(update_fields=['current_latex'])

            result = compile_latex_to_pdf(resume.current_latex, str(resume.id))
            if result.get('success') and result.get('pdf_path'):
                resume.latest_pdf_path = result['pdf_path']
                resume.save(update_fields=['latest_pdf_path'])
                pdf_path = result['pdf_path']
            else:
                raise Http404(f"Could not compile PDF: {result.get('log', 'Unknown compilation failure')}")

        response = FileResponse(
            open(pdf_path, 'rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'inline; filename="{resume.title or "resume"}.pdf"'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        return response

class PdfPagesView(APIView):
    """Render and return high-resolution page image data URLs for visual document preview."""

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        pdf_path = resume.latest_pdf_path

        if not pdf_path or not os.path.exists(pdf_path):
            if not resume.current_latex:
                resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)
                resume.save(update_fields=['current_latex'])

            result = compile_latex_to_pdf(resume.current_latex, str(resume.id))
            if result.get('success') and result.get('pdf_path'):
                resume.latest_pdf_path = result['pdf_path']
                resume.save(update_fields=['latest_pdf_path'])
                pdf_path = result['pdf_path']
            else:
                return Response({
                    'error': 'Cannot render PDF preview.',
                    'details': result.get('errors', [])
                }, status=status.HTTP_400_BAD_REQUEST)

        from backend.apps.inspection.page_renderer import render_pdf_to_images
        pages = render_pdf_to_images(pdf_path, dpi=180)
        return Response({
            'resume_id': str(resume.id),
            'pages_count': len(pages),
            'pages': pages
        }, status=status.HTTP_200_OK)

class ExportView(APIView):
    """Export PDF, .tex, or a complete ZIP package."""

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        export_format = request.query_params.get('format', 'pdf').lower()

        clean_title = "".join(c for c in resume.title if c.isalnum() or c in (' ', '_', '-')).strip() or "resume"

        if export_format == 'tex':
            if not resume.current_latex:
                resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)
                resume.save(update_fields=['current_latex'])
            response = HttpResponse(resume.current_latex, content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{clean_title}.tex"'
            return response

        elif export_format == 'zip':
            if not resume.current_latex:
                resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)
                resume.save(update_fields=['current_latex'])
            if not resume.latest_pdf_path or not os.path.exists(resume.latest_pdf_path):
                result = compile_latex_to_pdf(resume.current_latex, str(resume.id))
                if result.get('success') and result.get('pdf_path'):
                    resume.latest_pdf_path = result['pdf_path']
                    resume.save(update_fields=['latest_pdf_path'])

            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                if resume.current_latex:
                    zf.writestr(f"{clean_title}.tex", resume.current_latex)
                if resume.latest_pdf_path and os.path.exists(resume.latest_pdf_path):
                    zf.write(resume.latest_pdf_path, f"{clean_title}.pdf")

            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename="{clean_title}_package.zip"'
            return response

        else: # Default: pdf
            if not resume.latest_pdf_path or not os.path.exists(resume.latest_pdf_path):
                if not resume.current_latex:
                    resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)
                    resume.save(update_fields=['current_latex'])

                result = compile_latex_to_pdf(resume.current_latex, str(resume.id))
                if not result['success']:
                    return Response({
                        'error': 'Cannot export PDF: compilation failed.',
                        'details': result['errors']
                    }, status=status.HTTP_400_BAD_REQUEST)
                resume.latest_pdf_path = result['pdf_path']
                resume.save(update_fields=['latest_pdf_path'])

            response = FileResponse(
                open(resume.latest_pdf_path, 'rb'),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{clean_title}.pdf"'
            return response
