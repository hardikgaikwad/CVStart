"""
API Views for CRUD operations and version management on Resumes.
"""

import os
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Resume, ResumeVersion
from .serializers import ResumeSerializer, ResumeVersionSerializer

class ResumeListCreateView(APIView):
    """List resumes or create a new one."""

    def get(self, request):
        resumes = Resume.objects.all()
        serializer = ResumeSerializer(resumes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ResumeSerializer(data=request.data)
        if serializer.is_valid():
            resume = serializer.save()

            # Ensure initial LaTeX is generated and PDF compiled
            if not resume.current_latex:
                from backend.apps.latex.generator import generate_latex_resume
                resume.current_latex = generate_latex_resume(resume.structured_data, resume.selected_template)

            from backend.apps.latex.compiler import compile_latex_to_pdf
            comp = compile_latex_to_pdf(resume.current_latex, str(resume.id))
            if comp.get('success') and comp.get('pdf_path'):
                resume.latest_pdf_path = comp['pdf_path']
            resume.save(update_fields=['current_latex', 'latest_pdf_path'])

            # Create initial version snapshot
            ResumeVersion.objects.create(
                resume=resume,
                version_number=1,
                change_summary="Initial resume created",
                structured_data=resume.structured_data,
                latex_source=resume.current_latex,
                pdf_path=resume.latest_pdf_path
            )
            return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResumeDetailView(APIView):
    """Retrieve, update, or delete a specific resume."""

    def get_object(self, pk):
        return get_object_or_404(Resume, pk=pk)

    def get(self, request, pk):
        resume = self.get_object(pk)
        serializer = ResumeSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def patch(self, request, pk):
        resume = self.get_object(pk)
        old_data = resume.structured_data
        old_latex = resume.current_latex
        summary = request.data.get('change_summary', 'Resume updated')

        serializer = ResumeSerializer(resume, data=request.data, partial=True)
        if serializer.is_valid():
            updated_resume = serializer.save()

            # If structured data or latex source changed, increment version and create snapshot
            has_data_change = updated_resume.structured_data != old_data
            has_latex_change = updated_resume.current_latex != old_latex

            if has_data_change or has_latex_change or request.data.get('create_version', False):
                updated_resume.version += 1
                updated_resume.save(update_fields=['version'])

                ResumeVersion.objects.create(
                    resume=updated_resume,
                    version_number=updated_resume.version,
                    change_summary=summary,
                    structured_data=updated_resume.structured_data,
                    latex_source=updated_resume.current_latex,
                    pdf_path=updated_resume.latest_pdf_path
                )

            return Response(ResumeSerializer(updated_resume).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        resume = self.get_object(pk)
        # Clean up any associated PDF files
        if resume.latest_pdf_path and os.path.exists(resume.latest_pdf_path):
            try:
                os.remove(resume.latest_pdf_path)
            except OSError:
                pass

        resume_dir = settings.CVSTART_SETTINGS['WORKSPACE_DIR'] / str(resume.id)
        if resume_dir.exists():
            import shutil
            shutil.rmtree(resume_dir, ignore_errors=True)

        resume.delete()
        return Response({'message': 'Resume deleted successfully.'}, status=status.HTTP_200_OK)

class ResumeVersionsListView(APIView):
    """List revision history snapshots for a resume."""

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        versions = resume.versions.all()
        serializer = ResumeVersionSerializer(versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ResumeRestoreVersionView(APIView):
    """Restore a resume to a previous version state."""

    def post(self, request, pk, version_number):
        resume = get_object_or_404(Resume, pk=pk)
        version_obj = get_object_or_404(ResumeVersion, resume=resume, version_number=version_number)

        resume.structured_data = version_obj.structured_data
        resume.current_latex = version_obj.latex_source
        resume.latest_pdf_path = version_obj.pdf_path
        resume.version += 1
        resume.save()

        # Create new version record for the restoration
        ResumeVersion.objects.create(
            resume=resume,
            version_number=resume.version,
            change_summary=f"Restored from version {version_number}",
            structured_data=resume.structured_data,
            latex_source=resume.current_latex,
            pdf_path=resume.latest_pdf_path
        )

        return Response(ResumeSerializer(resume).data, status=status.HTTP_200_OK)

class ResumeDuplicateView(APIView):
    """Clone an existing resume into a new resume."""

    def post(self, request, pk):
        source = get_object_or_404(Resume, pk=pk)
        new_resume = Resume.objects.create(
            title=f"{source.title} (Copy)",
            target_role=source.target_role,
            structured_data=source.structured_data,
            selected_template=source.selected_template,
            preferred_page_size=source.preferred_page_size,
            selected_model=source.selected_model,
            current_latex=source.current_latex,
            version=1
        )

        if not new_resume.current_latex:
            from backend.apps.latex.generator import generate_latex_resume
            new_resume.current_latex = generate_latex_resume(new_resume.structured_data, new_resume.selected_template)

        from backend.apps.latex.compiler import compile_latex_to_pdf
        comp = compile_latex_to_pdf(new_resume.current_latex, str(new_resume.id))
        if comp.get('success') and comp.get('pdf_path'):
            new_resume.latest_pdf_path = comp['pdf_path']
        new_resume.save(update_fields=['current_latex', 'latest_pdf_path'])

        ResumeVersion.objects.create(
            resume=new_resume,
            version_number=1,
            change_summary=f"Cloned from '{source.title}'",
            structured_data=new_resume.structured_data,
            latex_source=new_resume.current_latex,
            pdf_path=new_resume.latest_pdf_path
        )
        return Response(ResumeSerializer(new_resume).data, status=status.HTTP_201_CREATED)
