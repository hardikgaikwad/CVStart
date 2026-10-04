"""URLs for system diagnostics and health."""
from django.urls import path
from .views import HealthCheckView, DiagnosticsView, OllamaStatusView, LatexStatusView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='system_health'),
    path('diagnostics/', DiagnosticsView.as_view(), name='system_diagnostics'),
    path('ollama/', OllamaStatusView.as_view(), name='system_ollama'),
    path('latex/', LatexStatusView.as_view(), name='system_latex'),
]
