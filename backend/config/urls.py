"""
URL Configuration for CVstart.
Routes API requests to appropriate apps, and falls back to React SPA index.html for UI routes.
"""

import os
from pathlib import Path
from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse, FileResponse, Http404

def serve_spa_index(request):
    """Serve the compiled React frontend index.html."""
    dist_dir = settings.BASE_DIR / 'frontend' / 'dist'
    index_file = dist_dir / 'index.html'
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        """
        <html>
            <head><title>CVstart - Initializing</title></head>
            <body style="font-family: sans-serif; background: #0b0f19; color: #e2e8f0; padding: 40px; text-align: center;">
                <h1>CVstart Backend Active</h1>
                <p>Frontend production build is being prepared or not yet built.</p>
                <p>Run <code>npm run build</code> in the <code>frontend/</code> directory, or start the Vite dev server.</p>
            </body>
        </html>
        """,
        content_type='text/html',
        status=200
    )

def serve_spa_asset(request, asset_path):
    """Serve static assets from frontend/dist/assets/."""
    asset_file = settings.BASE_DIR / 'frontend' / 'dist' / 'assets' / asset_path
    if asset_file.exists() and asset_file.is_file():
        # Prevent directory traversal
        try:
            asset_file.resolve().relative_to((settings.BASE_DIR / 'frontend' / 'dist' / 'assets').resolve())
        except ValueError:
            raise Http404("Asset not found")

        content_type = 'application/octet-stream'
        if asset_path.endswith('.js'):
            content_type = 'application/javascript'
        elif asset_path.endswith('.css'):
            content_type = 'text/css'
        elif asset_path.endswith('.svg'):
            content_type = 'image/svg+xml'
        elif asset_path.endswith('.png'):
            content_type = 'image/png'
        return FileResponse(open(asset_file, 'rb'), content_type=content_type)
    raise Http404("Asset not found")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/resumes/', include('backend.apps.resumes.urls')),
    path('api/ai/', include('backend.apps.ai.urls')),
    path('api/latex/', include('backend.apps.latex.urls')),
    path('api/inspection/', include('backend.apps.inspection.urls')),
    path('api/system/', include('backend.apps.system.urls')),
    path('assets/<path:asset_path>', serve_spa_asset, name='spa_asset'),
    # Catch-all for React frontend SPA client routing
    re_path(r'^(?!api/|admin/|assets/).*$', serve_spa_index, name='spa_index'),
]
