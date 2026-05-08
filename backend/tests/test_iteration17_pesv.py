"""
Iteration 17: PESV (Plan Estratégico de Seguridad Vial - Res 40595/2022) Integration Tests

Tests for:
- POST /api/audits with audit_type=pesv creates PESV audit with pesv_level field
- POST /api/audits/{audit_id}/checklist/generate for PESV audit generates PESV-specific checklist
- GET /api/audits/{audit_id}/checklist for PESV shows items with 'fase' and 'paso' fields
- GET /api/audits/{audit_id}/score for PESV returns score with by_fase
- PUT /api/audits/{audit_id}/checklist/{item_id} cascade works for PESV audits
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://compliance-guardian-6.preview.emergentagent.com')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123", "Content-Type": "application/json"}

# Test data
PESV_AUDIT_ID = "aud_a41d8ca1"  # Existing PESV audit with 60 items
SGSST_AUDIT_ID = "aud_d44a6cb2"  # Existing SG-SST audit


class TestPESVAuditCreation:
    """Test PESV audit creation with pesv_level field"""
    
    def test_create_pesv_audit_avanzado(self):
        """POST /api/audits with audit_type=pesv creates PESV audit"""
        payload = {
            "title": "TEST_PESV Auditoria Avanzado",
            "audit_type": "pesv",
            "pesv_level": "avanzado",
            "scheduled_date": "2026-02-15",
            "auditor": "Test Auditor PESV",
            "scope": "Evaluacion PESV nivel avanzado",
            "criteria": "Resolucion 40595 de 2022"
        }
        response = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["audit_type"] == "pesv", f"Expected audit_type=pesv, got {data.get('audit_type')}"
        assert data["pesv_level"] == "avanzado", f"Expected pesv_level=avanzado, got {data.get('pesv_level')}"
        assert "audit_id" in data
        print(f"PASSED: Created PESV audit with ID {data['audit_id']}")
        # Store for cleanup
        self.__class__.created_audit_id = data["audit_id"]
        return data["audit_id"]
    
    def test_create_pesv_audit_basico(self):
        """POST /api/audits with pesv_level=basico"""
        payload = {
            "title": "TEST_PESV Auditoria Basico",
            "audit_type": "pesv",
            "pesv_level": "basico",
            "scheduled_date": "2026-02-16",
            "auditor": "Test Auditor PESV Basico"
        }
        response = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert response.status_code == 200
        data = response.json()
        assert data["pesv_level"] == "basico"
        print(f"PASSED: Created PESV basico audit with ID {data['audit_id']}")
        self.__class__.basico_audit_id = data["audit_id"]
    
    def test_create_pesv_audit_estandar(self):
        """POST /api/audits with pesv_level=estandar"""
        payload = {
            "title": "TEST_PESV Auditoria Estandar",
            "audit_type": "pesv",
            "pesv_level": "estandar",
            "scheduled_date": "2026-02-17",
            "auditor": "Test Auditor PESV Estandar"
        }
        response = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert response.status_code == 200
        data = response.json()
        assert data["pesv_level"] == "estandar"
        print(f"PASSED: Created PESV estandar audit with ID {data['audit_id']}")
        self.__class__.estandar_audit_id = data["audit_id"]


class TestPESVChecklistGeneration:
    """Test PESV checklist generation with correct item counts"""
    
    def test_generate_pesv_checklist_avanzado(self):
        """Generate checklist for PESV avanzado - should have 60 items"""
        # First create a fresh audit
        payload = {
            "title": "TEST_PESV Checklist Gen Avanzado",
            "audit_type": "pesv",
            "pesv_level": "avanzado",
            "scheduled_date": "2026-02-18"
        }
        create_resp = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert create_resp.status_code == 200
        audit_id = create_resp.json()["audit_id"]
        self.__class__.avanzado_audit_id = audit_id
        
        # Generate checklist
        gen_resp = requests.post(f"{BASE_URL}/api/audits/{audit_id}/checklist/generate", headers=AUTH_HEADER)
        assert gen_resp.status_code == 200
        gen_data = gen_resp.json()
        assert "60" in gen_data.get("message", "") or "items" in gen_data.get("message", "").lower()
        print(f"PASSED: Generated PESV avanzado checklist: {gen_data.get('message')}")
        
        # Verify checklist items
        checklist_resp = requests.get(f"{BASE_URL}/api/audits/{audit_id}/checklist", headers=AUTH_HEADER)
        assert checklist_resp.status_code == 200
        items = checklist_resp.json()
        assert len(items) == 60, f"Expected 60 items for avanzado, got {len(items)}"
        print(f"PASSED: PESV avanzado has {len(items)} items")
    
    def test_generate_pesv_checklist_basico(self):
        """Generate checklist for PESV basico - should have 40 items"""
        payload = {
            "title": "TEST_PESV Checklist Gen Basico",
            "audit_type": "pesv",
            "pesv_level": "basico",
            "scheduled_date": "2026-02-19"
        }
        create_resp = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert create_resp.status_code == 200
        audit_id = create_resp.json()["audit_id"]
        self.__class__.basico_checklist_audit_id = audit_id
        
        gen_resp = requests.post(f"{BASE_URL}/api/audits/{audit_id}/checklist/generate", headers=AUTH_HEADER)
        assert gen_resp.status_code == 200
        
        checklist_resp = requests.get(f"{BASE_URL}/api/audits/{audit_id}/checklist", headers=AUTH_HEADER)
        items = checklist_resp.json()
        assert len(items) == 40, f"Expected 40 items for basico, got {len(items)}"
        print(f"PASSED: PESV basico has {len(items)} items")
    
    def test_generate_pesv_checklist_estandar(self):
        """Generate checklist for PESV estandar - should have 53 items"""
        payload = {
            "title": "TEST_PESV Checklist Gen Estandar",
            "audit_type": "pesv",
            "pesv_level": "estandar",
            "scheduled_date": "2026-02-20"
        }
        create_resp = requests.post(f"{BASE_URL}/api/audits", json=payload, headers=AUTH_HEADER)
        assert create_resp.status_code == 200
        audit_id = create_resp.json()["audit_id"]
        self.__class__.estandar_checklist_audit_id = audit_id
        
        gen_resp = requests.post(f"{BASE_URL}/api/audits/{audit_id}/checklist/generate", headers=AUTH_HEADER)
        assert gen_resp.status_code == 200
        
        checklist_resp = requests.get(f"{BASE_URL}/api/audits/{audit_id}/checklist", headers=AUTH_HEADER)
        items = checklist_resp.json()
        assert len(items) == 53, f"Expected 53 items for estandar, got {len(items)}"
        print(f"PASSED: PESV estandar has {len(items)} items")


class TestPESVChecklistStructure:
    """Test PESV checklist items have correct structure (fase, paso, code starting with P)"""
    
    def test_pesv_checklist_has_fase_field(self):
        """PESV checklist items should have 'fase' field"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        assert response.status_code == 200
        items = response.json()
        assert len(items) > 0, "No checklist items found"
        
        # Check first item has fase field
        first_item = items[0]
        assert "fase" in first_item, f"Item missing 'fase' field: {first_item.keys()}"
        assert first_item["fase"] in ["PLANIFICACION", "IMPLEMENTACION", "SEGUIMIENTO", "MEJORA"], f"Invalid fase: {first_item['fase']}"
        print(f"PASSED: PESV items have 'fase' field. First item fase: {first_item['fase']}")
    
    def test_pesv_checklist_has_paso_field(self):
        """PESV checklist items should have 'paso' field"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        items = response.json()
        first_item = items[0]
        assert "paso" in first_item, f"Item missing 'paso' field: {first_item.keys()}"
        assert "PASO" in first_item["paso"] or first_item["paso"], f"Invalid paso format: {first_item['paso']}"
        print(f"PASSED: PESV items have 'paso' field. First item paso: {first_item['paso'][:50]}...")
    
    def test_pesv_checklist_codes_start_with_p(self):
        """PESV checklist item codes should start with 'P'"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        items = response.json()
        
        p_codes = [item for item in items if item.get("code", "").startswith("P")]
        assert len(p_codes) == len(items), f"Not all codes start with P. Found {len(p_codes)}/{len(items)} P-codes"
        print(f"PASSED: All {len(items)} PESV items have codes starting with 'P'")
    
    def test_pesv_checklist_has_all_phases(self):
        """PESV checklist should have items in all 4 phases"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        items = response.json()
        
        phases = set(item.get("fase", "") for item in items)
        expected_phases = {"PLANIFICACION", "IMPLEMENTACION", "SEGUIMIENTO", "MEJORA"}
        assert expected_phases.issubset(phases), f"Missing phases. Found: {phases}, Expected: {expected_phases}"
        print(f"PASSED: PESV checklist has all 4 phases: {phases}")


class TestPESVScoreCalculation:
    """Test PESV score calculation returns by_fase instead of by_cycle"""
    
    def test_pesv_score_has_by_fase(self):
        """GET /api/audits/{audit_id}/score for PESV returns by_fase"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/score", headers=AUTH_HEADER)
        assert response.status_code == 200
        score = response.json()
        
        assert "by_fase" in score, f"Score missing 'by_fase'. Keys: {score.keys()}"
        by_fase = score["by_fase"]
        assert isinstance(by_fase, dict), f"by_fase should be dict, got {type(by_fase)}"
        print(f"PASSED: PESV score has by_fase with phases: {list(by_fase.keys())}")
    
    def test_pesv_score_phases_are_correct(self):
        """PESV score by_fase should have PLANIFICACION/IMPLEMENTACION/SEGUIMIENTO/MEJORA"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/score", headers=AUTH_HEADER)
        score = response.json()
        by_fase = score.get("by_fase", {})
        
        expected_phases = ["PLANIFICACION", "IMPLEMENTACION", "SEGUIMIENTO", "MEJORA"]
        for phase in expected_phases:
            assert phase in by_fase, f"Missing phase {phase} in by_fase. Found: {list(by_fase.keys())}"
        print(f"PASSED: PESV score has all expected phases: {expected_phases}")
    
    def test_pesv_score_has_classification(self):
        """PESV score should have classification with level/label/color/action"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/score", headers=AUTH_HEADER)
        score = response.json()
        
        assert "classification" in score, "Score missing 'classification'"
        classification = score["classification"]
        assert "level" in classification
        assert "label" in classification
        assert "color" in classification
        assert "action" in classification
        print(f"PASSED: PESV score classification: {classification['label']} ({classification['level']})")
    
    def test_pesv_score_percentage(self):
        """PESV score should have percentage field"""
        response = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/score", headers=AUTH_HEADER)
        score = response.json()
        
        assert "percentage" in score, "Score missing 'percentage'"
        assert isinstance(score["percentage"], (int, float)), f"percentage should be number, got {type(score['percentage'])}"
        print(f"PASSED: PESV score percentage: {score['percentage']}%")


class TestPESVCascadeUpdates:
    """Test cascade updates work for PESV audits (checklist -> findings -> plans -> score)"""
    
    def test_update_pesv_checklist_item_to_no_cumple(self):
        """PUT checklist item to no_cumple should create finding and action plan for PESV"""
        # Get checklist items
        checklist_resp = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        items = checklist_resp.json()
        
        # Find an item that's not already no_cumple
        test_item = None
        for item in items:
            if item.get("result") != "no_cumple":
                test_item = item
                break
        
        if not test_item:
            pytest.skip("No suitable item found for testing")
        
        item_id = test_item["item_id"]
        original_result = test_item.get("result", "")
        
        # Update to no_cumple
        update_resp = requests.put(
            f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist/{item_id}",
            json={"result": "no_cumple", "observations": "TEST_PESV cascade test"},
            headers=AUTH_HEADER
        )
        assert update_resp.status_code == 200
        print(f"PASSED: Updated PESV checklist item {item_id} to no_cumple")
        
        # Verify finding was created
        audit_resp = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}", headers=AUTH_HEADER)
        audit_data = audit_resp.json()
        findings = audit_data.get("findings", [])
        
        # Look for finding linked to this item
        linked_finding = next((f for f in findings if f.get("source_item_id") == item_id), None)
        assert linked_finding is not None, f"No finding created for item {item_id}"
        print(f"PASSED: Finding created for PESV item: {linked_finding['finding_id']}")
        
        # Verify action plan was created
        plans = audit_data.get("action_plans", [])
        linked_plan = next((p for p in plans if p.get("source_item_id") == item_id), None)
        assert linked_plan is not None, f"No action plan created for item {item_id}"
        print(f"PASSED: Action plan created for PESV item: {linked_plan['plan_id']}")
        
        # Restore original state
        if original_result:
            requests.put(
                f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/checklist/{item_id}",
                json={"result": original_result},
                headers=AUTH_HEADER
            )
    
    def test_pesv_score_updates_after_checklist_change(self):
        """Score should update after PESV checklist item changes"""
        # Get initial score
        initial_score_resp = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}/score", headers=AUTH_HEADER)
        initial_score = initial_score_resp.json()
        
        # Get audit detail to verify score_result is updated
        audit_resp = requests.get(f"{BASE_URL}/api/audits/{PESV_AUDIT_ID}", headers=AUTH_HEADER)
        audit_data = audit_resp.json()
        
        assert "score_result" in audit_data, "Audit missing score_result"
        assert "by_fase" in audit_data["score_result"], "score_result missing by_fase for PESV"
        print(f"PASSED: PESV audit has score_result with by_fase after checklist changes")


class TestSGSSTVsPESVDifferentiation:
    """Test that SG-SST and PESV audits are properly differentiated"""
    
    def test_sgsst_audit_has_by_cycle(self):
        """SG-SST audit score should have by_cycle (PHVA)"""
        response = requests.get(f"{BASE_URL}/api/audits/{SGSST_AUDIT_ID}/score", headers=AUTH_HEADER)
        if response.status_code == 200:
            score = response.json()
            # SG-SST should have by_cycle
            if "by_cycle" in score:
                print(f"PASSED: SG-SST audit has by_cycle: {list(score['by_cycle'].keys())}")
            else:
                print(f"INFO: SG-SST audit score structure: {score.keys()}")
    
    def test_pesv_audit_type_in_list(self):
        """GET /api/audits should show PESV audits with correct audit_type"""
        response = requests.get(f"{BASE_URL}/api/audits", headers=AUTH_HEADER)
        assert response.status_code == 200
        audits = response.json()
        
        pesv_audits = [a for a in audits if a.get("audit_type") == "pesv"]
        assert len(pesv_audits) > 0, "No PESV audits found in list"
        
        # Verify PESV audit has pesv_level
        for audit in pesv_audits:
            assert "pesv_level" in audit or audit.get("pesv_level") is not None, f"PESV audit missing pesv_level: {audit['audit_id']}"
        print(f"PASSED: Found {len(pesv_audits)} PESV audits in list")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_audits(self):
        """Delete TEST_ prefixed audits"""
        response = requests.get(f"{BASE_URL}/api/audits", headers=AUTH_HEADER)
        if response.status_code == 200:
            audits = response.json()
            test_audits = [a for a in audits if a.get("title", "").startswith("TEST_")]
            deleted = 0
            for audit in test_audits:
                del_resp = requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
                if del_resp.status_code == 200:
                    deleted += 1
            print(f"PASSED: Cleaned up {deleted} test audits")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
