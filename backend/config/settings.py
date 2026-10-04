"""
Django settings for CVstart project.
Local-first, AI-powered agentic LaTeX resume builder.
"""

import os
import sys
from pathlib import Path

# Project paths
# BASE_DIR is the root of the repository (e.g. Z:\...\Launch Challenge)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

SECRET_KEY = os.environ.get(
    'CVSTART_SECRET_KEY',
    'cvstart-local-deterministic-secret-key-for-local-first-resumes'
)

# Debug is disabled by default for cleaner logs, enabled if requested
DEBUG = os.environ.get('CVSTART_DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    'testserver',
    '0.0.0.0',
]

# Allow custom host via environment
custom_host = os.environ.get('CVSTART_HOST')
if custom_host and custom_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(custom_host)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'corsheaders',
    'rest_framework',

    # Local apps
    'backend.apps.resumes.apps.ResumesConfig',
    'backend.apps.ai.apps.AiConfig',
    'backend.apps.latex.apps.LatexConfig',
    'backend.apps.inspection.apps.InspectionConfig',
    'backend.apps.system.apps.SystemConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

X_FRAME_OPTIONS = 'SAMEORIGIN'

ROOT_URLCONF = 'backend.config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'frontend' / 'dist',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.config.wsgi.application'

# Database
# Local SQLite database in workspace
WORKSPACE_DIR = BASE_DIR / 'workspace'
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': WORKSPACE_DIR / 'cvstart.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = []

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = WORKSPACE_DIR / 'collected_static'

STATICFILES_DIRS = []
frontend_dist = BASE_DIR / 'frontend' / 'dist'
if frontend_dist.exists():
    STATICFILES_DIRS.append(frontend_dist)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'backend.apps.system.views.custom_exception_handler',
}

# CORS settings for development mode (e.g. Vite on port 5173)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:9999',
    'http://127.0.0.1:9999',
]
CORS_ALLOW_ALL_ORIGINS = DEBUG

# CVstart specific settings
CVSTART_SETTINGS = {
    'WORKSPACE_DIR': WORKSPACE_DIR,
    'BIN_DIR': BASE_DIR / 'bin',
    'LATEX_TEMPLATES_DIR': BASE_DIR / 'latex_templates',
    'OLLAMA_URL': os.environ.get('OLLAMA_HOST', 'http://127.0.0.1:11434'),
    'DEFAULT_MODEL': os.environ.get('CVSTART_MODEL', ''),
    'MAX_AGENT_ITERATIONS': 3,
    'COMPILATION_TIMEOUT': 30, # seconds
}
