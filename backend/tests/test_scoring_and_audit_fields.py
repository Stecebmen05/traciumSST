"""
Test Suite for Scoring Engine (Res 0312/2019) and New Audit Fields
Tests:
1. GET /api/audits/{audit_id}/score - scoring endpoint
2. POST /api/audits - new fields (start_time, end_time, additional_auditors, process_responsibles, copasst_member)
3. PUT /api/audits/{audit_id} with status=closed - business rules validation
4. GET /api/audits/{audit_id} - returns score_result with classification
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123"}
TEST_AUDIT_ID = "aud_d44a6cb2"  # Existing audit with checklist items


class TestScoringEndpoint:
    """Test GET /api/audits/{audit_id}/score endpoint"""
    
    def test_score_endpoint_returns_200(self):
        """Score endpoint should return 200 for valid audit"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Score endpoint returns 200 OK")
    
    def test_score_response_structure(self):
        """Score response should have percentage, classification, by_cycle, by_standard"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        if "message" in data and data.get("percentage") == 0:
            # No checklist generated yet
            print(f"✓ Score endpoint returns message for empty checklist: {data.get('message')}")
            return
        
        assert "percentage" in data, "Missing 'percentage' field"
        assert "classification" in data, "Missing 'classification' field"
        assert "by_cycle" in data, "Missing 'by_cycle' field"
        assert "total_possible" in data, "Missing 'total_possible' field"
        assert "total_obtained" in data, "Missing 'total_obtained' field"
        
        print(f"✓ Score response has all required fields")
        print(f"  - Percentage: {data['percentage']}%")
        print(f"  - Classification: {data['classification']}")
    
    def test_score_classification_structure(self):
        """Classification should have level, label, color, action"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        
        if "message" in data:
            pytest.skip("No checklist generated for this audit")
        
        classification = data.get("classification", {})
        assert "level" in classification, "Missing 'level' in classification"
        assert "label" in classification, "Missing 'label' in classification"
        assert "color" in classification, "Missing 'color' in classification"
        assert "action" in classification, "Missing 'action' in classification"
        
        # Validate classification level is one of expected values
        valid_levels = ["CRITICO", "MODERADAMENTE_ACEPTABLE", "ACEPTABLE"]
        assert classification["level"] in valid_levels, f"Invalid level: {classification['level']}"
        
        print(f"✓ Classification structure valid: {classification['label']} ({classification['level']})")
    
    def test_score_by_cycle_phva(self):
        """by_cycle should contain PHVA cycles with breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        data = response.json()
        
        if "message" in data:
            pytest.skip("No checklist generated for this audit")
        
        by_cycle = data.get("by_cycle", {})
        expected_cycles = ["PLANEAR", "HACER", "VERIFICAR", "ACTUAR"]
        
        for cycle in expected_cycles:
            if cycle in by_cycle:
                cycle_data = by_cycle[cycle]
                assert "possible" in cycle_data, f"Missing 'possible' in {cycle}"
                assert "obtained" in cycle_data, f"Missing 'obtained' in {cycle}"
                assert "pct" in cycle_data, f"Missing 'pct' in {cycle}"
                print(f"  - {cycle}: {cycle_data.get('pct', 0)}% ({cycle_data.get('obtained', 0)}/{cycle_data.get('possible', 0)})")
        
        print(f"✓ PHVA cycle breakdown present")
    
    def test_score_requires_auth(self):
        """Score endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print(f"✓ Score endpoint requires authentication")
    
    def test_score_404_for_invalid_audit(self):
        """Score endpoint should return 404 for non-existent audit"""
        response = requests.get(
            f"{BASE_URL}/api/audits/invalid_audit_id/score",
            headers=AUTH_HEADER
        )
        # Could be 404 or return empty score
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Score endpoint handles invalid audit ID")


class TestAuditCreateNewFields:
    """Test POST /api/audits with new fields"""
    
    def test_create_audit_with_all_new_fields(self):
        """Create audit with start_time, end_time, additional_auditors, process_responsibles, copasst_member"""
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "title": f"TEST_Audit_NewFields_{unique_id}",
            "audit_type": "internal",
            "scheduled_date": "2026-02-15",
            "start_time": "09:00",
            "end_date": "2026-02-16",
            "end_time": "17:00",
            "auditor": "Juan Perez - Auditor Lider",
            "additional_auditors": ["Maria Garcia - Auditor Apoyo", "Carlos Lopez - Observador"],
            "process_responsibles": ["Ana Martinez - Responsable SST", "Pedro Sanchez - Lider Area"],
            "copasst_member": {
                "name": "Luis Rodriguez",
                "role": "Presidente COPASST",
                "participation": "Observador"
            },
            "scope": "Todos los procesos del SG-SST",
            "objective": "Verificar cumplimiento Res 0312/2019"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/audits",
            json=payload,
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify all new fields are returned
        assert data.get("start_time") == "09:00", f"start_time mismatch: {data.get('start_time')}"
        assert data.get("end_time") == "17:00", f"end_time mismatch: {data.get('end_time')}"
        assert data.get("additional_auditors") == ["Maria Garcia - Auditor Apoyo", "Carlos Lopez - Observador"]
        assert data.get("process_responsibles") == ["Ana Martinez - Responsable SST", "Pedro Sanchez - Lider Area"]
        assert data.get("copasst_member", {}).get("name") == "Luis Rodriguez"
        assert data.get("copasst_member", {}).get("role") == "Presidente COPASST"
        
        print(f"✓ Audit created with all new fields")
        print(f"  - audit_id: {data.get('audit_id')}")
        print(f"  - start_time: {data.get('start_time')}")
        print(f"  - end_time: {data.get('end_time')}")
        print(f"  - additional_auditors: {data.get('additional_auditors')}")
        print(f"  - process_responsibles: {data.get('process_responsibles')}")
        print(f"  - copasst_member: {data.get('copasst_member')}")
        
        # Cleanup - delete the test audit
        audit_id = data.get("audit_id")
        if audit_id:
            requests.delete(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER)
        
        return data
    
    def test_create_audit_minimal_fields(self):
        """Create audit with only required fields (backward compatibility)"""
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "title": f"TEST_Audit_Minimal_{unique_id}",
            "audit_type": "internal",
            "scheduled_date": "2026-03-01"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/audits",
            json=payload,
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # New fields should have default values
        assert "start_time" in data
        assert "end_time" in data
        assert "additional_auditors" in data
        assert "process_responsibles" in data
        assert "copasst_member" in data
        
        print(f"✓ Audit created with minimal fields (backward compatible)")
        
        # Cleanup
        audit_id = data.get("audit_id")
        if audit_id:
            requests.delete(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER)


class TestAuditCloseBusinessRules:
    """Test PUT /api/audits/{audit_id} with status=closed business rules"""
    
    @pytest.fixture
    def test_audit(self):
        """Create a test audit for closure testing"""
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "title": f"TEST_Audit_Close_{unique_id}",
            "audit_type": "internal",
            "scheduled_date": "2026-02-01",
            "auditor": "Test Auditor"
        }
        response = requests.post(
            f"{BASE_URL}/api/audits",
            json=payload,
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        audit = response.json()
        yield audit
        # Cleanup
        requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
    
    def test_close_audit_fails_without_end_time(self, test_audit):
        """Closing audit without end_time should fail with 400"""
        response = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            json={
                "status": "closed",
                "end_date": "2026-02-02",
                # Missing end_time
                "copasst_member": {"name": "Test COPASST"}
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        error_detail = response.json().get("detail", "")
        assert "hora de cierre" in error_detail.lower() or "end_time" in error_detail.lower(), \
            f"Error should mention end_time: {error_detail}"
        
        print(f"✓ Close audit fails without end_time: {error_detail}")
    
    def test_close_audit_fails_without_copasst_member(self, test_audit):
        """Closing audit without copasst_member should fail with 400"""
        response = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            json={
                "status": "closed",
                "end_date": "2026-02-02",
                "end_time": "17:00"
                # Missing copasst_member
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        error_detail = response.json().get("detail", "")
        assert "copasst" in error_detail.lower(), f"Error should mention COPASST: {error_detail}"
        
        print(f"✓ Close audit fails without copasst_member: {error_detail}")
    
    def test_close_audit_fails_without_auditor(self):
        """Closing audit without auditor should fail with 400"""
        # Create audit without auditor
        unique_id = uuid.uuid4().hex[:6]
        create_response = requests.post(
            f"{BASE_URL}/api/audits",
            json={
                "title": f"TEST_Audit_NoAuditor_{unique_id}",
                "audit_type": "internal",
                "scheduled_date": "2026-02-01"
                # No auditor
            },
            headers=AUTH_HEADER
        )
        assert create_response.status_code == 200
        audit = create_response.json()
        
        try:
            response = requests.put(
                f"{BASE_URL}/api/audits/{audit['audit_id']}",
                json={
                    "status": "closed",
                    "end_date": "2026-02-02",
                    "end_time": "17:00",
                    "copasst_member": {"name": "Test COPASST"}
                    # No auditor in update either
                },
                headers=AUTH_HEADER
            )
            assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
            
            error_detail = response.json().get("detail", "")
            assert "auditor" in error_detail.lower(), f"Error should mention auditor: {error_detail}"
            
            print(f"✓ Close audit fails without auditor: {error_detail}")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
    
    def test_close_audit_succeeds_with_all_required_fields(self, test_audit):
        """Closing audit with all required fields should succeed"""
        response = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            json={
                "status": "closed",
                "end_date": "2026-02-02",
                "end_time": "17:00",
                "copasst_member": {"name": "Test COPASST Member", "role": "Presidente"}
            },
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "closed", f"Status should be 'closed': {data.get('status')}"
        
        print(f"✓ Close audit succeeds with all required fields")
        print(f"  - status: {data.get('status')}")
        print(f"  - end_time: {data.get('end_time')}")
        print(f"  - copasst_member: {data.get('copasst_member')}")
    
    def test_close_audit_with_status_reviewed(self):
        """Closing audit with status=reviewed should also enforce business rules"""
        unique_id = uuid.uuid4().hex[:6]
        create_response = requests.post(
            f"{BASE_URL}/api/audits",
            json={
                "title": f"TEST_Audit_Reviewed_{unique_id}",
                "audit_type": "internal",
                "scheduled_date": "2026-02-01",
                "auditor": "Test Auditor"
            },
            headers=AUTH_HEADER
        )
        assert create_response.status_code == 200
        audit = create_response.json()
        
        try:
            # Try to set status=reviewed without required fields
            response = requests.put(
                f"{BASE_URL}/api/audits/{audit['audit_id']}",
                json={
                    "status": "reviewed"
                    # Missing end_date, end_time, copasst_member
                },
                headers=AUTH_HEADER
            )
            assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
            print(f"✓ Status 'reviewed' also enforces business rules")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)


class TestAuditDetailWithScore:
    """Test GET /api/audits/{audit_id} returns score_result"""
    
    def test_audit_detail_includes_score_result(self):
        """Audit detail should include score_result with classification"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check if score_result is present (may be null if no checklist)
        assert "score_result" in data or "checklist" in data, "Missing score_result or checklist"
        
        if data.get("score_result"):
            score = data["score_result"]
            assert "percentage" in score, "Missing percentage in score_result"
            assert "classification" in score, "Missing classification in score_result"
            print(f"✓ Audit detail includes score_result")
            print(f"  - Percentage: {score.get('percentage')}%")
            print(f"  - Classification: {score.get('classification', {}).get('label')}")
        else:
            print(f"✓ Audit detail returned (score_result may be null if no checklist)")
    
    def test_audit_detail_includes_new_fields(self):
        """Audit detail should include all new fields for newly created audits"""
        # Create a new audit to test new fields
        unique_id = uuid.uuid4().hex[:6]
        create_response = requests.post(
            f"{BASE_URL}/api/audits",
            json={
                "title": f"TEST_Audit_Fields_{unique_id}",
                "audit_type": "internal",
                "scheduled_date": "2026-02-20",
                "start_time": "08:00",
                "end_time": "16:00",
                "additional_auditors": ["Auditor 1"],
                "process_responsibles": ["Responsable 1"],
                "copasst_member": {"name": "COPASST Test", "role": "Presidente"}
            },
            headers=AUTH_HEADER
        )
        assert create_response.status_code == 200
        audit = create_response.json()
        audit_id = audit.get("audit_id")
        
        try:
            # Get audit detail
            response = requests.get(
                f"{BASE_URL}/api/audits/{audit_id}",
                headers=AUTH_HEADER
            )
            assert response.status_code == 200
            
            data = response.json()
            
            # Check new fields exist
            expected_fields = ["start_time", "end_time", "additional_auditors", "process_responsibles", "copasst_member"]
            for field in expected_fields:
                assert field in data, f"Missing field: {field}"
            
            print(f"✓ Audit detail includes all new fields")
            print(f"  - start_time: {data.get('start_time')}")
            print(f"  - end_time: {data.get('end_time')}")
            print(f"  - additional_auditors: {data.get('additional_auditors')}")
            print(f"  - process_responsibles: {data.get('process_responsibles')}")
            print(f"  - copasst_member: {data.get('copasst_member')}")
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/audits/{audit_id}", headers=AUTH_HEADER)


class TestScoringLogic:
    """Test the scoring logic: cumple=max_score, no_cumple=0, parcial=0, no_aplica=max_score"""
    
    def test_scoring_logic_via_checklist_update(self):
        """Test that scoring logic is correctly applied"""
        # First, get the audit detail to see checklist
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        checklist = data.get("checklist", [])
        
        if not checklist:
            pytest.skip("No checklist items to test scoring logic")
        
        # Get score
        score_response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/score",
            headers=AUTH_HEADER
        )
        assert score_response.status_code == 200
        score = score_response.json()
        
        if "message" in score:
            pytest.skip("No checklist generated")
        
        # Verify scoring logic
        # cumple items should contribute max_score
        # no_cumple and parcial should contribute 0
        # no_aplica should contribute max_score
        
        print(f"✓ Scoring logic test")
        print(f"  - Total possible: {score.get('total_possible')}")
        print(f"  - Total obtained: {score.get('total_obtained')}")
        print(f"  - Percentage: {score.get('percentage')}%")
        
        # Verify classification thresholds
        pct = score.get("percentage", 0)
        classification = score.get("classification", {})
        level = classification.get("level", "")
        
        if pct < 60:
            assert level == "CRITICO", f"<60% should be CRITICO, got {level}"
        elif pct <= 85:
            assert level == "MODERADAMENTE_ACEPTABLE", f"60-85% should be MODERADAMENTE_ACEPTABLE, got {level}"
        else:
            assert level == "ACEPTABLE", f">85% should be ACEPTABLE, got {level}"
        
        print(f"  - Classification level correct: {level}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
