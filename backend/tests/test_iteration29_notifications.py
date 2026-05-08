"""Sprint 29: Action Plan Notifications (in-app + email).

Verifies:
- POST /api/action-plans triggers in-app notification of type action_plan_created
  for admins/sgsst_managers (excluding actor)
- Actor does NOT receive notification for own action
- PUT /api/action-plans/{id} -> action_plan_updated; with status=closed -> action_plan_closed
- POST /api/action-plans/{id}/follow-up -> action_plan_follow_up with note in message
- GET /api/notifications returns {items, unread_count}, sorted DESC
- GET ?only_unread=true filter
- PUT /api/notifications/{id}/read marks as read; 404 for non-owned
- POST /api/notifications/mark-all-read
- DELETE /api/notifications/{id}; 404 for non-owned
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASS = "TraciumSST2026!"
SGSST_EMAIL = "sgsst_ui@test.com"
SGSST_PASS = "Mgr2026!"
AUDITOR_EMAIL = "auditor_ui@test.com"
AUDITOR_PASS = "Aud2026!"


def _login(email, password):
    r = requests.post(f"{API}/auth/login-email", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
    user = r.json()
    token = r.cookies.get("session_token")
    assert token, f"No session_token cookie returned for {email}"
    return token, user


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin():
    token, user = _login(ADMIN_EMAIL, ADMIN_PASS)
    return {"token": token, "user": user, "headers": _h(token)}


@pytest.fixture(scope="module")
def sgsst():
    token, user = _login(SGSST_EMAIL, SGSST_PASS)
    return {"token": token, "user": user, "headers": _h(token)}


@pytest.fixture(scope="module")
def auditor():
    token, user = _login(AUDITOR_EMAIL, AUDITOR_PASS)
    return {"token": token, "user": user, "headers": _h(token)}


@pytest.fixture(scope="module")
def audit_id(admin):
    """Get an existing audit id to attach plans to."""
    r = requests.get(f"{API}/audits", headers=admin["headers"], timeout=15)
    assert r.status_code == 200, f"Audits list failed: {r.status_code} {r.text}"
    items = r.json()
    if not items:
        pytest.skip("No audits available to attach plans")
    return items[0].get("audit_id")


# ---------- helpers ----------

def _list_notifs(headers, only_unread=False):
    params = {"only_unread": str(only_unread).lower(), "limit": 100}
    r = requests.get(f"{API}/notifications", headers=headers, params=params, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _wait_for_notif(headers, related_id, ntype, timeout=10):
    """Poll up to `timeout` seconds for a notification to appear."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        data = _list_notifs(headers)
        for it in data.get("items", []):
            if it.get("related_id") == related_id and it.get("type") == ntype:
                return it
        time.sleep(0.6)
    return None


# ---------- Tests ----------

class TestNotificationsFlow:

    def test_health_login(self, admin, sgsst):
        assert admin["user"].get("user_id")
        assert sgsst["user"].get("user_id")

    def test_create_plan_notifies_others_not_actor(self, sgsst, admin, audit_id):
        # baseline counts
        admin_before = _list_notifs(admin["headers"]).get("unread_count", 0)
        sgsst_before = _list_notifs(sgsst["headers"]).get("unread_count", 0)

        body = {
            "audit_id": audit_id,
            "action": "TEST_NOTIF Acción correctiva inspección EPP",
            "action_type": "corrective",
            "responsible": "TEST Responsable",
            "due_date": "2026-12-31",
        }
        r = requests.post(f"{API}/action-plans", headers=sgsst["headers"], json=body, timeout=15)
        assert r.status_code == 200, r.text
        plan = r.json()
        plan_id = plan.get("plan_id")
        assert plan_id

        # Admin should receive a notif of type action_plan_created
        notif = _wait_for_notif(admin["headers"], plan_id, "action_plan_created", timeout=12)
        assert notif is not None, "Admin did not receive action_plan_created notification"
        assert notif["read"] is False
        assert notif["title"]
        assert notif["message"]
        assert notif["link"] == "/audits"
        assert notif["related_id"] == plan_id
        assert "notification_id" in notif
        assert "user_id" in notif
        assert "created_at" in notif

        # Actor (sgsst) should NOT receive notification for own action
        sgsst_data = _list_notifs(sgsst["headers"])
        for it in sgsst_data["items"]:
            assert it.get("related_id") != plan_id, "Actor should not receive own notif"

        # Unread count for admin should have grown
        admin_after = _list_notifs(admin["headers"]).get("unread_count", 0)
        assert admin_after >= admin_before + 1
        # sgsst unread should NOT increase due to this plan (might increase from other tests but not from own)
        # Best-effort assertion already done above

        # store on class for further tests
        TestNotificationsFlow.plan_id = plan_id

    def test_update_plan_triggers_updated(self, sgsst, admin):
        plan_id = getattr(TestNotificationsFlow, "plan_id", None)
        assert plan_id, "plan_id missing - prior test must run"
        r = requests.put(
            f"{API}/action-plans/{plan_id}",
            headers=sgsst["headers"],
            json={"progress": 30, "responsible": "TEST Responsable v2"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        notif = _wait_for_notif(admin["headers"], plan_id, "action_plan_updated", timeout=12)
        assert notif is not None, "Admin did not receive action_plan_updated"

    def test_followup_triggers_followup_with_note(self, sgsst, admin):
        plan_id = getattr(TestNotificationsFlow, "plan_id", None)
        note_text = "TEST seguimiento - se realizo capacitacion EPP el 12/01"
        r = requests.post(
            f"{API}/action-plans/{plan_id}/follow-up",
            headers=sgsst["headers"],
            json={"note": note_text},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        notif = _wait_for_notif(admin["headers"], plan_id, "action_plan_follow_up", timeout=12)
        assert notif is not None
        assert "TEST seguimiento" in notif.get("message", ""), f"Note text missing: {notif.get('message')}"

    def test_close_plan_triggers_closed(self, sgsst, admin):
        plan_id = getattr(TestNotificationsFlow, "plan_id", None)
        r = requests.put(
            f"{API}/action-plans/{plan_id}",
            headers=sgsst["headers"],
            json={"status": "closed", "progress": 100},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        notif = _wait_for_notif(admin["headers"], plan_id, "action_plan_closed", timeout=12)
        assert notif is not None, "Admin did not receive action_plan_closed"

    def test_list_sorted_desc_and_shape(self, admin):
        data = _list_notifs(admin["headers"])
        items = data["items"]
        assert isinstance(items, list)
        assert "unread_count" in data
        # sort desc by created_at
        if len(items) >= 2:
            assert items[0]["created_at"] >= items[1]["created_at"]
        # shape
        keys_required = {"notification_id", "user_id", "type", "title", "message", "link", "related_id", "read", "created_at"}
        for it in items[:5]:
            missing = keys_required - set(it.keys())
            assert not missing, f"Missing keys in notification: {missing}"

    def test_only_unread_filter(self, admin):
        data = _list_notifs(admin["headers"], only_unread=True)
        for it in data["items"]:
            assert it["read"] is False

    def test_mark_one_read(self, admin):
        data = _list_notifs(admin["headers"], only_unread=True)
        if not data["items"]:
            pytest.skip("No unread to mark")
        nid = data["items"][0]["notification_id"]
        r = requests.put(f"{API}/notifications/{nid}/read", headers=admin["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Verify it's read now
        unread_after = _list_notifs(admin["headers"], only_unread=True).get("items", [])
        assert all(it["notification_id"] != nid for it in unread_after)

    def test_mark_read_404_for_other_user_or_invalid(self, admin):
        r = requests.put(f"{API}/notifications/nonexistent_id_xyz/read", headers=admin["headers"], timeout=15)
        assert r.status_code == 404

    def test_mark_all_read(self, admin):
        # Ensure at least one unread by creating one (use sgsst to create another plan)
        # If none unread, just verify response shape
        r = requests.post(f"{API}/notifications/mark-all-read", headers=admin["headers"], timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert "updated" in body
        # After mark-all-read, unread should be 0
        data = _list_notifs(admin["headers"])
        assert data.get("unread_count", 0) == 0

    def test_delete_notification(self, admin, sgsst, audit_id):
        # Create one more plan to generate a fresh notification, then delete it
        body = {
            "audit_id": audit_id,
            "action": "TEST_NOTIF delete-flow",
            "action_type": "corrective",
            "due_date": "2026-12-31",
        }
        r = requests.post(f"{API}/action-plans", headers=sgsst["headers"], json=body, timeout=15)
        assert r.status_code == 200, r.text
        pid = r.json().get("plan_id")
        notif = _wait_for_notif(admin["headers"], pid, "action_plan_created", timeout=12)
        assert notif, "Did not get notification to delete"
        nid = notif["notification_id"]

        d = requests.delete(f"{API}/notifications/{nid}", headers=admin["headers"], timeout=15)
        assert d.status_code == 200
        assert d.json().get("ok") is True

        # 404 when deleting same id again
        d2 = requests.delete(f"{API}/notifications/{nid}", headers=admin["headers"], timeout=15)
        assert d2.status_code == 404
