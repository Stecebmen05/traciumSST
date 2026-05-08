"""Tests for iteration 18: AI Chatbot (/api/ai/chat) and Dashboard unchanged."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    # Login via email endpoint sets httpOnly cookie
    r = s.post(f"{BASE_URL}/api/auth/login-email", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text[:200]}")
    token = s.cookies.get("session_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    me = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
    if me.status_code != 200:
        pytest.skip(f"Auth verify failed: {me.status_code} {me.text[:200]}")
    return s


# ---------- Dashboard unchanged ----------
class TestDashboardUnchanged:
    def test_dashboard_returns_expected_keys(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/dashboard", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        for k in ["kpis", "recent_incidents", "recent_findings", "audit_score"]:
            assert k in data, f"Missing key {k}"


# ---------- AI Chatbot ----------
class TestAIChatValidation:
    def test_empty_message_rejected(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/ai/chat", json={"message": ""}, timeout=15)
        assert r.status_code == 400

    def test_whitespace_only_rejected(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/ai/chat", json={"message": "     "}, timeout=15)
        assert r.status_code == 400

    def test_too_long_message_rejected(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/ai/chat", json={"message": "a" * 4001}, timeout=15)
        assert r.status_code == 400


class TestAIChatFlow:
    """End-to-end chatbot flow: send → history → multi-turn → delete."""

    def test_full_chat_flow(self, auth_session):
        # 1. First message
        r1 = auth_session.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Que es el SG-SST segun el Decreto 1072?"},
            timeout=90,
        )
        assert r1.status_code == 200, r1.text[:500]
        d1 = r1.json()
        assert "session_id" in d1 and d1["session_id"]
        assert "message" in d1 and d1["message"]
        assert "message_id" in d1
        session_id = d1["session_id"]

        # No _id leakage
        assert "_id" not in d1

        # 2. History returns both user + assistant messages
        rh = auth_session.get(f"{BASE_URL}/api/ai/chat/history", params={"session_id": session_id}, timeout=15)
        assert rh.status_code == 200
        hdata = rh.json()
        assert hdata["session_id"] == session_id
        assert isinstance(hdata["messages"], list)
        assert len(hdata["messages"]) >= 2
        roles = [m["role"] for m in hdata["messages"]]
        assert "user" in roles and "assistant" in roles
        for m in hdata["messages"]:
            assert "_id" not in m

        # 3. Multi-turn: follow up using same session_id
        r2 = auth_session.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Cuantos estandares son?", "session_id": session_id},
            timeout=90,
        )
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["session_id"] == session_id
        # Context preservation: expect reply to reference SG-SST / 60 standards / Res 0312
        reply_lower = d2["message"].lower()
        context_hit = any(kw in reply_lower for kw in ["60", "sesenta", "estandar", "0312", "sg-sst", "sgsst"])
        assert context_hit, f"Context not preserved: {d2['message'][:300]}"

        # 4. History now has >=4 messages
        rh2 = auth_session.get(f"{BASE_URL}/api/ai/chat/history", params={"session_id": session_id}, timeout=15)
        assert rh2.status_code == 200
        assert len(rh2.json()["messages"]) >= 4

        # 5. Delete history
        rd = auth_session.delete(f"{BASE_URL}/api/ai/chat/history", params={"session_id": session_id}, timeout=15)
        assert rd.status_code == 200
        assert rd.json().get("deleted", 0) >= 4

        # 6. History empty after delete
        rh3 = auth_session.get(f"{BASE_URL}/api/ai/chat/history", params={"session_id": session_id}, timeout=15)
        assert rh3.status_code == 200
        assert rh3.json()["messages"] == []


class TestAIChatRBAC:
    def test_unauthenticated_chat_rejected(self):
        r = requests.post(f"{BASE_URL}/api/ai/chat", json={"message": "hola"}, timeout=15)
        assert r.status_code in (401, 403)
