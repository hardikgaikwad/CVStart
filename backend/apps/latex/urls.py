"""
URLs for LaTeX generation and compilation.
"""

from django.urls import path
from .views import (
    GenerateLatexView,
    ValidateLatexView,
    CompileLatexView,
    PdfServeView,
    PdfPagesView,
    ExportView,
)

urlpatterns = [
    path('generate/<uuid:pk>/', GenerateLatexView.as_view(), name='latex_generate'),
    path('validate/', ValidateLatexView.as_view(), name='latex_validate'),
    path('compile/<uuid:pk>/', CompileLatexView.as_view(), name='latex_compile'),
    path('pdf/<uuid:pk>/', PdfServeView.as_view(), name='latex_pdf'),
    path('pdf/<uuid:pk>/pages/', PdfPagesView.as_view(), name='latex_pdf_pages'),
    path('export/<uuid:pk>/', ExportView.as_view(), name='latex_export'),
]
