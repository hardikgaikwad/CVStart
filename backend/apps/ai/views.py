"""
API Views for AI Model Discovery, Parsing, Change Planning, and Iterative Refinement.
"""

from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from backend.apps.resumes.models import Resume, ResumeVersion
from backend.apps.resumes.serializers import ResumeSerializer, validate_structured_data
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.compiler import compile_latex_to_pdf
from .ollama_client import OllamaClient, OllamaError
from .change_planner import plan_changes_with_model, plan_rule_based_fallback
from .orchestrator import AgentOrchestrator

class ModelListView(APIView):
    """List locally installed Ollama models and capability flags."""

    def get(self, request):
        client = OllamaClient()
        health = client.check_health()
        models = client.list_installed_models()

        return Response({
            'ollama_reachable': health['reachable'],
            'ollama_error': health.get('error'),
            'models_count': len(models),
            'models': models,
            'default_model': settings.CVSTART_SETTINGS.get('DEFAULT_MODEL', ''),
        }, status=status.HTTP_200_OK)

class ParseRawResumeView(APIView):
    """Parse unstructured text or profile notes into structured resume JSON."""

    def post(self, request):
        raw_text = request.data.get('raw_text', '').strip()
        model_name = request.data.get('model')

        if not raw_text:
            return Response({'error': 'raw_text field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt with model if available
        if model_name:
            try:
                from .prompts import PROMPT_PARSE_RAW_NOTES_SYSTEM
                client = OllamaClient()
                result = client.generate(
                    model=model_name,
                    prompt=f"Parse this resume text:\n\n{raw_text}",
                    system_prompt=PROMPT_PARSE_RAW_NOTES_SYSTEM,
                    json_format=True,
                    temperature=0.1
                )
                data = result.get('json', {})
                clean = validate_structured_data(data)
                return Response({'structured_data': clean, 'source': 'ollama_model'}, status=status.HTTP_200_OK)
            except Exception as e:
                pass # Fall back to basic text extractor

        # Basic fallback parser if model is not available
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        first_line = lines[0] if lines else "Candidate Name"

        fallback_data = {
            "personal": {
                "full_name": first_line,
                "title": "Software Engineer",
                "email": "",
                "phone": "",
                "location": "",
                "website": "",
                "github": "",
                "linkedin": "",
            },
            "summary": "Experienced software professional with demonstrated impact across the software development lifecycle.",
            "education": [],
            "experience": [
                {
                    "company": "Tech Company",
                    "role": "Software Engineer",
                    "location": "",
                    "start_date": "2022",
                    "end_date": "Present",
                    "current": True,
                    "description": "",
                    "highlights": lines[1:4] if len(lines) > 1 else ["Developed scalable services."]
                }
            ],
            "projects": [],
            "skills": {
                "languages": ["Python", "JavaScript", "SQL"],
                "frameworks": ["Django", "React"],
                "developer_tools": ["Git", "Docker", "Linux"],
                "libraries": []
            },
            "certifications": [],
            "achievements": [],
            "publications": [],
            "custom_sections": []
        }

        return Response({'structured_data': fallback_data, 'source': 'fallback_parser'}, status=status.HTTP_200_OK)

class PlanChangesView(APIView):
    """Generate a structured ChangePlan with before/after diff for user review."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        instruction = request.data.get('instruction', '').strip()
        model_name = request.data.get('model') or resume.selected_model

        if not instruction:
            return Response({'error': 'instruction field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if model_name:
            try:
                plan = plan_changes_with_model(
                    current_data=resume.structured_data,
                    instruction=instruction,
                    model_name=model_name
                )
                return Response(plan, status=status.HTTP_200_OK)
            except Exception as e:
                # Graceful fallback to rule-based planner
                plan = plan_rule_based_fallback(resume.structured_data, instruction)
                plan['fallback_note'] = f"Model planning was unavailable ({e}), used local rule-based planner."
                return Response(plan, status=status.HTTP_200_OK)
        else:
            plan = plan_rule_based_fallback(resume.structured_data, instruction)
            return Response(plan, status=status.HTTP_200_OK)

class ApplyChangesView(APIView):
    """Commit approved changes to a resume, update LaTeX, compile, and record version snapshot."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        proposed_data = request.data.get('proposed_structured_data')
        summary = request.data.get('summary', 'Natural language edits applied')

        if not proposed_data:
            return Response({'error': 'proposed_structured_data is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            clean_data = validate_structured_data(proposed_data)
        except Exception as e:
            return Response({'error': f"Invalid data format: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        resume.structured_data = clean_data
        resume.current_latex = generate_latex_resume(clean_data, resume.selected_template)
        compile_result = compile_latex_to_pdf(resume.current_latex, str(resume.id))

        if compile_result['success']:
            resume.latest_pdf_path = compile_result['pdf_path']

        resume.version += 1
        resume.save()

        # Save version snapshot
        ResumeVersion.objects.create(
            resume=resume,
            version_number=resume.version,
            change_summary=summary,
            structured_data=resume.structured_data,
            latex_source=resume.current_latex,
            pdf_path=resume.latest_pdf_path
        )

        return Response({
            'success': True,
            'compile_success': compile_result['success'],
            'resume': ResumeSerializer(resume).data,
            'pdf_url': f"/api/latex/pdf/{resume.id}/" if compile_result['success'] else None,
            'compile_errors': compile_result.get('errors', []),
        }, status=status.HTTP_200_OK)

class IterativeRefineView(APIView):
    """Run the complete agentic compile-inspect-correct loop."""

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        instruction = request.data.get('instruction', '').strip()
        model_name = request.data.get('model') or resume.selected_model
        target_pages = int(request.data.get('target_pages', 1))
        auto_apply = request.data.get('auto_apply', True)

        if not instruction:
            return Response({'error': 'instruction is required.'}, status=status.HTTP_400_BAD_REQUEST)

        orchestrator = AgentOrchestrator(max_iterations=3)
        result = orchestrator.run_refinement_cycle(
            resume_id=str(resume.id),
            instruction=instruction,
            model_name=model_name,
            target_pages=target_pages,
            auto_apply=auto_apply
        )

        return Response(result, status=status.HTTP_200_OK)
