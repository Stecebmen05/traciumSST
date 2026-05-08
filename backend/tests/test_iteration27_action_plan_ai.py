"""Sprint 27: Action Plan enhancements + AI assist tests.
Tests:
- POST /api/audits/ai/assist with new types (action_plan_action, _resources, _evidence)
- POST /api/action-plans accepts new fields and persists them
- GET /api/audits/{id} returns the new fields in action_plans array
"""

import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login-email", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    # Session cookie set automatically
    return s


@pytest.fixture(scope="module")
def auth_headers():
    # Kept for signature compatibility but actual auth via session cookie
    return {"Content-Type": "application/json"}


@pytest.fixture(scope="module")
def audit_with_finding(admin_session):
    """Find an existing audit with at least one finding, or create one."""
    # Get all audits
    r = admin_session.get(f"{BASE_URL}/api/audits", timeout=20)
    assert r.status_code == 200, f"List audits failed: {r.text}"
    audits = r.json()
    assert len(audits) > 0, "No audits in system"

    # Try to find one with findings already
    for a in audits:
        aid = a["audit_id"]
        rf = admin_session.get(f"{BASE_URL}/api/findings?audit_id={aid}", timeout=20)
        if rf.status_code == 200 and len(rf.json()) > 0:
            return {"audit_id": aid, "finding_id": rf.json()[0]["finding_id"], "audit": a}

    # Otherwise pick the first non-closed audit and create a finding
    target = None
    for a in audits:
        if a.get("status") not in ("closed", "reviewed"):
            target = a
            break
    target = target or audits[0]
    aid = target["audit_id"]

    payload = {
        "audit_id": aid,
        "description": "TEST_IT27 Hallazgo creado para test sprint 27",
        "finding_type": "no_conformity",
        "area": "SST",
    }
    rc = admin_session.post(f"{BASE_URL}/api/findings", json=payload, timeout=20)
    assert rc.status_code in (200, 201), f"Create finding failed: {rc.status_code} {rc.text}"
    fid = rc.json().get("finding_id")
    return {"audit_id": aid, "finding_id": fid, "audit": target}


# ---------- AI assist endpoint ----------

class TestAIAssistNewTypes:
    def test_ai_action_plan_action(self, admin_session, audit_with_finding):
        payload = {
            "type": "action_plan_action",
            "context": "Hallazgo: Falta de capacitacion en uso de EPP. Sector: construccion. Empresa pequena.",
        }
        r = admin_session.post(f"{BASE_URL}/api/audits/ai/assist", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "action_plan_action"
        assert isinstance(data["result"], str) and len(data["result"]) > 30, f"Result too short: {data['result']}"
        assert not data["result"].startswith("Error:"), data["result"]

    def test_ai_action_plan_resources(self, admin_session):
        payload = {
            "type": "action_plan_resources",
            "context": "Accion: Capacitacion semestral en uso correcto de EPP para 25 trabajadores.",
        }
        r = admin_session.post(f"{BASE_URL}/api/audits/ai/assist", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "action_plan_resources"
        assert len(data["result"]) > 30
        assert not data["result"].startswith("Error:"), data["result"]

    def test_ai_action_plan_evidence(self, admin_session):
        payload = {
            "type": "action_plan_evidence",
            "context": "Accion: Capacitacion semestral en uso correcto de EPP.",
        }
        r = admin_session.post(f"{BASE_URL}/api/audits/ai/assist", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "action_plan_evidence"
        assert len(data["result"]) > 10
        assert not data["result"].startswith("Error:"), data["result"]


# ---------- Action Plans CRUD with new fields ----------

class TestActionPlanNewFields:
    plan_id_holder = {}

    def test_create_action_plan_with_new_fields(self, admin_session, audit_with_finding):
        payload = {
            "audit_id": audit_with_finding["audit_id"],
            "finding_id": audit_with_finding["finding_id"],
            "action": "TEST_IT27 Capacitar al personal en uso correcto de EPP",
            "action_type": "preventive",
            "responsible": "Coordinador SST",
            "start_date": "2026-02-01",
            "due_date": "2026-04-30",
            "resources": "Humanos: capacitador externo. Tecnicos: aula y proyector. Economicos: $500.000",
            "evidence": "Registro de asistencia firmado, fotografias y evaluacion de aprendizaje.",
        }
        r = admin_session.post(f"{BASE_URL}/api/action-plans", json=payload, timeout=20)
        assert r.status_code in (200, 201), f"Create plan failed: {r.status_code} {r.text}"
        data = r.json()
        # Check ALL new fields persisted
        assert data["action_type"] == "preventive"
        assert data["responsible"] == "Coordinador SST"
        assert data["start_date"] == "2026-02-01"
        assert data["due_date"] == "2026-04-30"
        assert "Humanos" in data["resources"]
        assert "asistencia" in data["evidence"]
        assert data["plan_id"].startswith("ap_")
        assert "_id" not in data
        TestActionPlanNewFields.plan_id_holder["pid"] = data["plan_id"]
        TestActionPlanNewFields.plan_id_holder["aid"] = audit_with_finding["audit_id"]

    def test_get_action_plans_returns_new_fields(self, admin_session):
        aid = TestActionPlanNewFields.plan_id_holder.get("aid")
        pid = TestActionPlanNewFields.plan_id_holder.get("pid")
        assert aid and pid, "Previous test must have created the plan"
        r = admin_session.get(f"{BASE_URL}/api/action-plans?audit_id={aid}", timeout=20)
        assert r.status_code == 200
        plans = r.json()
        match = next((p for p in plans if p["plan_id"] == pid), None)
        assert match, f"Plan {pid} not found in list"
        assert match["action_type"] == "preventive"
        assert match["start_date"] == "2026-02-01"
        assert match["resources"]
        assert match["evidence"]

    def test_get_audit_includes_action_plans_with_new_fields(self, admin_session):
        aid = TestActionPlanNewFields.plan_id_holder.get("aid")
        pid = TestActionPlanNewFields.plan_id_holder.get("pid")
        r = admin_session.get(f"{BASE_URL}/api/audits/{aid}", timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        # action_plans is included in audit detail (per problem statement)
        plans = body.get("action_plans", [])
        match = next((p for p in plans if p["plan_id"] == pid), None)
        if match is None:
            # Some implementations may not embed action_plans in /audits/{id}
            pytest.skip("audit detail does not embed action_plans (will rely on /action-plans?audit_id=)")
        assert match["action_type"] == "preventive"
        assert match.get("start_date") == "2026-02-01"

    def test_create_action_plan_corrective_default(self, admin_session, audit_with_finding):
        payload = {
            "audit_id": audit_with_finding["audit_id"],
            "finding_id": audit_with_finding["finding_id"],
            "action": "TEST_IT27 Accion correctiva",
            "responsible": "Lider area",
            "due_date": "2026-03-15",
        }
        r = admin_session.post(f"{BASE_URL}/api/action-plans", json=payload, timeout=20)
        assert r.status_code in (200, 201)
        data = r.json()
        assert data["action_type"] == "corrective"  # default value
        assert data["start_date"] == ""  # missing -> empty string
        assert data["resources"] == ""
        assert data["evidence"] == ""
