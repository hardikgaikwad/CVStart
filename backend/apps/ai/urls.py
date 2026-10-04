"""
URLs for AI module.
"""

from django.urls import path
from .views import (
    ModelListView,
    ParseRawResumeView,
    PlanChangesView,
    ApplyChangesView,
    IterativeRefineView
)

urlpatterns = [
    path('models/', ModelListView.as_view(), name='ai_models'),
    path('parse-raw/', ParseRawResumeView.as_view(), name='ai_parse_raw'),
    path('plan-changes/<uuid:pk>/', PlanChangesView.as_view(), name='ai_plan_changes'),
    path('apply-changes/<uuid:pk>/', ApplyChangesView.as_view(), name='ai_apply_changes'),
    path('refine/<uuid:pk>/', IterativeRefineView.as_view(), name='ai_refine'),
]
