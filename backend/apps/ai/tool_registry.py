"""
Controlled Application Tool Registry for CVstart AI Agent.
Exposes only strictly validated, safe application tools with explicit schemas.
"""

from typing import Dict, Any, Callable, Optional
from backend.apps.resumes.models import Resume, ResumeVersion
from backend.apps.resumes.serializers import validate_structured_data
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.validator import validate_latex_source
from backend.apps.latex.compiler import compile_latex_to_pdf
from backend.apps.inspection.pdf_analyzer import analyze_pdf_geometry
from backend.apps.inspection.page_renderer import render_pdf_to_images
from backend.apps.inspection.visual_inspector import perform_full_pdf_inspection

class ToolDefinition:
    def __init__(self, name: str, description: str, input_schema: Dict[str, Any], handler: Callable):
        self.name = name
        self.description = description
        self.input_schema = input_schema
        self.handler = handler

    def execute(self, **kwargs) -> Dict[str, Any]:
        return self.handler(**kwargs)

class AgentToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._register_default_tools()

    def register(self, tool: ToolDefinition):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                'name': t.name,
                'description': t.description,
                'parameters': t.input_schema
            }
            for t in self._tools.values()
        ]

    def _register_default_tools(self):
        # 1. get_resume_data
        self.register(ToolDefinition(
            name="get_resume_data",
            description="Retrieve structured resume data and metadata by resume ID.",
            input_schema={"resume_id": "string"},
            handler=self._tool_get_resume_data
        ))

        # 2. plan_resume_changes
        self.register(ToolDefinition(
            name="plan_resume_changes",
            description="Produce a structured change plan from an instruction.",
            input_schema={"resume_id": "string", "instruction": "string"},
            handler=self._tool_plan_resume_changes
        ))

        # 3. update_resume_data
        self.register(ToolDefinition(
            name="update_resume_data",
            description="Apply validated updates to the structured resume data.",
            input_schema={"resume_id": "string", "structured_data": "object"},
            handler=self._tool_update_resume_data
        ))

        # 4. generate_latex
        self.register(ToolDefinition(
            name="generate_latex",
            description="Generate clean LaTeX source code from structured resume data.",
            input_schema={"resume_id": "string", "template": "string", "options": "object"},
            handler=self._tool_generate_latex
        ))

        # 5. validate_latex
        self.register(ToolDefinition(
            name="validate_latex",
            description="Validate LaTeX source syntax and verify safety constraints.",
            input_schema={"latex_source": "string"},
            handler=self._tool_validate_latex
        ))

        # 6. compile_latex
        self.register(ToolDefinition(
            name="compile_latex",
            description="Compile LaTeX source into a PDF in an isolated temporary environment.",
            input_schema={"resume_id": "string", "source": "string"},
            handler=self._tool_compile_latex
        ))

        # 7. render_pdf
        self.register(ToolDefinition(
            name="render_pdf",
            description="Render compiled PDF pages into PNG images.",
            input_schema={"pdf_path": "string"},
            handler=self._tool_render_pdf
        ))

        # 8. inspect_pdf
        self.register(ToolDefinition(
            name="inspect_pdf",
            description="Analyze PDF text, page count, bounding boxes, margins, and overflow.",
            input_schema={"pdf_path": "string", "target_pages": "integer"},
            handler=self._tool_inspect_pdf
        ))

        # 9. inspect_layout
        self.register(ToolDefinition(
            name="inspect_layout",
            description="Combine PDF geometry analysis with visual model inspection.",
            input_schema={"pdf_path": "string", "model_name": "string"},
            handler=self._tool_inspect_layout
        ))

        # 10. edit_latex
        self.register(ToolDefinition(
            name="edit_latex",
            description="Apply a targeted modification to LaTeX source.",
            input_schema={"resume_id": "string", "latex_source": "string"},
            handler=self._tool_edit_latex
        ))

        # 11. get_compile_diagnostics
        self.register(ToolDefinition(
            name="get_compile_diagnostics",
            description="Return compiler diagnostics and detailed logs for resolving issues.",
            input_schema={"resume_id": "string"},
            handler=self._tool_get_compile_diagnostics
        ))

        # 12. save_resume_version
        self.register(ToolDefinition(
            name="save_resume_version",
            description="Persist the current state as a version snapshot.",
            input_schema={"resume_id": "string", "change_summary": "string"},
            handler=self._tool_save_resume_version
        ))

        # 13. export_resume
        self.register(ToolDefinition(
            name="export_resume",
            description="Retrieve paths or content for exporting PDF or LaTeX.",
            input_schema={"resume_id": "string", "format": "string"},
            handler=self._tool_export_resume
        ))

    # --- Tool Implementations ---

    def _tool_get_resume_data(self, resume_id: str) -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        return {
            'id': str(resume.id),
            'title': resume.title,
            'structured_data': resume.structured_data,
            'selected_template': resume.selected_template,
            'version': resume.version,
            'current_latex': resume.current_latex,
            'latest_pdf_path': resume.latest_pdf_path,
        }

    def _tool_plan_resume_changes(self, resume_id: str, instruction: str) -> Dict[str, Any]:
        from .change_planner import plan_rule_based_fallback
        resume = Resume.objects.get(pk=resume_id)
        return plan_rule_based_fallback(resume.structured_data, instruction)

    def _tool_update_resume_data(self, resume_id: str, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        clean_data = validate_structured_data(structured_data)
        resume = Resume.objects.get(pk=resume_id)
        resume.structured_data = clean_data
        resume.save(update_fields=['structured_data'])
        return {'success': True, 'resume_id': str(resume.id)}

    def _tool_generate_latex(self, resume_id: str, template: Optional[str] = None, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        tpl = template or resume.selected_template
        source = generate_latex_resume(resume.structured_data, tpl, options)
        resume.current_latex = source
        resume.save(update_fields=['current_latex'])
        return {'success': True, 'latex_source': source}

    def _tool_validate_latex(self, latex_source: str) -> Dict[str, Any]:
        return validate_latex_source(latex_source)

    def _tool_compile_latex(self, resume_id: str, source: Optional[str] = None) -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        src = source or resume.current_latex
        result = compile_latex_to_pdf(src, str(resume.id))
        if result['success']:
            resume.latest_pdf_path = result['pdf_path']
            resume.current_latex = src
            resume.save(update_fields=['latest_pdf_path', 'current_latex'])
        return result

    def _tool_render_pdf(self, pdf_path: str) -> Dict[str, Any]:
        pages = render_pdf_to_images(pdf_path)
        return {'pages_count': len(pages), 'pages': pages}

    def _tool_inspect_pdf(self, pdf_path: str, target_pages: int = 1) -> Dict[str, Any]:
        return analyze_pdf_geometry(pdf_path, target_pages=target_pages)

    def _tool_inspect_layout(self, pdf_path: str, model_name: Optional[str] = None) -> Dict[str, Any]:
        return perform_full_pdf_inspection(pdf_path, model_name=model_name)

    def _tool_edit_latex(self, resume_id: str, latex_source: str) -> Dict[str, Any]:
        val = validate_latex_source(latex_source)
        if not val['valid']:
            return {'success': False, 'errors': val['errors']}
        resume = Resume.objects.get(pk=resume_id)
        resume.current_latex = latex_source
        resume.save(update_fields=['current_latex'])
        return {'success': True}

    def _tool_get_compile_diagnostics(self, resume_id: str) -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        return {
            'latest_pdf_path': resume.latest_pdf_path,
            'has_pdf': bool(resume.latest_pdf_path),
            'current_latex_len': len(resume.current_latex or '')
        }

    def _tool_save_resume_version(self, resume_id: str, change_summary: str = "") -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        resume.version += 1
        resume.save(update_fields=['version'])
        version = ResumeVersion.objects.create(
            resume=resume,
            version_number=resume.version,
            change_summary=change_summary,
            structured_data=resume.structured_data,
            latex_source=resume.current_latex,
            pdf_path=resume.latest_pdf_path
        )
        return {'success': True, 'version_number': version.version_number}

    def _tool_export_resume(self, resume_id: str, format: str = "pdf") -> Dict[str, Any]:
        resume = Resume.objects.get(pk=resume_id)
        return {
            'pdf_path': resume.latest_pdf_path,
            'format': format,
            'download_url': f"/api/latex/export/{resume.id}/?format={format}"
        }

# Global tool registry instance
tool_registry = AgentToolRegistry()
