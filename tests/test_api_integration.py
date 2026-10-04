"""
Integration tests for Django REST Framework API endpoints and SPA serving.
"""

import pytest
from rest_framework.test import APIClient
from backend.apps.resumes.models import Resume

@pytest.mark.django_db
def test_system_health_endpoint():
    """Verify /api/system/health/ responds with status ok."""
    client = APIClient()
    response = client.get('/api/system/health/')
    assert response.status_code == 200
    assert response.data['status'] == 'healthy'
    assert response.data['app'] == 'CVstart'

@pytest.mark.django_db
def test_system_diagnostics_endpoint():
    """Verify /api/system/diagnostics/ returns system diagnostics."""
    client = APIClient()
    response = client.get('/api/system/diagnostics/')
    assert response.status_code == 200
    assert 'latex' in response.data
    assert 'ollama' in response.data
    assert 'workspace' in response.data

@pytest.mark.django_db
def test_resume_crud_api_flow():
    """Verify complete CRUD flow via API."""
    client = APIClient()

    # 1. Create
    create_res = client.post('/api/resumes/', {
        'title': 'API Test Resume',
        'target_role': 'QA Architect',
        'structured_data': {
            'personal': {'full_name': 'Test User'},
            'summary': 'Integration test summary.'
        }
    }, format='json')
    assert create_res.status_code == 201
    resume_id = create_res.data['id']

    # 2. Retrieve
    get_res = client.get(f'/api/resumes/{resume_id}/')
    assert get_res.status_code == 200
    assert get_res.data['title'] == 'API Test Resume'

    # 3. Patch
    patch_res = client.patch(f'/api/resumes/{resume_id}/', {
        'title': 'API Test Resume Updated'
    }, format='json')
    assert patch_res.status_code == 200
    assert patch_res.data['title'] == 'API Test Resume Updated'

    # 4. Generate LaTeX
    gen_res = client.post(f'/api/latex/generate/{resume_id}/', format='json')
    assert gen_res.status_code == 200
    assert r'\documentclass' in gen_res.data['latex_source']

    # 5. Compile
    compile_res = client.post(f'/api/latex/compile/{resume_id}/', format='json')
    assert compile_res.status_code == 200
    assert compile_res.data['success'] is True

    # 6. Stream PDF
    pdf_res = client.get(f'/api/latex/pdf/{resume_id}/')
    assert pdf_res.status_code == 200
    assert pdf_res['Content-Type'] == 'application/pdf'

    # 7. Plan Changes via AI endpoint
    plan_res = client.post(f'/api/ai/plan-changes/{resume_id}/', {
        'instruction': 'Make this fit on one page'
    }, format='json')
    assert plan_res.status_code == 200
    assert plan_res.data['success'] is True

    # 8. Delete
    del_res = client.delete(f'/api/resumes/{resume_id}/')
    assert del_res.status_code == 200

@pytest.mark.django_db
def test_spa_index_serving():
    """Verify that root / and client routes serve the React frontend index.html."""
    client = APIClient()
    response = client.get('/')
    assert response.status_code == 200
    assert 'text/html' in response['Content-Type']
    # Check that client routes also route to SPA
    client_route_res = client.get('/dashboard')
    assert client_route_res.status_code == 200
    assert 'text/html' in client_route_res['Content-Type']
