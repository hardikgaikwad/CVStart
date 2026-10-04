"""
URLs for PDF inspection app.
"""

from django.urls import path
from .views import InspectPdfView, CheckVisionCapabilityView

urlpatterns = [
    path('inspect/<uuid:pk>/', InspectPdfView.as_view(), name='inspection_inspect'),
    path('vision-check/', CheckVisionCapabilityView.as_view(), name='inspection_vision_check'),
]
