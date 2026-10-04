"""
URLs for Resumes app.
"""

from django.urls import path
from .views import (
    ResumeListCreateView,
    ResumeDetailView,
    ResumeVersionsListView,
    ResumeRestoreVersionView,
    ResumeDuplicateView,
)

urlpatterns = [
    path('', ResumeListCreateView.as_view(), name='resume_list_create'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<uuid:pk>/versions/', ResumeVersionsListView.as_view(), name='resume_versions'),
    path('<uuid:pk>/versions/<int:version_number>/restore/', ResumeRestoreVersionView.as_view(), name='resume_restore_version'),
    path('<uuid:pk>/duplicate/', ResumeDuplicateView.as_view(), name='resume_duplicate'),
]
