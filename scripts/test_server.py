import subprocess
import time
import httpx

print("Launching CVstart on port 9999...")
proc = subprocess.Popen(['.\\.venv\\Scripts\\CVstart.exe', '--no-browser'])

ready = False
for i in range(20):
    time.sleep(0.5)
    try:
        r = httpx.get('http://127.0.0.1:9999/api/system/health/', timeout=1.0)
        if r.status_code == 200:
            ready = True
            break
    except Exception:
        pass

print(f"Server Ready on port 9999: {ready}")

if ready:
    with httpx.Client(base_url='http://127.0.0.1:9999', timeout=5.0) as client:
        r_root = client.get('/')
        print(f"Root SPA status: {r_root.status_code}")
        print(f"Content-Type: {r_root.headers.get('content-type')}")
        has_root = 'id="root"' in r_root.text or 'root' in r_root.text
        print(f"Contains React SPA index: {has_root}")

        r_health = client.get('/api/system/health/')
        print(f"Health API: {r_health.json()}")

        r_resumes = client.get('/api/resumes/')
        print(f"Resumes API: {len(r_resumes.json())} resumes found")

        r_diag = client.get('/api/system/diagnostics/')
        print(f"Diagnostics API LaTeX available: {r_diag.json().get('latex', {}).get('available')}")

proc.terminate()
try:
    proc.wait(timeout=3)
except Exception:
    proc.kill()
print("CVstart cleanly terminated.")
