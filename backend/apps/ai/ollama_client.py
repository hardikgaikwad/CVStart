"""
Ollama HTTP Client for CVstart.
Manages local model discovery, structured generation, chat completions, and connection health.
"""

import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

class OllamaError(Exception):
    """Exception raised when an Ollama API call fails."""
    pass

class OllamaClient:
    """Client for interacting with local Ollama service."""

    def __init__(self, base_url: Optional[str] = None, timeout: float = 60.0):
        self.base_url = (base_url or settings.CVSTART_SETTINGS.get('OLLAMA_URL', 'http://127.0.0.1:11434')).rstrip('/')
        self.timeout = timeout

    def check_health(self) -> Dict[str, Any]:
        """Test whether Ollama server is reachable."""
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        'reachable': True,
                        'models_count': len(data.get('models', [])),
                        'error': None
                    }
                return {
                    'reachable': False,
                    'models_count': 0,
                    'error': f"Ollama returned HTTP status {resp.status_code}"
                }
        except Exception as e:
            return {
                'reachable': False,
                'models_count': 0,
                'error': f"Cannot connect to Ollama at {self.base_url}: {e}"
            }

    def list_installed_models(self) -> List[Dict[str, Any]]:
        """
        Query available models and enrich with capability flags.
        """
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                if resp.status_code != 200:
                    return []

                raw_models = resp.json().get('models', [])
                enriched = []

                for m in raw_models:
                    name = m.get('name', '')
                    details = m.get('details', {}) or {}
                    families = details.get('families', []) or []
                    family = details.get('family', '')
                    param_size = details.get('parameter_size', '')

                    is_vision = any('clip' in str(f).lower() or 'vision' in str(f).lower() for f in families) or 'vision' in name.lower() or 'llava' in name.lower()

                    enriched.append({
                        'name': name,
                        'model': m.get('model', name),
                        'size_bytes': m.get('size', 0),
                        'parameter_size': param_size,
                        'family': family,
                        'families': families,
                        'supports_vision': is_vision,
                        'supports_structured_json': True,
                        'modified_at': m.get('modified_at', '')
                    })

                return enriched
        except Exception as e:
            logger.warning("Failed to list Ollama models: %s", e)
            return []

    def generate(
        self,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_format: bool = False,
        temperature: float = 0.2,
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Invoke Ollama generation endpoint.
        """
        if not model:
            raise OllamaError("No Ollama model specified.")

        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_format:
            payload["format"] = "json"

        client_timeout = timeout or self.timeout

        try:
            with httpx.Client(timeout=client_timeout) as client:
                resp = client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code != 200:
                    raise OllamaError(f"Ollama generation failed with HTTP {resp.status_code}: {resp.text}")

                data = resp.json()
                response_text = data.get('response', '')

                parsed_json = None
                if json_format:
                    try:
                        parsed_json = json.loads(response_text)
                    except json.JSONDecodeError as jde:
                        # Attempt to extract markdown code blocks if model wrapped in ```json
                        import re
                        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
                        if match:
                            parsed_json = json.loads(match.group(1))
                        else:
                            raise OllamaError(f"Model returned malformed JSON: {jde}. Raw response: {response_text[:200]}")

                return {
                    'response': response_text,
                    'json': parsed_json,
                    'total_duration': data.get('total_duration'),
                    'eval_count': data.get('eval_count'),
                }
        except httpx.ConnectError:
            raise OllamaError(
                f"Cannot connect to Ollama at {self.base_url}. Ensure Ollama is running (`ollama serve`)."
            )
        except httpx.TimeoutException:
            raise OllamaError(
                f"Ollama inference timed out after {client_timeout}s. Try a smaller/quantized model."
            )
        except Exception as e:
            if isinstance(e, OllamaError):
                raise
            raise OllamaError(f"Ollama inference error: {e}")
