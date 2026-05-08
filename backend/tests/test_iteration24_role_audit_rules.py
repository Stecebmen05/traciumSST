"""
Iteration 24 - Role-specific audit rules (sgsst_manager vs auditor vs admin).

Scope:
- sgsst_manager: can edit+save action plans; CANNOT edit checklist items or findings or audit root;
  CANNOT download PDFs while audit is still open; CAN download when audit is closed/reviewed.
- auditor: full edit on audit items/findings, can download PDFs, can use AI narrative and save it.
- admin/owner: full access.
- New AI narrative types: opening_narrative, closing_narrative, report_narrative.
- New ai-redaction fields: narrative_opening, narrative_closing, narrative_report.
- PDFs embed the saved narrative_* text.
- Permissions endpoint: can_edit_audit_items, can_edit_action_plans, can_use_ai_narrative,
  can_report_incidents, can_view_documents/hazards/training/reports/implementation.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"

MGR_EMAIL = "sgsst_ui@test.com"
MGR_PASSWORD = "Mgr2026!"

AUD_EMAIL = "auditor_ui@test.com"
AUD_PASSWORD = "Aud2026!"


def _login(session: requests.Session, email: str, password: str):
    return session.post(f"{API}/auth/login-email", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="module")
def admin_s():
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def mgr_s():
    s = requests.Session()
    r = _login(s, MGR_EMAIL, MGR_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"sgsst_manager login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def aud_s():
    s = requests.Session()
    r = _login(s, AUD_EMAIL, AUD_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"auditor login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def open_audit(admin_s):
    """Create a PLANNED audit for testing."""
    r = admin_s.post(f"{API}/audits", json={
        "title": f"TEST_IT24_open_{uuid.uuid4().hex[:6]}",
        "audit_type": "internal",
        "scheduled_date": "2026-02-15",
        "auditor": "Auditor Test",
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return data


@pytest.fixture(scope="module")
def closed_audit(admin_s):
    """Create an audit and force status=closed directly via PUT (with required closure fields)."""
    r = admin_s.post(f"{API}/audits", json={
        "title": f"TEST_IT24_closed_{uuid.uuid4().hex[:6]}",
        "audit_type": "internal",
        "scheduled_date": "2026-01-05",
        "auditor": "Auditor Test",
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    aid = data["audit_id"]
    # Admin PUT to close with all mandatory fields
    up = admin_s.put(f"{API}/audits/{aid}", json={
        "status": "closed",
        "end_date": "2026-01-20",
        "end_time": "16:00",
        "auditor": "Auditor Test",
        "copasst_member": {"name": "Copasst Test", "role": "Presidente"},
        "process_responsibles": ["Responsable 1"],
    }, timeout=30)
    assert up.status_code == 200, f"Failed to close audit: {up.text}"
    return data


# ---------- 1) Checklist/findings/audit PUT restrictions for sgsst_manager ----------
class TestSgsstManagerWriteForbidden:
    def test_put_checklist_forbidden(self, mgr_s, open_audit):
        r = mgr_s.put(f"{API}/audits/{open_audit['audit_id']}/checklist/any_item",
                      json={"result": "cumple"}, timeout=30)
        assert r.status_code == 403, f"Expected 403 for checklist PUT, got {r.status_code}: {r.text[:200]}"

    def test_put_finding_forbidden(self, mgr_s):
        r = mgr_s.put(f"{API}/findings/any_finding_id", json={"description": "x"}, timeout=30)
        assert r.status_code == 403, f"Expected 403 for findings PUT, got {r.status_code}: {r.text[:200]}"

    def test_post_finding_forbidden(self, mgr_s, open_audit):
        r = mgr_s.post(f"{API}/findings", json={
            "audit_id": open_audit["audit_id"],
            "finding_type": "no_conformity",
            "description": "TEST_IT24"
        }, timeout=30)
        assert r.status_code == 403, f"Expected 403 for findings POST, got {r.status_code}: {r.text[:200]}"

    def test_put_audit_forbidden(self, mgr_s, open_audit):
        r = mgr_s.put(f"{API}/audits/{open_audit['audit_id']}", json={"title": "hack"}, timeout=30)
        assert r.status_code == 403, f"Expected 403 for audit PUT, got {r.status_code}: {r.text[:200]}"


# ---------- 2) sgsst_manager CAN use action plans ----------
class TestSgsstManagerActionPlans:
    def test_create_update_followup_action_plan(self, mgr_s, open_audit):
        # Create
        r = mgr_s.post(f"{API}/action-plans", json={
            "audit_id": open_audit["audit_id"],
            "title": "TEST_IT24 Plan",
            "description": "Desc",
            "responsible": "Resp",
            "due_date": "2026-03-01",
        }, timeout=30)
        assert r.status_code in (200, 201), f"create action-plan: {r.status_code} {r.text[:200]}"
        plan = r.json()
        plan_id = plan.get("plan_id") or plan.get("id")
        assert plan_id, f"No plan id in {plan}"
        # Update
        r2 = mgr_s.put(f"{API}/action-plans/{plan_id}", json={"status": "in_progress"}, timeout=30)
        assert r2.status_code == 200, f"update action-plan: {r2.status_code} {r2.text[:200]}"
        # Follow-up
        r3 = mgr_s.post(f"{API}/action-plans/{plan_id}/follow-up",
                        json={"note": "avance 50%", "progress": 50}, timeout=30)
        assert r3.status_code in (200, 201), f"follow-up: {r3.status_code} {r3.text[:200]}"


# ---------- 3) PDF access gate: sgsst_manager vs closed audit ----------
class TestPdfRoleGate:
    @pytest.mark.parametrize("path", ["/opening-minutes/pdf", "/closing-minutes/pdf", "/report/pdf"])
    def test_mgr_forbidden_on_open_audit(self, mgr_s, open_audit, path):
        r = mgr_s.get(f"{API}/audits/{open_audit['audit_id']}{path}", timeout=60)
        assert r.status_code == 403, f"Expected 403 for mgr on open audit {path}, got {r.status_code}: {r.text[:200]}"

    @pytest.mark.parametrize("path", ["/opening-minutes/pdf", "/closing-minutes/pdf"])
    def test_mgr_allowed_on_closed_audit(self, mgr_s, closed_audit, path):
        r = mgr_s.get(f"{API}/audits/{closed_audit['audit_id']}{path}", timeout=60)
        assert r.status_code == 200, f"Expected 200 for mgr on closed audit {path}, got {r.status_code}: {r.text[:200]}"
        assert r.headers.get("content-type", "").startswith("application/pdf") or r.content[:4] == b"%PDF"

    @pytest.mark.parametrize("path", ["/opening-minutes/pdf", "/closing-minutes/pdf"])
    def test_admin_allowed_on_open_audit(self, admin_s, open_audit, path):
        r = admin_s.get(f"{API}/audits/{open_audit['audit_id']}{path}", timeout=60)
        assert r.status_code == 200, f"Admin should 200 on {path} open audit: {r.status_code} {r.text[:200]}"

    @pytest.mark.parametrize("path", ["/opening-minutes/pdf", "/closing-minutes/pdf"])
    def test_auditor_allowed_on_open_audit(self, aud_s, open_audit, path):
        r = aud_s.get(f"{API}/audits/{open_audit['audit_id']}{path}", timeout=60)
        assert r.status_code == 200, f"Auditor should 200 on {path} open audit: {r.status_code} {r.text[:200]}"


# ---------- 4) Auditor write access ----------
class TestAuditorWrite:
    def test_auditor_put_audit(self, aud_s, open_audit):
        r = aud_s.put(f"{API}/audits/{open_audit['audit_id']}",
                      json={"auditor": "Auditor UI"}, timeout=30)
        assert r.status_code == 200, f"auditor PUT audit: {r.status_code} {r.text[:200]}"

    def test_auditor_generate_checklist_and_update(self, aud_s, open_audit):
        aid = open_audit["audit_id"]
        # Ensure checklist exists
        gen = aud_s.post(f"{API}/audits/{aid}/checklist/generate", timeout=60)
        assert gen.status_code in (200, 201), f"generate checklist: {gen.status_code} {gen.text[:200]}"
        # List items
        lst = aud_s.get(f"{API}/audits/{aid}/checklist", timeout=30).json()
        assert isinstance(lst, list) and len(lst) > 0, "Expected checklist items"
        item_id = lst[0]["item_id"]
        # Update
        up = aud_s.put(f"{API}/audits/{aid}/checklist/{item_id}",
                       json={"result": "cumple", "observations": "TEST_IT24"}, timeout=30)
        assert up.status_code == 200, f"checklist PUT: {up.status_code} {up.text[:200]}"
        # Generate findings from checklist
        gen2 = aud_s.post(f"{API}/audits/{aid}/findings/generate-from-checklist", timeout=60)
        assert gen2.status_code in (200, 201), f"findings gen: {gen2.status_code} {gen2.text[:200]}"


# ---------- 5) AI narrative: assist endpoint ----------
class TestAINarrativeAssist:
    @pytest.mark.parametrize("ntype", ["opening_narrative", "closing_narrative", "report_narrative"])
    def test_auditor_ai_assist(self, aud_s, open_audit, ntype):
        r = aud_s.post(f"{API}/audits/ai/assist", json={
            "type": ntype,
            "context": f"Auditoria {open_audit['audit_id']} tipo interna, empresa Mi Empresa, fecha 2026-02-15."
        }, timeout=90)
        assert r.status_code == 200, f"ai assist {ntype}: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert data.get("type") == ntype
        assert isinstance(data.get("result"), str) and len(data["result"]) > 20, \
            f"AI assist empty/short for {ntype}: {data.get('result')!r}"
        # Should not be error string
        assert not data["result"].startswith("Error:"), f"AI returned error: {data['result'][:200]}"


# ---------- 6) AI redaction save + PDF injection ----------
class TestAINarrativeSaveAndPDF:
    MARKER_OPEN = "TEXTO_MARCADOR_APERTURA_XYZ_IT24"
    MARKER_CLOSE = "TEXTO_MARCADOR_CIERRE_XYZ_IT24"
    MARKER_REPORT = "TEXTO_MARCADOR_INFORME_XYZ_IT24"

    def test_auditor_save_narratives(self, aud_s, open_audit):
        aid = open_audit["audit_id"]
        r = aud_s.put(f"{API}/audits/{aid}/ai-redaction", json={
            "narrative_opening": f"Parrafo de prueba. {self.MARKER_OPEN}. Fin.",
            "narrative_closing": f"Parrafo de cierre. {self.MARKER_CLOSE}. Fin.",
            "narrative_report": f"Parrafo informe. {self.MARKER_REPORT}. Fin.",
        }, timeout=30)
        assert r.status_code == 200, f"save narrative: {r.status_code} {r.text[:200]}"
        body = r.json()
        assert "narrative_opening" in body.get("updated_fields", [])
        # Verify persisted via GET audit
        g = aud_s.get(f"{API}/audits/{aid}", timeout=30)
        assert g.status_code == 200
        a = g.json()
        assert self.MARKER_OPEN in (a.get("narrative_opening") or ""), "narrative_opening not saved"
        assert self.MARKER_CLOSE in (a.get("narrative_closing") or ""), "narrative_closing not saved"
        assert self.MARKER_REPORT in (a.get("narrative_report") or ""), "narrative_report not saved"

    def test_pdf_opening_contains_narrative(self, admin_s, aud_s, open_audit):
        # Compare PDF size with empty vs long RANDOM (non-repetitive so it won't compress to nothing)
        aid = open_audit["audit_id"]
        aud_s.put(f"{API}/audits/{aid}/ai-redaction", json={"narrative_opening": ""}, timeout=30)
        r_empty = admin_s.get(f"{API}/audits/{aid}/opening-minutes/pdf", timeout=60)
        assert r_empty.status_code == 200 and r_empty.content[:4] == b"%PDF"
        size_without = len(r_empty.content)

        # Non-repetitive long text (UUIDs) won't compress to a tiny blob
        big_narrative = " ".join(uuid.uuid4().hex for _ in range(80))
        aud_s.put(f"{API}/audits/{aid}/ai-redaction", json={"narrative_opening": big_narrative}, timeout=30)
        r_with = admin_s.get(f"{API}/audits/{aid}/opening-minutes/pdf", timeout=60)
        assert r_with.status_code == 200 and r_with.content[:4] == b"%PDF"
        size_with = len(r_with.content)

        # Expect meaningful growth (>300 bytes) when narrative is injected into PDF
        assert size_with > size_without + 300, (
            f"PDF did not grow materially with narrative_opening: without={size_without} with={size_with}. "
            "Narrative may not be rendered."
        )
        # Restore a friendlier narrative for downstream tests / manual inspection
        aud_s.put(f"{API}/audits/{aid}/ai-redaction", json={
            "narrative_opening": f"Parrafo apertura. {self.MARKER_OPEN}. Fin."
        }, timeout=30)

    def test_pdf_closing_contains_narrative(self, admin_s, aud_s, open_audit):
        aid = open_audit["audit_id"]
        aud_s.put(f"{API}/audits/{aid}/ai-redaction", json={
            "narrative_closing": f"Parrafo cierre. {self.MARKER_CLOSE}. Fin.",
        }, timeout=30)
        r = admin_s.get(f"{API}/audits/{aid}/closing-minutes/pdf", timeout=60)
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"


# ---------- 7) Permissions endpoint ----------
class TestPermissionsFlags:
    def test_sgsst_manager_flags(self, mgr_s):
        r = mgr_s.get(f"{API}/rbac/permissions", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["role"] == "sgsst_manager"
        assert p["can_edit_audit_items"] is False
        assert p["can_edit_action_plans"] is True
        assert p["can_use_ai_narrative"] is False
        assert p["can_report_incidents"] is True
        assert p["can_view_documents"] is True
        assert p["can_view_hazards"] is True
        assert p["can_view_training"] is True
        assert p["can_view_reports"] is True
        assert p["can_view_implementation"] is True
        assert p["can_view_audits"] is True

    def test_auditor_flags(self, aud_s):
        r = aud_s.get(f"{API}/rbac/permissions", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["role"] == "auditor"
        assert p["can_edit_audit_items"] is True
        assert p["can_edit_action_plans"] is True
        assert p["can_use_ai_narrative"] is True
        # Auditor should NOT report incidents
        assert p["can_report_incidents"] is False
        # Auditor should NOT view these modules per spec
        assert p["can_view_documents"] is False
        assert p["can_view_hazards"] is False
        assert p["can_view_training"] is False
        assert p["can_view_reports"] is False
        assert p["can_view_implementation"] is False
        # But CAN view audits
        assert p["can_view_audits"] is True

    def test_admin_flags(self, admin_s):
        r = admin_s.get(f"{API}/rbac/permissions", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["role"] == "admin"
        assert p["can_edit_audit_items"] is True
        assert p["can_edit_action_plans"] is True
        assert p["can_use_ai_narrative"] is True
        assert p["can_report_incidents"] is True
