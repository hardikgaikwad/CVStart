"""
Deterministic Agent Orchestrator for CVstart.
Controls the iterative Compile-Inspect-Correct agentic feedback loop with bounded execution limits.
"""

import copy
import logging
from typing import Dict, Any, List, Optional
from django.conf import settings

from backend.apps.resumes.models import Resume, ResumeVersion
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.compiler import compile_latex_to_pdf
from backend.apps.inspection.visual_inspector import perform_full_pdf_inspection
from .change_planner import plan_changes_with_model, plan_rule_based_fallback
from .ollama_client import OllamaError

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates the resume editing, compilation, PDF inspection, and iterative correction cycle.
    """

    def __init__(self, max_iterations: int = 3):
        self.max_iterations = max_iterations

    def run_refinement_cycle(
        self,
        resume_id: str,
        instruction: str,
        model_name: Optional[str] = None,
        target_pages: int = 1,
        auto_apply: bool = True
    ) -> Dict[str, Any]:
        """
        Execute bounded iterative refinement:
        Compile -> Inspect Geometry -> Propose Layout Correction -> Recompile -> Verify.
        """
        resume = Resume.objects.get(pk=resume_id)
        ollama_url = settings.CVSTART_SETTINGS.get('OLLAMA_URL', 'http://127.0.0.1:11434')

        # Snapshot initial state for safe recovery
        initial_data = copy.deepcopy(resume.structured_data)
        initial_latex = resume.current_latex
        initial_pdf = resume.latest_pdf_path

        iteration_trace = []
        applied_corrections = []

        # 1. Produce change plan
        plan = None
        if model_name:
            try:
                plan = plan_changes_with_model(
                    current_data=resume.structured_data,
                    instruction=instruction,
                    model_name=model_name,
                    ollama_url=ollama_url
                )
            except Exception as e:
                logger.warning("Model planning failed (%s), falling back to rule-based planner.", e)
                plan = plan_rule_based_fallback(resume.structured_data, instruction)
        else:
            plan = plan_rule_based_fallback(resume.structured_data, instruction)

        if not auto_apply:
            # Return plan for explicit user review
            return {
                'status': 'awaiting_approval',
                'plan': plan,
                'iteration_trace': []
            }

        # 2. Apply proposed data changes
        working_data = plan.get('proposed_structured_data', resume.structured_data)
        working_options = {
            'paper_size': resume.preferred_page_size,
            'font_size': '10pt',
            'margin': '0.5in',
        }
        working_latex = generate_latex_resume(working_data, resume.selected_template, working_options)

        # 3. Compile updated source
        compile_result = compile_latex_to_pdf(working_latex, str(resume.id))

        iteration_1 = {
            'iteration': 1,
            'action': 'Initial Plan & Compilation',
            'compile_success': compile_result['success'],
            'errors': compile_result.get('errors', []),
            'duration_seconds': compile_result.get('duration_seconds', 0)
        }

        if not compile_result['success']:
            # Revert to known valid state
            iteration_1['outcome'] = 'Failed initial compilation, reverting.'
            iteration_trace.append(iteration_1)
            return {
                'success': False,
                'status': 'compilation_failed',
                'summary': 'Proposed edits failed to compile. Reverted to previous state.',
                'errors': compile_result.get('errors', []),
                'iteration_trace': iteration_trace,
                'pdf_url': f"/api/latex/pdf/{resume.id}/" if resume.latest_pdf_path else None
            }

        current_pdf_path = compile_result['pdf_path']

        # 4. Objective inspection of compiled PDF
        inspection = perform_full_pdf_inspection(
            pdf_path=current_pdf_path,
            target_pages=target_pages,
            model_name=model_name,
            ollama_url=ollama_url
        )
        pages_count = inspection.get('pages_count', 1)
        iteration_1['pages_count'] = pages_count
        iteration_1['issues_detected'] = len(inspection.get('issues', []))
        iteration_trace.append(iteration_1)

        # Check if satisfactory
        is_satisfied = pages_count <= target_pages and len(inspection.get('issues', [])) == 0

        # 5. Iterative correction loop if not satisfied
        current_iteration = 1
        last_valid_latex = working_latex
        last_valid_pdf = current_pdf_path

        while not is_satisfied and current_iteration < self.max_iterations:
            current_iteration += 1

            if current_iteration == 2 and pages_count > target_pages:
                # Iteration 2: Adjust margins and spacing
                working_options['margin'] = '0.42in'
                working_latex = generate_latex_resume(working_data, resume.selected_template, working_options)
                action_desc = "Tuned geometry: Reduced margins to 0.42in to fit content."
                applied_corrections.append(action_desc)

            elif current_iteration == 3 and pages_count > target_pages:
                # Iteration 3: Tighten bullet points in structured data
                for exp in working_data.get('experience', []):
                    hl = exp.get('highlights', [])
                    if len(hl) > 2:
                        exp['highlights'] = hl[:2]
                working_latex = generate_latex_resume(working_data, resume.selected_template, working_options)
                action_desc = "Content trimming: Focused on top 2 highlights per experience entry."
                applied_corrections.append(action_desc)
            else:
                break

            # Compile iteration
            iter_compile = compile_latex_to_pdf(working_latex, str(resume.id))
            iter_info = {
                'iteration': current_iteration,
                'action': action_desc,
                'compile_success': iter_compile['success'],
            }

            if iter_compile['success']:
                last_valid_latex = working_latex
                last_valid_pdf = iter_compile['pdf_path']
                current_pdf_path = iter_compile['pdf_path']

                # Inspect again
                iter_inspection = perform_full_pdf_inspection(
                    pdf_path=current_pdf_path,
                    target_pages=target_pages,
                    model_name=model_name,
                    ollama_url=ollama_url
                )
                pages_count = iter_inspection.get('pages_count', 1)
                iter_info['pages_count'] = pages_count
                iter_info['issues_detected'] = len(iter_inspection.get('issues', []))

                if pages_count <= target_pages:
                    is_satisfied = True
                    iter_info['outcome'] = 'Target page count achieved!'
                    iteration_trace.append(iter_info)
                    break
                else:
                    iter_info['outcome'] = f"Still {pages_count} pages."
            else:
                iter_info['outcome'] = 'Compilation failed, discarding iteration.'
                iteration_trace.append(iter_info)
                break

            iteration_trace.append(iter_info)

        # 6. Commit final approved state
        resume.structured_data = working_data
        resume.current_latex = last_valid_latex
        resume.latest_pdf_path = last_valid_pdf
        resume.version += 1
        resume.save()

        summary_text = (
            f"Successfully updated resume ({len(applied_corrections)} corrections applied, "
            f"{current_iteration} iteration(s), final length: {pages_count} page(s))."
        )

        ResumeVersion.objects.create(
            resume=resume,
            version_number=resume.version,
            change_summary=summary_text,
            structured_data=resume.structured_data,
            latex_source=resume.current_latex,
            pdf_path=resume.latest_pdf_path
        )

        return {
            'success': True,
            'status': 'completed',
            'summary': summary_text,
            'pages_count': pages_count,
            'target_pages': target_pages,
            'iterations_count': current_iteration,
            'applied_corrections': applied_corrections,
            'iteration_trace': iteration_trace,
            'plan': plan,
            'pdf_url': f"/api/latex/pdf/{resume.id}/",
            'resume': {
                'id': str(resume.id),
                'version': resume.version,
                'current_latex': resume.current_latex,
                'structured_data': resume.structured_data,
            }
        }
