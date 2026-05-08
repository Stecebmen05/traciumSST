"""
Iteration 19 tests: Document approval workflow + Audit closure approval + Chatbot context toggle.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login-email", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def admin_user(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    return r.json()


@pytest.fixture
def temp_doc(admin_session):
    """Create a disposable document for each test."""
    payload = {
        "title": f"TEST_doc_{uuid.uuid4().hex[:6]}",
        "category": "policy",
        "version": "1.0",
        "description": "pytest temp doc",
        "content_url": "",
    }
    r = admin_session.post(f"{BASE_URL}/api/documents", json=payload)
    assert r.status_code in (200, 201), f"doc create failed: {r.status_code} {r.text}"
    doc = r.json()
    yield doc
    # cleanup
    try:
        admin_session.delete(f"{BASE_URL}/api/documents/{doc['doc_id']}")
    except Exception:
        pass


# ==================== DOCUMENT APPROVAL WORKFLOW ====================

class TestDocumentApproval:

    def test_submit_approval_sets_pending(self, admin_session, temp_doc):
        r = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["approval_status"] == "pending"
        assert data.get("submitted_by")
        assert data.get("submitted_at")
        assert len(data.get("approval_history", [])) >= 1
        assert data["approval_history"][-1]["action"] == "submitted"

    def test_submit_twice_returns_400(self, admin_session, temp_doc):
        r1 = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        assert r1.status_code == 200
        r2 = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        assert r2.status_code == 400

    def test_admin_can_approve_own_submission(self, admin_session, temp_doc):
        # Admin submits then approves (SoD exception for admin)
        admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        r = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/approve", json={"comment": "ok"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["approval_status"] == "approved"
        assert data.get("approved_by")
        actions = [h["action"] for h in data.get("approval_history", [])]
        assert "submitted" in actions and "approved" in actions

        # Verify persistence via GET list
        g = admin_session.get(f"{BASE_URL}/api/documents")
        assert g.status_code == 200
        found = [d for d in g.json() if d.get("doc_id") == temp_doc["doc_id"]]
        assert found and found[0]["approval_status"] == "approved"

    def test_approve_non_pending_rejected(self, admin_session, temp_doc):
        # No submit -> draft, approve should 400
        r = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/approve", json={})
        assert r.status_code == 400

    def test_reject_requires_reason(self, admin_session, temp_doc):
        admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        r = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/reject", json={"reason": ""})
        assert r.status_code == 400
        r2 = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/reject", json={"reason": "  "})
        assert r2.status_code == 400

    def test_reject_with_reason_sets_rejected(self, admin_session, temp_doc):
        admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        r = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/reject",
                               json={"reason": "Falta firma del representante legal"})
        assert r.status_code == 200
        data = r.json()
        assert data["approval_status"] == "rejected"
        assert data["rejection_reason"] == "Falta firma del representante legal"
        actions = [h["action"] for h in data.get("approval_history", [])]
        assert "rejected" in actions

    def test_segregation_of_duties_for_sgsst_manager(self, admin_session, admin_user, temp_doc):
        """Create a sgsst_manager user; they submit -> cannot approve own doc (403)."""
        # Create test sgsst_manager
        email = f"TEST_mgr_{uuid.uuid4().hex[:6]}@test.com"
        password = "MgrTest2026!"
        r = admin_session.post(f"{BASE_URL}/api/auth/create-user", json={
            "email": email, "password": password, "name": "TEST Manager",
            "role": "sgsst_manager", "company_id": admin_user.get("company_id", "")
        })
        if r.status_code not in (200, 201):
            pytest.skip(f"Cannot create sgsst_manager: {r.status_code} {r.text}")
        try:
            mgr_session = requests.Session()
            lr = mgr_session.post(f"{BASE_URL}/api/auth/login-email", json={"email": email, "password": password})
            assert lr.status_code == 200, lr.text

            sub = mgr_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
            assert sub.status_code == 200, sub.text

            # Manager tries to approve their own submission -> 403
            appr = mgr_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/approve", json={})
            assert appr.status_code == 403, f"Expected 403 SoD, got {appr.status_code} {appr.text}"

            # Admin can override and approve
            admin_appr = admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/approve", json={})
            assert admin_appr.status_code == 200, admin_appr.text
            assert admin_appr.json()["approval_status"] == "approved"
        finally:
            # Try deleting test user (best-effort)
            try:
                users = admin_session.get(f"{BASE_URL}/api/users").json()
                tu = next((u for u in users if u.get("email") == email), None)
                if tu:
                    admin_session.delete(f"{BASE_URL}/api/users/{tu.get('user_id') or tu.get('id')}")
            except Exception:
                pass


# ==================== AUDIT CLOSURE APPROVAL ====================

@pytest.fixture
def temp_audit(admin_session):
    """Create an audit with required closure fields pre-set."""
    payload = {
        "title": f"TEST_audit_{uuid.uuid4().hex[:6]}",
        "audit_type": "sgsst",
        "scope": "General",
        "objective": "Test",
        "criteria": "Res 0312",
        "scheduled_date": "2026-01-10",
        "start_time": "09:00",
        "end_date": "2026-01-10",
        "end_time": "17:00",
        "auditor": "TEST Auditor",
        "copasst_member": {"name": "COPASST Test", "role": "member"},
    }
    r = admin_session.post(f"{BASE_URL}/api/audits", json=payload)
    assert r.status_code in (200, 201), r.text
    a = r.json()
    yield a
    try:
        admin_session.delete(f"{BASE_URL}/api/audits/{a['audit_id']}")
    except Exception:
        pass


class TestAuditClosureApproval:

    def test_submit_closure_sets_pending(self, admin_session, temp_audit):
        r = admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/submit-closure",
                               json={"end_date": "2026-01-11", "end_time": "18:00"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["closure_approval_status"] == "pending"
        assert data.get("pending_closure_data", {}).get("end_date") == "2026-01-11"
        assert data["status"] != "closed"

    def test_submit_closure_validates_required_fields(self, admin_session):
        # Audit missing auditor/copasst
        bad = admin_session.post(f"{BASE_URL}/api/audits",
                                 json={"title": "TEST_bad", "audit_type": "sgsst",
                                       "scheduled_date": "2026-01-01", "start_time": "09:00"}).json()
        try:
            r = admin_session.post(f"{BASE_URL}/api/audits/{bad['audit_id']}/submit-closure",
                                   json={"end_date": "", "end_time": ""})
            assert r.status_code == 400
        finally:
            admin_session.delete(f"{BASE_URL}/api/audits/{bad['audit_id']}")

    def test_admin_approve_closure(self, admin_session, temp_audit):
        admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/submit-closure",
                           json={"end_date": "2026-01-11", "end_time": "18:00"})
        r = admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/approve-closure",
                               json={"comment": "OK"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "closed"
        assert data["closure_approval_status"] == "approved"
        assert data["end_date"] == "2026-01-11"

    def test_reject_closure_requires_reason(self, admin_session, temp_audit):
        admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/submit-closure",
                           json={"end_date": "2026-01-11", "end_time": "18:00"})
        r = admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/reject-closure",
                               json={"reason": ""})
        assert r.status_code == 400

        r2 = admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/reject-closure",
                                json={"reason": "Faltan evidencias"})
        assert r2.status_code == 200
        d = r2.json()
        assert d["closure_approval_status"] == "rejected"
        assert d["closure_rejection_reason"] == "Faltan evidencias"


# ==================== /api/approvals/pending ====================

class TestPendingApprovals:

    def test_pending_returns_structure(self, admin_session, temp_doc, temp_audit):
        admin_session.post(f"{BASE_URL}/api/documents/{temp_doc['doc_id']}/submit-approval")
        admin_session.post(f"{BASE_URL}/api/audits/{temp_audit['audit_id']}/submit-closure",
                           json={"end_date": "2026-01-11", "end_time": "18:00"})
        r = admin_session.get(f"{BASE_URL}/api/approvals/pending")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "documents" in data and "audits" in data and "total" in data
        assert isinstance(data["documents"], list) and isinstance(data["audits"], list)
        doc_ids = [d["doc_id"] for d in data["documents"]]
        audit_ids = [a["audit_id"] for a in data["audits"]]
        assert temp_doc["doc_id"] in doc_ids
        assert temp_audit["audit_id"] in audit_ids
        assert data["total"] == len(data["documents"]) + len(data["audits"])


# ==================== AI CHATBOT CONTEXT ====================

class TestChatbotContext:

    def test_chat_without_context_has_flag_false(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/ai/chat",
                               json={"message": "Que es el SG-SST?"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("context_used") is False
        assert isinstance(data.get("message"), str) and len(data["message"]) > 0

    def test_chat_with_context_sets_flag_true_and_grounded(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Cuantos hallazgos abiertos tengo en mi empresa? Responde brevemente con el numero.",
                  "include_context": True,
                  "session_id": f"test_ctx_{uuid.uuid4().hex[:8]}"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("context_used") is True
        assert isinstance(data.get("message"), str) and len(data["message"]) > 0

    def test_chat_rejects_empty(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/ai/chat", json={"message": ""})
        assert r.status_code == 400
