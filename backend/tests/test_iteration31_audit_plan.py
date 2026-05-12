"""
Sprint 31 - Audit Plan PDF + Send Email endpoints
- GET /api/audits/{audit_id}/plan/pdf  (admin/owner/auditor/sgsst_manager allowed any status)
- POST /api/audits/{audit_id}/plan/send-email  (sends via Resend to verified domain)
- Regression: opening/closing minutes still work for admin
- Regression: indicators/arl + documents/templates + notifications + action-plans
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "admin":        {"email": "admin@traciumsst.com",   "password": "TraciumSST2026!"},
    "auditor":      {"email": "maria@empresa.com",      "password": "Maria2026!"},
    "auditor_ui":   {"email": "auditor_ui@test.com",    "password": "Aud2026!"},
    "sgsst":        {"email": "sgsst_ui@test.com",      "password": "Mgr2026!"},
    "collaborator": {"email": "pedro@empresa.com",      "password": "Pedro2026!"},
}

def _login(role):
    s = requests.Session()
    r = s.post(f"{API}/auth/login-email", json=CREDS[role], timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Login for {role} failed: {r.status_code} {r.text[:200]}")
    tok = s.cookies.get("session_token")
    if not tok:
        pytest.skip(f"No session_token cookie for {role}")
    return tok

def _h(tok):
    return {"Authorization": f"Bearer {tok}"}

@pytest.fixture(scope="module")
def admin_tok():
    return _login("admin")

@pytest.fixture(scope="module")
def auditor_tok():
    return _login("auditor")

@pytest.fixture(scope="module")
def sgsst_tok():
    return _login("sgsst")

@pytest.fixture(scope="module")
def collab_tok():
    return _login("collaborator")

@pytest.fixture(scope="module")
def audit_id(admin_tok):
    # find an existing audit (any status)
    r = requests.get(f"{API}/audits", headers=_h(admin_tok), timeout=20)
    assert r.status_code == 200, r.text
    audits = r.json()
    if not audits:
        # Create one
        payload = {
            "title": "TEST_Plan_Auditoria_Sprint31",
            "audit_type": "internal",
            "scheduled_date": "2026-02-15",
            "end_date": "2026-02-15",
            "auditor": "Test Auditor Lider",
            "scope": "Procesos SG-SST",
            "objective": "Verificacion estandares 0312/2019",
        }
        cr = requests.post(f"{API}/audits", headers=_h(admin_tok), json=payload, timeout=20)
        assert cr.status_code in (200, 201), cr.text
        return cr.json().get("audit_id") or cr.json().get("id")
    return audits[0]["audit_id"]


# ===== PLAN PDF =====
class TestAuditPlanPDF:
    def test_admin_gets_pdf(self, admin_tok, audit_id):
        r = requests.get(f"{API}/audits/{audit_id}/plan/pdf", headers=_h(admin_tok), timeout=30)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:4] == b"%PDF"

    def test_auditor_gets_pdf(self, auditor_tok, audit_id):
        r = requests.get(f"{API}/audits/{audit_id}/plan/pdf", headers=_h(auditor_tok), timeout=30)
        assert r.status_code == 200, r.text
        assert r.content[:4] == b"%PDF"

    def test_sgsst_manager_gets_pdf_any_status(self, sgsst_tok, audit_id):
        # Key test: sgsst_manager must succeed even if audit is NOT closed (pre-audit doc)
        r = requests.get(f"{API}/audits/{audit_id}/plan/pdf", headers=_h(sgsst_tok), timeout=30)
        assert r.status_code == 200, f"sgsst should be allowed any status: {r.status_code} {r.text[:200]}"
        assert r.content[:4] == b"%PDF"

    def test_collaborator_forbidden(self, collab_tok, audit_id):
        r = requests.get(f"{API}/audits/{audit_id}/plan/pdf", headers=_h(collab_tok), timeout=20)
        assert r.status_code == 403, r.text

    def test_unknown_audit_returns_404(self, admin_tok):
        r = requests.get(f"{API}/audits/nonexistent_xyz_999/plan/pdf", headers=_h(admin_tok), timeout=20)
        assert r.status_code == 404, r.text


# ===== PLAN SEND-EMAIL =====
class TestAuditPlanSendEmail:
    def test_admin_sends_email(self, admin_tok, audit_id):
        payload = {
            "recipients": ["stephaniaceballosmendoza@gmail.com"],
            "comment": "TEST automated - please confirm",
        }
        r = requests.post(f"{API}/audits/{audit_id}/plan/send-email", headers=_h(admin_tok), json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("sent", "total", "recipients", "failed"):
            assert k in data, f"missing key {k}: {data}"
        assert isinstance(data["recipients"], list)
        assert data["total"] >= 1
        # At least the verified recipient should be in the request list
        assert "stephaniaceballosmendoza@gmail.com" in [e.lower() for e in data["recipients"]]
        # The verified recipient should be sent (Resend free-tier)
        assert data["sent"] >= 1, f"expected at least 1 sent, got {data}"

    def test_sgsst_can_send_email(self, sgsst_tok, audit_id):
        r = requests.post(f"{API}/audits/{audit_id}/plan/send-email", headers=_h(sgsst_tok),
                          json={"recipients": ["stephaniaceballosmendoza@gmail.com"], "comment": "sgsst test"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("sent", 0) >= 1

    def test_collaborator_forbidden_email(self, collab_tok, audit_id):
        r = requests.post(f"{API}/audits/{audit_id}/plan/send-email", headers=_h(collab_tok),
                          json={"recipients": ["x@y.com"]}, timeout=20)
        assert r.status_code == 403, r.text

    def test_unknown_audit_email_404(self, admin_tok):
        r = requests.post(f"{API}/audits/nonexistent_xyz_999/plan/send-email", headers=_h(admin_tok),
                          json={"recipients": ["stephaniaceballosmendoza@gmail.com"]}, timeout=20)
        assert r.status_code == 404, r.text


# ===== REGRESSION =====
class TestRegression:
    def test_opening_minutes_admin(self, admin_tok, audit_id):
        r = requests.get(f"{API}/audits/{audit_id}/opening-minutes/pdf", headers=_h(admin_tok), timeout=30)
        # admin always allowed; could 200 or 404 if no checklist - but doc exists for any audit
        assert r.status_code == 200, r.text
        assert r.content[:4] == b"%PDF"

    def test_closing_minutes_admin(self, admin_tok, audit_id):
        r = requests.get(f"{API}/audits/{audit_id}/closing-minutes/pdf", headers=_h(admin_tok), timeout=30)
        assert r.status_code == 200, r.text
        assert r.content[:4] == b"%PDF"

    def test_indicators_arl(self, admin_tok):
        r = requests.get(f"{API}/indicators/arl?year=2026&month=1", headers=_h(admin_tok), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)

    def test_documents_templates(self, admin_tok):
        r = requests.get(f"{API}/documents/templates", headers=_h(admin_tok), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        # Accept either list or {items: [...]} shape
        items = data.get("items") if isinstance(data, dict) else data
        assert isinstance(items, list) and len(items) > 0

    def test_notifications(self, admin_tok):
        r = requests.get(f"{API}/notifications", headers=_h(admin_tok), timeout=20)
        assert r.status_code == 200, r.text

    def test_action_plans(self, admin_tok):
        r = requests.get(f"{API}/action-plans", headers=_h(admin_tok), timeout=20)
        assert r.status_code == 200, r.text
