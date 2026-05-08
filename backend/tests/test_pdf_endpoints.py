"""
Test PDF Generation Endpoints for Audits
- Opening Minutes (Acta de Apertura)
- Closing Minutes (Acta de Cierre)
- Audit Report PDF
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123"}

class TestAuditPDFEndpoints:
    """Test PDF generation endpoints for audits"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_audit_id = "aud_d44a6cb2"  # Known test audit
    
    def test_list_audits(self):
        """Test GET /api/audits returns list of audits"""
        response = requests.get(f"{BASE_URL}/api/audits", headers=AUTH_HEADER, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one audit"
        
        # Verify audit structure
        audit = data[0]
        assert "audit_id" in audit
        assert "title" in audit
        assert "status" in audit
        print(f"SUCCESS: Found {len(data)} audits")
    
    def test_get_audit_detail(self):
        """Test GET /api/audits/{audit_id} returns audit details"""
        response = requests.get(f"{BASE_URL}/api/audits/{self.test_audit_id}", headers=AUTH_HEADER, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["audit_id"] == self.test_audit_id
        assert "title" in data
        assert "checklist" in data
        assert "findings" in data
        assert "action_plans" in data
        print(f"SUCCESS: Got audit detail for {self.test_audit_id}")
    
    def test_opening_minutes_pdf_generation(self):
        """Test GET /api/audits/{audit_id}/opening-minutes/pdf generates valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/opening-minutes/pdf",
            headers=AUTH_HEADER,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("content-type") == "application/pdf", "Content-Type should be application/pdf"
        
        # Verify PDF content
        content = response.content
        assert len(content) > 3000, f"PDF should be larger than 3KB, got {len(content)} bytes"
        assert content[:4] == b'%PDF', "Content should start with PDF header"
        
        print(f"SUCCESS: Opening Minutes PDF generated ({len(content)} bytes)")
    
    def test_closing_minutes_pdf_generation(self):
        """Test GET /api/audits/{audit_id}/closing-minutes/pdf generates valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/closing-minutes/pdf",
            headers=AUTH_HEADER,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("content-type") == "application/pdf", "Content-Type should be application/pdf"
        
        # Verify PDF content
        content = response.content
        assert len(content) > 3000, f"PDF should be larger than 3KB, got {len(content)} bytes"
        assert content[:4] == b'%PDF', "Content should start with PDF header"
        
        print(f"SUCCESS: Closing Minutes PDF generated ({len(content)} bytes)")
    
    def test_audit_report_pdf_generation(self):
        """Test GET /api/audits/{audit_id}/report/pdf generates valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{self.test_audit_id}/report/pdf",
            headers=AUTH_HEADER,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get("content-type") == "application/pdf", "Content-Type should be application/pdf"
        
        # Verify PDF content
        content = response.content
        assert len(content) > 3000, f"PDF should be larger than 3KB, got {len(content)} bytes"
        assert content[:4] == b'%PDF', "Content should start with PDF header"
        
        print(f"SUCCESS: Audit Report PDF generated ({len(content)} bytes)")
    
    def test_pdf_endpoints_require_auth(self):
        """Test that PDF endpoints require authentication"""
        endpoints = [
            f"/api/audits/{self.test_audit_id}/opening-minutes/pdf",
            f"/api/audits/{self.test_audit_id}/closing-minutes/pdf",
            f"/api/audits/{self.test_audit_id}/report/pdf",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
            assert response.status_code == 401, f"Expected 401 for {endpoint}, got {response.status_code}"
        
        print("SUCCESS: All PDF endpoints require authentication")
    
    def test_pdf_endpoints_404_for_invalid_audit(self):
        """Test that PDF endpoints return 404 for non-existent audit"""
        invalid_audit_id = "aud_nonexistent123"
        endpoints = [
            f"/api/audits/{invalid_audit_id}/opening-minutes/pdf",
            f"/api/audits/{invalid_audit_id}/closing-minutes/pdf",
            f"/api/audits/{invalid_audit_id}/report/pdf",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=AUTH_HEADER, timeout=30)
            assert response.status_code == 404, f"Expected 404 for {endpoint}, got {response.status_code}"
        
        print("SUCCESS: All PDF endpoints return 404 for invalid audit")


class TestAuditCRUD:
    """Test Audit CRUD operations"""
    
    def test_create_audit(self):
        """Test POST /api/audits creates a new audit"""
        payload = {
            "title": "TEST_PDF_Audit_Iteration9",
            "audit_type": "internal",
            "scheduled_date": "2026-06-01",
            "end_date": "2026-06-15",
            "auditor": "Test Auditor PDF",
            "scope": "Test scope for PDF testing",
            "objective": "Test objective for PDF testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/audits", headers=AUTH_HEADER, json=payload, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "audit_id" in data
        assert data["title"] == payload["title"]
        assert data["status"] == "planned"
        
        # Store for cleanup
        self.created_audit_id = data["audit_id"]
        print(f"SUCCESS: Created audit {self.created_audit_id}")
        
        return data["audit_id"]
    
    def test_update_audit(self):
        """Test PUT /api/audits/{audit_id} updates an audit"""
        # First create an audit
        audit_id = self.test_create_audit()
        
        # Update it
        update_payload = {"status": "in_progress", "auditor": "Updated Auditor"}
        response = requests.put(
            f"{BASE_URL}/api/audits/{audit_id}",
            headers=AUTH_HEADER,
            json=update_payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["auditor"] == "Updated Auditor"
        
        print(f"SUCCESS: Updated audit {audit_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER, timeout=30)
    
    def test_get_single_audit(self):
        """Test GET /api/audits/{audit_id} returns audit details"""
        # First create an audit
        audit_id = self.test_create_audit()
        
        # Get it
        response = requests.get(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["audit_id"] == audit_id
        assert "checklist" in data
        assert "findings" in data
        assert "action_plans" in data
        
        print(f"SUCCESS: Got audit {audit_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER, timeout=30)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
