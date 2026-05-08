"""Iteration 21 - Company Logo upload feature.
Covers:
- POST /api/companies/{id}/logo validation (type, size min/max, non-image bytes)
- DELETE /api/companies/{id}/logo unsets logo_* fields
- GET /api/companies exposes logo_data_url
- PDFs embed /XObject only when active company has a logo
- Role-based access (collaborator rejected, admin allowed)
"""
import os
import io
import base64
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://compliance-guardian-6.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"
COLLAB_EMAIL = "pedro@empresa.com"
COLLAB_PASSWORD = "Pedro2026!"


def _login_session(email: str, password: str) -> requests.Session:
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login-email", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text[:200]}"
    # Session cookie should now be stored in s.cookies
    assert len(s.cookies) > 0 or r.json(), f"No session cookie set for {email}"
    return s


@pytest.fixture(scope="module")
def admin_headers():
    # Returns a requests.Session so tests can reuse cookie auth; name kept for compatibility
    return _login_session(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="module")
def collab_token():
    try:
        return _login_session(COLLAB_EMAIL, COLLAB_PASSWORD)
    except AssertionError:
        return None


def _png_bytes(size_px=64):
    img = Image.new("RGB", (size_px, size_px), color=(0, 71, 171))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _big_jpeg_bytes(target_bytes=2 * 1024 * 1024 + 50_000):
    # Generate a JPEG > 2MB using random noise and high quality
    import random
    px = 2000
    img = Image.new("RGB", (px, px))
    pixels = [(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)) for _ in range(px * px)]
    img.putdata(pixels)
    buf = io.BytesIO()
    q = 95
    img.save(buf, format="JPEG", quality=q)
    while buf.tell() < target_bytes and q < 100:
        q += 1
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=q)
    return buf.getvalue()


@pytest.fixture(scope="module")
def temp_company(admin_headers):
    payload = {"name": "TEST_LogoCompany", "nit": "900000999", "workers_count": 10, "risk_level": 2}
    r = admin_headers.post(f"{BASE_URL}/api/companies", json=payload, timeout=20)
    assert r.status_code in (200, 201), f"Create company failed: {r.status_code} {r.text[:200]}"
    comp = r.json()
    cid = comp["company_id"]
    yield cid
    # Cleanup
    try:
        admin_headers.delete(f"{BASE_URL}/api/companies/{cid}", timeout=15)
    except Exception:
        pass


class TestLogoUpload:
    def test_upload_valid_png(self, admin_headers, temp_company):
        files = {"file": ("logo.png", _png_bytes(), "image/png")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        data = r.json()
        assert "logo_data_url" in data
        assert data["logo_data_url"].startswith("data:image/png;base64,")

    def test_get_companies_exposes_logo_data_url(self, admin_headers, temp_company):
        # Ensure logo is set first
        files = {"file": ("logo.png", _png_bytes(), "image/png")}
        admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=30)
        r = admin_headers.get(f"{BASE_URL}/api/companies", timeout=20)
        assert r.status_code == 200
        companies = r.json()
        match = [c for c in companies if c.get("company_id") == temp_company]
        assert match, "temp company not in list"
        assert match[0].get("logo_data_url", "").startswith("data:image/")

    def test_reject_invalid_content_type(self, admin_headers, temp_company):
        files = {"file": ("logo.txt", b"not an image" * 20, "text/plain")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=20)
        assert r.status_code == 400
        assert "Formato" in r.text or "format" in r.text.lower()

    def test_reject_too_small(self, admin_headers, temp_company):
        files = {"file": ("tiny.png", b"\x89PNG\r\n", "image/png")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=20)
        assert r.status_code == 400

    def test_reject_non_image_bytes_with_image_content_type(self, admin_headers, temp_company):
        # 200 bytes of garbage claiming to be a png
        files = {"file": ("fake.png", b"X" * 200, "image/png")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=20)
        assert r.status_code == 400

    def test_reject_oversized(self, admin_headers, temp_company):
        big = _big_jpeg_bytes()
        assert len(big) > 2 * 1024 * 1024, f"Generated fixture not > 2MB: {len(big)}"
        files = {"file": ("big.jpg", big, "image/jpeg")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=60)
        assert r.status_code == 400, f"Expected 400 for oversized, got {r.status_code}: {r.text[:200]}"
        assert "2 MB" in r.text or "grande" in r.text.lower()

    def test_collaborator_cannot_upload(self, collab_token, temp_company):
        if not collab_token:
            pytest.skip("No collaborator credentials available")
        files = {"file": ("logo.png", _png_bytes(), "image/png")}
        r = collab_token.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=20)
        assert r.status_code in (401, 403)

    def test_delete_logo_unsets_fields(self, admin_headers, temp_company):
        # Ensure present first
        files = {"file": ("logo.png", _png_bytes(), "image/png")}
        admin_headers.post(f"{BASE_URL}/api/companies/{temp_company}/logo", files=files, timeout=20)
        r = admin_headers.delete(f"{BASE_URL}/api/companies/{temp_company}/logo", timeout=20)
        assert r.status_code == 200
        r2 = admin_headers.get(f"{BASE_URL}/api/companies", timeout=20)
        companies = r2.json()
        match = [c for c in companies if c.get("company_id") == temp_company][0]
        assert "logo_data_url" not in match or not match.get("logo_data_url")
        assert "logo_content_type" not in match or not match.get("logo_content_type")


class TestPDFLogoEmbedding:
    @pytest.fixture(scope="class")
    def audit_id(self, admin_headers):
        # Ensure admin active company is 'default'
        admin_headers.post(f"{BASE_URL}/api/companies/default/switch", timeout=15)
        # Create a simple audit
        payload = {
            "audit_code": "TEST_LOGO_AUD",
            "title": "TEST_Audit for logo PDF",
            "audit_type": "internal",
            "scope": "Test scope",
            "auditor": "Test Auditor",
            "auditee": "Test Auditee",
            "start_date": "2026-01-15",
            "end_date": "2026-01-16",
        }
        r = admin_headers.post(f"{BASE_URL}/api/audits", json=payload, timeout=20)
        assert r.status_code in (200, 201), f"Audit create failed: {r.status_code} {r.text[:200]}"
        aid = r.json().get("audit_id") or r.json().get("id")
        assert aid, f"No audit id in response: {r.json()}"
        yield aid
        try:
            admin_headers.delete(f"{BASE_URL}/api/audits/{aid}", timeout=15)
        except Exception:
            pass

    def _get_pdf_bytes(self, session, endpoint):
        r = session.get(f"{BASE_URL}{endpoint}", timeout=60)
        assert r.status_code == 200, f"{endpoint} -> {r.status_code} {r.text[:200]}"
        content = r.content
        assert content.startswith(b"%PDF"), f"{endpoint} did not return PDF"
        return content

    def test_pdfs_without_logo_have_no_xobject(self, admin_headers, audit_id):
        # Remove logo from default first
        admin_headers.delete(f"{BASE_URL}/api/companies/default/logo", timeout=15)
        for ep in [
            f"/api/audits/{audit_id}/opening-minutes/pdf",
            f"/api/audits/{audit_id}/closing-minutes/pdf",
            f"/api/audits/{audit_id}/report/pdf",
        ]:
            pdf = self._get_pdf_bytes(admin_headers, ep)
            assert b"/XObject" not in pdf, f"{ep} unexpectedly has /XObject when no logo is set"

    def test_pdfs_with_logo_embed_xobject(self, admin_headers, audit_id):
        files = {"file": ("logo.png", _png_bytes(256), "image/png")}
        r = admin_headers.post(f"{BASE_URL}/api/companies/default/logo", files=files, timeout=30)
        assert r.status_code == 200, f"Could not upload logo to default: {r.text[:200]}"
        try:
            for ep in [
                f"/api/audits/{audit_id}/opening-minutes/pdf",
                f"/api/audits/{audit_id}/closing-minutes/pdf",
                f"/api/audits/{audit_id}/report/pdf",
            ]:
                pdf = self._get_pdf_bytes(admin_headers, ep)
                assert b"/XObject" in pdf, f"{ep} missing /XObject with logo set"
        finally:
            # cleanup: remove logo from default
            admin_headers.delete(f"{BASE_URL}/api/companies/default/logo", timeout=15)
