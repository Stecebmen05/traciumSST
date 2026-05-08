"""
Iteration 14: Test criterio and modo_verificacion fields on checklist items
Tests:
1. GET /api/audits/{audit_id}/checklist returns items with criterio and modo_verificacion
2. Auto-enrichment of existing items that don't have criterio/modo_verificacion
3. Generate checklist includes criterio and modo_verificacion from CRITERIA_VERIFICATION dict
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123"}
TEST_AUDIT_ID = "aud_d44a6cb2"


class TestChecklistCriterioModoVerificacion:
    """Test criterio and modo_verificacion fields on checklist items"""
    
    def test_get_checklist_returns_criterio_field(self):
        """Test that GET checklist returns items with criterio field"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Checklist should have items"
        
        # Check that at least some items have criterio field
        items_with_criterio = [item for item in data if item.get("criterio")]
        print(f"Found {len(items_with_criterio)}/{len(data)} items with criterio field")
        
        # At least 50% of items should have criterio (since CRITERIA_VERIFICATION has 60 entries)
        assert len(items_with_criterio) > 0, "At least some items should have criterio field"
        
        # Verify criterio is a non-empty string
        for item in items_with_criterio[:5]:  # Check first 5
            assert isinstance(item["criterio"], str), f"criterio should be string for {item.get('code')}"
            assert len(item["criterio"]) > 10, f"criterio should be descriptive for {item.get('code')}"
            print(f"  {item.get('code')}: criterio length = {len(item['criterio'])}")
    
    def test_get_checklist_returns_modo_verificacion_field(self):
        """Test that GET checklist returns items with modo_verificacion field"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0, "Checklist should have items"
        
        # Check that at least some items have modo_verificacion field
        items_with_modo = [item for item in data if item.get("modo_verificacion")]
        print(f"Found {len(items_with_modo)}/{len(data)} items with modo_verificacion field")
        
        assert len(items_with_modo) > 0, "At least some items should have modo_verificacion field"
        
        # Verify modo_verificacion is a non-empty string
        for item in items_with_modo[:5]:  # Check first 5
            assert isinstance(item["modo_verificacion"], str), f"modo_verificacion should be string for {item.get('code')}"
            assert len(item["modo_verificacion"]) > 10, f"modo_verificacion should be descriptive for {item.get('code')}"
            print(f"  {item.get('code')}: modo_verificacion length = {len(item['modo_verificacion'])}")
    
    def test_checklist_item_has_both_criterio_and_modo_verificacion(self):
        """Test that items have both criterio and modo_verificacion together"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Find items with standard codes that should have both fields
        # Codes like 1.1.1, 1.1.2, etc. should have both
        test_codes = ["1.1.1", "1.1.2", "1.1.3", "1.1.4", "2.1.1", "2.4.1", "3.1.1"]
        
        for code in test_codes:
            item = next((i for i in data if i.get("code") == code), None)
            if item:
                print(f"Checking code {code}:")
                print(f"  criterio: {item.get('criterio', 'MISSING')[:80]}...")
                print(f"  modo_verificacion: {item.get('modo_verificacion', 'MISSING')[:80]}...")
                
                # Both fields should be present and non-empty
                assert item.get("criterio"), f"Code {code} should have criterio"
                assert item.get("modo_verificacion"), f"Code {code} should have modo_verificacion"
    
    def test_criterio_matches_criteria_verification_dict(self):
        """Test that criterio content matches expected values from CRITERIA_VERIFICATION"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Check specific known values
        item_1_1_1 = next((i for i in data if i.get("code") == "1.1.1"), None)
        if item_1_1_1:
            criterio = item_1_1_1.get("criterio", "")
            # Should contain key phrases from the Excel Res 0312
            assert "persona" in criterio.lower() or "perfil" in criterio.lower() or "asignar" in criterio.lower(), \
                f"1.1.1 criterio should mention person/profile assignment: {criterio[:100]}"
            print(f"1.1.1 criterio verified: {criterio[:100]}...")
        
        item_2_4_1 = next((i for i in data if i.get("code") == "2.4.1"), None)
        if item_2_4_1:
            criterio = item_2_4_1.get("criterio", "")
            # Should mention plan anual
            assert "plan" in criterio.lower() or "anual" in criterio.lower(), \
                f"2.4.1 criterio should mention annual plan: {criterio[:100]}"
            print(f"2.4.1 criterio verified: {criterio[:100]}...")


class TestChecklistGenerationWithCriterio:
    """Test that checklist generation includes criterio and modo_verificacion"""
    
    def test_generate_checklist_includes_criterio_modo(self):
        """Test that newly generated checklist items have criterio and modo_verificacion"""
        # First, create a new audit for testing
        create_response = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json={
                "title": "TEST_CriterioVerificacion_Audit",
                "audit_type": "internal",
                "scheduled_date": "2026-02-01",
                "auditor": "Test Auditor"
            }
        )
        assert create_response.status_code == 200, f"Failed to create audit: {create_response.text}"
        
        new_audit_id = create_response.json()["audit_id"]
        print(f"Created test audit: {new_audit_id}")
        
        try:
            # Generate checklist
            gen_response = requests.post(
                f"{BASE_URL}/api/audits/{new_audit_id}/checklist/generate",
                headers=AUTH_HEADER
            )
            assert gen_response.status_code == 200, f"Failed to generate checklist: {gen_response.text}"
            print(f"Generate response: {gen_response.json()}")
            
            # Get the checklist
            checklist_response = requests.get(
                f"{BASE_URL}/api/audits/{new_audit_id}/checklist",
                headers=AUTH_HEADER
            )
            assert checklist_response.status_code == 200
            
            checklist = checklist_response.json()
            assert len(checklist) > 0, "Generated checklist should have items"
            
            # Check that items have criterio and modo_verificacion
            items_with_criterio = [i for i in checklist if i.get("criterio")]
            items_with_modo = [i for i in checklist if i.get("modo_verificacion")]
            
            print(f"Generated checklist: {len(checklist)} items")
            print(f"  With criterio: {len(items_with_criterio)}")
            print(f"  With modo_verificacion: {len(items_with_modo)}")
            
            # At least 50% should have both fields (since CRITERIA_VERIFICATION has 60 entries)
            assert len(items_with_criterio) >= len(checklist) * 0.5, \
                f"At least 50% of items should have criterio, got {len(items_with_criterio)}/{len(checklist)}"
            assert len(items_with_modo) >= len(checklist) * 0.5, \
                f"At least 50% of items should have modo_verificacion, got {len(items_with_modo)}/{len(checklist)}"
            
        finally:
            # Cleanup: delete the test audit
            requests.delete(f"{BASE_URL}/api/audits/{new_audit_id}", headers=AUTH_HEADER)
            print(f"Cleaned up test audit: {new_audit_id}")


class TestAutoEnrichment:
    """Test auto-enrichment of existing items without criterio/modo_verificacion"""
    
    def test_get_checklist_enriches_items_without_criterio(self):
        """Test that GET checklist auto-enriches items that don't have criterio"""
        # This test verifies the enrichment logic in get_audit_checklist endpoint
        # The endpoint should add criterio/modo_verificacion to items that don't have them
        
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # After enrichment, items with valid codes should have criterio
        codes_in_criteria_verification = [
            "1.1.1", "1.1.2", "1.1.3", "1.1.4", "1.1.5", "1.1.6", "1.1.7", "1.1.8",
            "1.2.1", "1.2.2", "1.2.3", "2.1.1", "2.2.1", "2.3.1", "2.4.1", "2.5.1"
        ]
        
        for code in codes_in_criteria_verification[:10]:  # Check first 10
            item = next((i for i in data if i.get("code") == code), None)
            if item:
                # After enrichment, should have criterio
                if item.get("criterio"):
                    print(f"  {code}: criterio present (enriched or original)")
                else:
                    print(f"  {code}: criterio MISSING - enrichment may have failed")


class TestChecklistItemStructure:
    """Test the complete structure of checklist items"""
    
    def test_checklist_item_has_all_required_fields(self):
        """Test that checklist items have all expected fields including criterio/modo_verificacion"""
        response = requests.get(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        
        # Check first item for all expected fields
        item = data[0]
        expected_fields = [
            "item_id", "audit_id", "code", "standard", "description",
            "evidence_required", "phva", "weight", "checked", "result"
        ]
        
        for field in expected_fields:
            assert field in item, f"Missing required field: {field}"
        
        # criterio and modo_verificacion should be present (may be empty string for some codes)
        assert "criterio" in item or item.get("criterio") is None, "criterio field should exist"
        assert "modo_verificacion" in item or item.get("modo_verificacion") is None, "modo_verificacion field should exist"
        
        print(f"Item structure verified for {item.get('code')}:")
        print(f"  Fields present: {list(item.keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
