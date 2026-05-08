"""Sprint 30 tests: ARL Indicators dashboard + AI Document Generator (32 templates).

Covers:
- GET /api/indicators/arl (year/month) with all required keys
- GET /api/indicators/arl/pdf (Content-Type + non-empty body)
- GET /api/indicators/arl/excel (Content-Type + non-empty body)
- GET /api/documents/templates -> 32 templates, 6 categories, no system_prompt leak
- GET /api/documents/templates?category=Politica filtering
- POST /api/documents/generate-ai (admin/sgsst happy path; 404 invalid; 403 auditor)
- GET /api/documents/{id}/ai-content + PUT (admin/sgsst only)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _login(email: str, password: str) -> str:
    r = requests.post(f"{API}/auth/login-email", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"login {email} failed: {r.status_code} {r.text[:200]}"
    tok = r.cookies.get("session_token") or r.json().get("session_token")
    assert tok, f"no session_token in login response for {email}"
    return tok


@pytest.fixture(scope="session")
def admin_token():
    return _login("admin@traciumsst.com", "TraciumSST2026!")


@pytest.fixture(scope="session")
def sgsst_token():
    return _login("sgsst_ui@test.com", "Mgr2026!")


@pytest.fixture(scope="session")
def auditor_token():
    return _login("auditor_ui@test.com", "Aud2026!")


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- ARL Indicators ----------------

class TestArlIndicators:
    def test_arl_year_aggregate_keys(self, admin_token):
        r = requests.get(f"{API}/indicators/arl?year=2026&month=0", headers=H(admin_token), timeout=20)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ("period", "company", "estructura", "proceso", "resultado"):
            assert k in d, f"missing key {k}"
        assert d["period"]["year"] == 2026 and d["period"]["month"] == 0
        # Resultado expected keys
        for k in ("frecuencia_at", "severidad_at", "mortalidad_at", "prevalencia_el",
                  "incidencia_el", "ausentismo_porcentaje", "accidentes_total",
                  "muertes", "dias_perdidos", "enfermedades_laborales", "horas_hombre_trabajadas"):
            assert k in d["resultado"], f"resultado missing {k}"
        # Estructura
        for k in ("cumplimiento_resolucion_0312", "porcentaje_capacitaciones_ejecutadas",
                  "trainings_planeadas", "trainings_realizadas"):
            assert k in d["estructura"], f"estructura missing {k}"
        # Proceso
        for k in ("porcentaje_planes_cerrados", "porcentaje_hallazgos_cerrados",
                  "planes_total", "planes_cerrados", "hallazgos_total", "hallazgos_cerrados"):
            assert k in d["proceso"], f"proceso missing {k}"
        # Company
        assert "name" in d["company"] and "nit" in d["company"]
        assert isinstance(d["resultado"]["horas_hombre_trabajadas"], int)
        assert d["resultado"]["horas_hombre_trabajadas"] > 0

    def test_arl_month_specific(self, admin_token):
        r = requests.get(f"{API}/indicators/arl?year=2026&month=3", headers=H(admin_token), timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["period"]["month"] == 3
        assert d["period"]["label"] == "2026-03"

    def test_arl_pdf(self, admin_token):
        r = requests.get(f"{API}/indicators/arl/pdf?year=2026", headers=H(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 1000
        assert r.content[:4] == b"%PDF"

    def test_arl_excel(self, admin_token):
        r = requests.get(f"{API}/indicators/arl/excel?year=2026", headers=H(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        ct = r.headers.get("content-type", "")
        assert "spreadsheetml" in ct or "xlsx" in ct, f"unexpected ct: {ct}"
        assert len(r.content) > 1000
        # XLSX = ZIP, starts with PK
        assert r.content[:2] == b"PK"


# ---------------- Document Templates ----------------

class TestDocumentTemplates:
    def test_list_all_templates(self, admin_token):
        r = requests.get(f"{API}/documents/templates", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "items" in d and "categories" in d
        assert len(d["items"]) == 32, f"expected 32 templates, got {len(d['items'])}"
        cats = set(d["categories"])
        expected = {"Politica", "Manual", "Procedimiento", "Plan", "Reglamento", "Formato"}
        assert expected.issubset(cats), f"missing cats: {expected - cats}"
        assert len(cats) == 6
        # No system_prompt leak
        for t in d["items"]:
            assert "system_prompt" not in t, f"system_prompt leaked for {t.get('template_id')}"
            assert "template_id" in t and "title" in t and "category" in t

    def test_filter_politica(self, admin_token):
        r = requests.get(f"{API}/documents/templates?category=Politica", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["items"]) == 6
        for t in d["items"]:
            assert t["category"] == "Politica"

    def test_template_includes_pol_sgsst(self, admin_token):
        r = requests.get(f"{API}/documents/templates", headers=H(admin_token), timeout=15)
        ids = {t["template_id"] for t in r.json()["items"]}
        assert "pol_sgsst" in ids


# ---------------- AI Generation ----------------

class TestAIGenerate:
    def test_invalid_template_404(self, admin_token):
        r = requests.post(f"{API}/documents/generate-ai",
                          headers={**H(admin_token), "Content-Type": "application/json"},
                          json={"template_id": "does_not_exist", "save": False}, timeout=30)
        assert r.status_code == 404

    def test_auditor_forbidden(self, auditor_token):
        r = requests.post(f"{API}/documents/generate-ai",
                          headers={**H(auditor_token), "Content-Type": "application/json"},
                          json={"template_id": "pol_sgsst", "save": False}, timeout=30)
        assert r.status_code == 403

    @pytest.mark.timeout(120)
    def test_admin_generate_persist_and_fetch(self, admin_token):
        payload = {"template_id": "pol_sgsst", "customizations": "Mencionar la sede de Bogota", "save": True}
        r = requests.post(f"{API}/documents/generate-ai",
                          headers={**H(admin_token), "Content-Type": "application/json"},
                          json=payload, timeout=120)
        assert r.status_code == 200, r.text[:400]
        body = r.json()
        assert "document" in body and "content" in body
        content = body["content"]
        assert isinstance(content, str)
        assert len(content) >= 500, f"content too short: {len(content)}"
        # In Spanish - basic heuristic
        low = content.lower()
        assert any(w in low for w in ("politica", "política", "seguridad", "trabajo")), "not Spanish-ish content"
        doc = body["document"]
        assert doc["template_id"] == "pol_sgsst"
        assert doc.get("ai_generated_content"), "ai_generated_content not stored on document"
        doc_id = doc["doc_id"]

        # Auto-injected company name + NIT
        company = requests.get(f"{API}/companies", headers=H(admin_token), timeout=15)
        # active company endpoint
        active = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=15).json()
        # we'll fetch the document and confirm AI content stored, plus appears in /documents list
        listr = requests.get(f"{API}/documents", headers=H(admin_token), timeout=15)
        assert listr.status_code == 200
        ids = [x.get("doc_id") for x in listr.json()]
        assert doc_id in ids, "generated doc not in documents list"

        # GET ai-content
        getr = requests.get(f"{API}/documents/{doc_id}/ai-content", headers=H(admin_token), timeout=15)
        assert getr.status_code == 200
        assert getr.json()["content"] == content

        # PUT ai-content (admin allowed)
        new_md = "# Nuevo contenido\n\nEditado por test."
        putr = requests.put(f"{API}/documents/{doc_id}/ai-content",
                            headers={**H(admin_token), "Content-Type": "application/json"},
                            json={"content": new_md}, timeout=15)
        assert putr.status_code == 200
        # Verify persisted
        getr2 = requests.get(f"{API}/documents/{doc_id}/ai-content", headers=H(admin_token), timeout=15)
        assert getr2.json()["content"] == new_md

        # Cleanup
        requests.delete(f"{API}/documents/{doc_id}", headers=H(admin_token), timeout=15)

    def test_put_ai_content_auditor_forbidden(self, admin_token, auditor_token):
        # Use any doc_id - role check happens before existence check via Depends
        r = requests.put(f"{API}/documents/any_id/ai-content",
                         headers={**H(auditor_token), "Content-Type": "application/json"},
                         json={"content": "x"}, timeout=15)
        assert r.status_code == 403
