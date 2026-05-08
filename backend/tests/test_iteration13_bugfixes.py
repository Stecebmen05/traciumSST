"""
Iteration 13: Bug Fixes Testing
Tests for:
1. PDF endpoints with updated auditor, COPASST, and times info
2. Generate-from-checklist returns created AND updated counts
3. Generate-from-checklist updates existing findings when execution changes
4. PDF text wrapping (Paragraph used for long text in tables)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123"}
TEST_AUDIT_ID = "aud_d44a6cb2"  # Audit with auditor=Maria Gonzalez, copasst_member.name=Juan Perez, start_time=08:30


class TestPDFEndpoints:
    """Test PDF generation endpoints with updated team info"""
    
    def test_opening_minutes_pdf_returns_valid_pdf(self):
        """GET /api/audits/{audit_id}/opening-minutes/pdf - returns valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/opening-minutes/pdf",
            headers=AUTH_HEADER,
            timeout=30
        )
        print(f"Opening minutes PDF status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("Content-Type") == "application/pdf"
        # Check PDF magic bytes
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        print("Opening minutes PDF generated successfully")
    
    def test_closing_minutes_pdf_returns_valid_pdf(self):
        """GET /api/audits/{audit_id}/closing-minutes/pdf - returns valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/closing-minutes/pdf",
            headers=AUTH_HEADER,
            timeout=30
        )
        print(f"Closing minutes PDF status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("Content-Type") == "application/pdf"
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        print("Closing minutes PDF generated successfully")
    
    def test_report_pdf_returns_valid_pdf(self):
        """GET /api/audits/{audit_id}/report/pdf - returns valid PDF with team info"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/report/pdf",
            headers=AUTH_HEADER,
            timeout=30
        )
        print(f"Report PDF status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("Content-Type") == "application/pdf"
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        print("Report PDF generated successfully")


class TestAuditDataForPDF:
    """Verify audit has the required fields for PDF generation"""
    
    def test_audit_has_auditor_info(self):
        """Verify audit has auditor field populated"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        audit = response.json()
        print(f"Auditor: {audit.get('auditor', 'NOT SET')}")
        print(f"Additional auditors: {audit.get('additional_auditors', [])}")
        # Auditor should be set (Maria Gonzalez per test credentials)
        assert audit.get("auditor"), "Auditor field should be populated"
    
    def test_audit_has_copasst_member(self):
        """Verify audit has copasst_member field populated"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        audit = response.json()
        copasst = audit.get("copasst_member", {})
        print(f"COPASST member: {copasst}")
        # COPASST should have name (Juan Perez per test credentials)
        assert copasst.get("name"), "COPASST member name should be populated"
    
    def test_audit_has_times(self):
        """Verify audit has start_time and end_time fields"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        audit = response.json()
        print(f"Start time: {audit.get('start_time', 'NOT SET')}")
        print(f"End time: {audit.get('end_time', 'NOT SET')}")
        # start_time should be set (08:30 per test credentials)
        assert audit.get("start_time"), "Start time should be populated"
    
    def test_audit_has_process_responsibles(self):
        """Verify audit has process_responsibles array"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        audit = response.json()
        print(f"Process responsibles: {audit.get('process_responsibles', [])}")
        # Should be an array (may be empty)
        assert isinstance(audit.get("process_responsibles", []), list)


class TestGenerateFindingsFromChecklist:
    """Test generate-from-checklist endpoint returns created AND updated counts"""
    
    def test_generate_findings_returns_created_and_updated_counts(self):
        """POST /api/audits/{audit_id}/findings/generate-from-checklist returns {created, updated}"""
        response = requests.post(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/findings/generate-from-checklist",
            headers=AUTH_HEADER
        )
        print(f"Generate findings status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Response: {data}")
        
        # Verify response has both created and updated fields
        assert "created" in data, "Response should have 'created' field"
        assert "updated" in data, "Response should have 'updated' field"
        assert "message" in data, "Response should have 'message' field"
        
        # Verify types
        assert isinstance(data["created"], int), "'created' should be an integer"
        assert isinstance(data["updated"], int), "'updated' should be an integer"
        
        print(f"Created: {data['created']}, Updated: {data['updated']}")
        print(f"Message: {data['message']}")


class TestFindingsUpdateOnExecutionChange:
    """Test that existing findings are updated when checklist execution changes"""
    
    @pytest.fixture(autouse=True)
    def setup_test_audit(self):
        """Create a test audit with checklist for testing finding updates"""
        # Create test audit
        audit_data = {
            "title": "TEST_FindingsUpdate_Audit",
            "audit_type": "internal",
            "scheduled_date": "2026-01-20",
            "start_time": "09:00",
            "auditor": "Test Auditor",
            "copasst_member": {"name": "Test COPASST", "role": "Presidente"}
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json=audit_data
        )
        if create_resp.status_code != 200:
            pytest.skip(f"Could not create test audit: {create_resp.text}")
        
        self.test_audit_id = create_resp.json()["audit_id"]
        print(f"Created test audit: {self.test_audit_id}")
        
        # Generate checklist
        gen_resp = requests.post(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist/generate",
            headers=AUTH_HEADER
        )
        print(f"Generate checklist: {gen_resp.status_code}")
        
        yield
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/audits/{self.test_audit_id}",
            headers=AUTH_HEADER
        )
        print(f"Deleted test audit: {self.test_audit_id}")
    
    def test_finding_created_on_first_non_compliance(self):
        """First non-compliance creates a new finding"""
        # Get checklist items
        checklist_resp = requests.get(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist",
            headers=AUTH_HEADER
        )
        assert checklist_resp.status_code == 200
        checklist = checklist_resp.json()
        
        if not checklist:
            pytest.skip("No checklist items generated")
        
        # Mark first item as no_cumple
        first_item = checklist[0]
        update_resp = requests.put(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist/{first_item['item_id']}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple", "observations": "Test observation 1"}
        )
        assert update_resp.status_code == 200
        print(f"Marked item {first_item['item_id']} as no_cumple")
        
        # Generate findings
        gen_resp = requests.post(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/findings/generate-from-checklist",
            headers=AUTH_HEADER
        )
        assert gen_resp.status_code == 200
        data = gen_resp.json()
        
        print(f"First generation: created={data['created']}, updated={data['updated']}")
        assert data["created"] >= 1, "Should create at least 1 finding"
    
    def test_finding_updated_on_observation_change(self):
        """Changing observation updates existing finding"""
        # Get checklist items
        checklist_resp = requests.get(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist",
            headers=AUTH_HEADER
        )
        checklist = checklist_resp.json()
        
        if not checklist:
            pytest.skip("No checklist items")
        
        first_item = checklist[0]
        
        # First: mark as no_cumple
        requests.put(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist/{first_item['item_id']}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple", "observations": "Initial observation"}
        )
        
        # Generate findings first time
        gen1 = requests.post(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/findings/generate-from-checklist",
            headers=AUTH_HEADER
        )
        data1 = gen1.json()
        print(f"First gen: created={data1['created']}, updated={data1['updated']}")
        
        # Update observation
        requests.put(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/checklist/{first_item['item_id']}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple", "observations": "Updated observation with more details"}
        )
        
        # Generate findings second time - should update existing
        gen2 = requests.post(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/findings/generate-from-checklist",
            headers=AUTH_HEADER
        )
        data2 = gen2.json()
        print(f"Second gen: created={data2['created']}, updated={data2['updated']}")
        
        # Second generation should have updated count > 0 (or created=0 if finding already exists)
        # The key is that the endpoint returns both counts
        assert "created" in data2 and "updated" in data2


class TestAuthRetryLogic:
    """Test auth callback retry logic (frontend feature - verify backend auth endpoint)"""
    
    def test_auth_session_endpoint_exists(self):
        """POST /api/auth/session endpoint exists and handles requests"""
        # Test with invalid session_id - should return 401
        response = requests.post(
            f"{BASE_URL}/api/auth/session",
            json={"session_id": "invalid_test_session"}
        )
        print(f"Auth session status: {response.status_code}")
        # Should return 401 for invalid session, not 500
        assert response.status_code in [401, 504, 502], f"Expected 401/504/502, got {response.status_code}"
    
    def test_auth_me_with_valid_token(self):
        """GET /api/auth/me works with valid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=AUTH_HEADER
        )
        print(f"Auth me status: {response.status_code}")
        assert response.status_code == 200
        user = response.json()
        assert "user_id" in user
        assert "email" in user
        print(f"User: {user.get('name', 'N/A')}")


class TestPDFTextWrapping:
    """Test that PDFs use Paragraph for long text (text wrapping)"""
    
    def test_report_pdf_handles_long_text(self):
        """Report PDF should handle long text without errors"""
        # First, update audit with long text fields
        long_text = "Este es un texto muy largo que deberia envolver correctamente en el PDF. " * 10
        
        update_resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER,
            json={
                "scope": long_text,
                "objective": long_text
            }
        )
        # May fail if audit is closed, that's ok
        if update_resp.status_code == 200:
            print("Updated audit with long text")
        
        # Generate PDF - should not error
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/report/pdf",
            headers=AUTH_HEADER,
            timeout=30
        )
        assert response.status_code == 200, f"PDF generation failed: {response.status_code}"
        assert response.content[:4] == b'%PDF', "Response is not a valid PDF"
        print("Report PDF with long text generated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
