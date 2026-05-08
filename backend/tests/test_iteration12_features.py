"""
Iteration 12 Tests: TraciumSST rename, editable programming, cascade updates, change history
Tests:
1. App name shows 'TraciumSST' in sidebar and login page
2. PUT /api/audits/{audit_id} allows editing programming fields when status is NOT closed
3. PUT /api/audits/{audit_id} BLOCKS editing when status=closed (returns 400)
4. PUT /api/audits/{audit_id} allows reopening closed audit with status=in_progress
5. PUT /api/audits/{audit_id} tracks change_history for programming field changes
6. PUT /api/audits/{audit_id}/checklist/{item_id} cascades: recalculates score_result, sets report_stale=True
7. GET /api/audits/{audit_id} preserves report_stale and last_execution_change flags
8. PUT /api/audits/{audit_id}/ai-redaction clears report_stale flag
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://compliance-guardian-6.preview.emergentagent.com')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123", "Content-Type": "application/json"}
TEST_AUDIT_ID = "aud_d44a6cb2"


class TestAuditProgrammingEdit:
    """Test editing audit programming fields when status is NOT closed"""
    
    def test_edit_programming_when_in_progress(self):
        """PUT /api/audits/{audit_id} allows editing programming fields when status is NOT closed"""
        # First ensure audit is in_progress
        response = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert response.status_code == 200, f"Failed to get audit: {response.text}"
        audit = response.json()
        
        # If closed, reopen it first
        if audit.get("status") in ("closed", "reviewed"):
            reopen_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", 
                                       headers=AUTH_HEADER, json={"status": "in_progress"})
            assert reopen_resp.status_code == 200, f"Failed to reopen audit: {reopen_resp.text}"
        
        # Now edit programming fields
        new_objective = f"TEST_Objective_{uuid.uuid4().hex[:8]}"
        edit_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", 
                                 headers=AUTH_HEADER, 
                                 json={"objective": new_objective})
        assert edit_resp.status_code == 200, f"Failed to edit audit: {edit_resp.text}"
        
        # Verify change was saved
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.status_code == 200
        assert verify_resp.json().get("objective") == new_objective
        print(f"SUCCESS: Edited programming field 'objective' to '{new_objective}'")
    
    def test_edit_multiple_programming_fields(self):
        """PUT /api/audits/{audit_id} allows editing multiple programming fields"""
        new_scope = f"TEST_Scope_{uuid.uuid4().hex[:8]}"
        new_criteria = f"TEST_Criteria_{uuid.uuid4().hex[:8]}"
        
        edit_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", 
                                 headers=AUTH_HEADER, 
                                 json={"scope": new_scope, "criteria": new_criteria})
        assert edit_resp.status_code == 200, f"Failed to edit audit: {edit_resp.text}"
        
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.status_code == 200
        data = verify_resp.json()
        assert data.get("scope") == new_scope
        assert data.get("criteria") == new_criteria
        print(f"SUCCESS: Edited multiple programming fields")


class TestAuditBlockedWhenClosed:
    """Test that editing is blocked when audit status=closed"""
    
    def test_block_editing_when_closed(self):
        """PUT /api/audits/{audit_id} BLOCKS editing when status=closed (returns 400)"""
        # First, create a test audit that we can close
        create_resp = requests.post(f"{BASE_URL}/api/audits", headers=AUTH_HEADER, json={
            "title": f"TEST_Closed_Audit_{uuid.uuid4().hex[:8]}",
            "audit_type": "internal",
            "scheduled_date": "2026-01-15",
            "auditor": "Test Auditor",
            "copasst_member": {"name": "Test COPASST", "role": "Presidente", "participation": "Observador"},
            "end_date": "2026-01-16",
            "end_time": "17:00"
        })
        assert create_resp.status_code == 200, f"Failed to create audit: {create_resp.text}"
        test_audit_id = create_resp.json()["audit_id"]
        
        try:
            # Close the audit
            close_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                      headers=AUTH_HEADER, json={"status": "closed"})
            assert close_resp.status_code == 200, f"Failed to close audit: {close_resp.text}"
            
            # Now try to edit a programming field - should be blocked
            edit_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                     headers=AUTH_HEADER, 
                                     json={"objective": "This should fail"})
            assert edit_resp.status_code == 400, f"Expected 400 but got {edit_resp.status_code}: {edit_resp.text}"
            assert "cerrada" in edit_resp.json().get("detail", "").lower() or "closed" in edit_resp.json().get("detail", "").lower()
            print(f"SUCCESS: Editing blocked when audit is closed - got 400 as expected")
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/audits/{test_audit_id}", headers=AUTH_HEADER)
    
    def test_reopen_closed_audit(self):
        """PUT /api/audits/{audit_id} allows reopening closed audit with status=in_progress"""
        # Create and close a test audit
        create_resp = requests.post(f"{BASE_URL}/api/audits", headers=AUTH_HEADER, json={
            "title": f"TEST_Reopen_Audit_{uuid.uuid4().hex[:8]}",
            "audit_type": "internal",
            "scheduled_date": "2026-01-15",
            "auditor": "Test Auditor",
            "copasst_member": {"name": "Test COPASST", "role": "Presidente", "participation": "Observador"},
            "end_date": "2026-01-16",
            "end_time": "17:00"
        })
        assert create_resp.status_code == 200
        test_audit_id = create_resp.json()["audit_id"]
        
        try:
            # Close the audit
            close_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                      headers=AUTH_HEADER, json={"status": "closed"})
            assert close_resp.status_code == 200
            
            # Reopen with status=in_progress
            reopen_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                       headers=AUTH_HEADER, json={"status": "in_progress"})
            assert reopen_resp.status_code == 200, f"Failed to reopen audit: {reopen_resp.text}"
            
            # Verify status changed
            verify_resp = requests.get(f"{BASE_URL}/api/audits/{test_audit_id}", headers=AUTH_HEADER)
            assert verify_resp.json().get("status") == "in_progress"
            print(f"SUCCESS: Reopened closed audit with status=in_progress")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{test_audit_id}", headers=AUTH_HEADER)
    
    def test_reopen_with_follow_up_status(self):
        """PUT /api/audits/{audit_id} allows reopening closed audit with status=follow_up"""
        create_resp = requests.post(f"{BASE_URL}/api/audits", headers=AUTH_HEADER, json={
            "title": f"TEST_FollowUp_Audit_{uuid.uuid4().hex[:8]}",
            "audit_type": "internal",
            "scheduled_date": "2026-01-15",
            "auditor": "Test Auditor",
            "copasst_member": {"name": "Test COPASST", "role": "Presidente", "participation": "Observador"},
            "end_date": "2026-01-16",
            "end_time": "17:00"
        })
        assert create_resp.status_code == 200
        test_audit_id = create_resp.json()["audit_id"]
        
        try:
            # Close the audit
            close_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                      headers=AUTH_HEADER, json={"status": "closed"})
            assert close_resp.status_code == 200
            
            # Reopen with status=follow_up
            reopen_resp = requests.put(f"{BASE_URL}/api/audits/{test_audit_id}", 
                                       headers=AUTH_HEADER, json={"status": "follow_up"})
            assert reopen_resp.status_code == 200, f"Failed to reopen audit: {reopen_resp.text}"
            
            # Verify status changed
            verify_resp = requests.get(f"{BASE_URL}/api/audits/{test_audit_id}", headers=AUTH_HEADER)
            assert verify_resp.json().get("status") == "follow_up"
            print(f"SUCCESS: Reopened closed audit with status=follow_up")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{test_audit_id}", headers=AUTH_HEADER)


class TestChangeHistoryTracking:
    """Test change_history tracking for programming field changes"""
    
    def test_change_history_tracked(self):
        """PUT /api/audits/{audit_id} tracks change_history for programming field changes"""
        # Get current audit state
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert get_resp.status_code == 200
        audit = get_resp.json()
        old_title = audit.get("title", "")
        old_history_len = len(audit.get("change_history", []))
        
        # Make a change to title
        new_title = f"TEST_Title_{uuid.uuid4().hex[:8]}"
        edit_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", 
                                 headers=AUTH_HEADER, json={"title": new_title})
        assert edit_resp.status_code == 200
        
        # Verify change_history was updated
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.status_code == 200
        data = verify_resp.json()
        new_history = data.get("change_history", [])
        
        assert len(new_history) > old_history_len, "change_history should have new entry"
        
        # Find the title change entry
        title_changes = [ch for ch in new_history if ch.get("field") == "title"]
        assert len(title_changes) > 0, "Should have title change in history"
        
        latest_title_change = title_changes[-1]
        assert latest_title_change.get("new") == new_title
        assert "by" in latest_title_change
        assert "at" in latest_title_change
        print(f"SUCCESS: change_history tracked title change: {latest_title_change}")
    
    def test_change_history_structure(self):
        """Verify change_history entry has correct structure: field, old, new, by, at"""
        # Make a change to scope
        new_scope = f"TEST_Scope_{uuid.uuid4().hex[:8]}"
        edit_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", 
                                 headers=AUTH_HEADER, json={"scope": new_scope})
        assert edit_resp.status_code == 200
        
        # Get audit and check history structure
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        data = verify_resp.json()
        history = data.get("change_history", [])
        
        # Find scope change
        scope_changes = [ch for ch in history if ch.get("field") == "scope"]
        assert len(scope_changes) > 0
        
        latest = scope_changes[-1]
        assert "field" in latest, "change_history entry should have 'field'"
        assert "old" in latest, "change_history entry should have 'old'"
        assert "new" in latest, "change_history entry should have 'new'"
        assert "by" in latest, "change_history entry should have 'by'"
        assert "at" in latest, "change_history entry should have 'at'"
        print(f"SUCCESS: change_history has correct structure: {list(latest.keys())}")


class TestCascadeUpdates:
    """Test cascade updates when checklist changes"""
    
    def test_checklist_change_sets_report_stale(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} sets report_stale=True"""
        # Get audit checklist
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert get_resp.status_code == 200
        audit = get_resp.json()
        checklist = audit.get("checklist", [])
        
        if not checklist:
            pytest.skip("No checklist items to test")
        
        # First clear report_stale by saving AI redaction
        clear_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction", 
                                  headers=AUTH_HEADER, 
                                  json={"ai_redacted_summary": "Test summary"})
        assert clear_resp.status_code == 200
        
        # Verify report_stale is False
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.json().get("report_stale") == False, "report_stale should be False after AI redaction"
        
        # Now change a checklist item
        item = checklist[0]
        item_id = item.get("item_id")
        current_result = item.get("result", "")
        new_result = "cumple" if current_result != "cumple" else "parcial"
        
        update_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}", 
                                   headers=AUTH_HEADER, json={"result": new_result})
        assert update_resp.status_code == 200
        
        # Verify report_stale is now True
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.json().get("report_stale") == True, "report_stale should be True after checklist change"
        print(f"SUCCESS: report_stale set to True after checklist change")
    
    def test_checklist_change_sets_last_execution_change(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} sets last_execution_change timestamp"""
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        audit = get_resp.json()
        checklist = audit.get("checklist", [])
        
        if not checklist:
            pytest.skip("No checklist items to test")
        
        old_timestamp = audit.get("last_execution_change", "")
        
        # Change a checklist item
        item = checklist[1] if len(checklist) > 1 else checklist[0]
        item_id = item.get("item_id")
        current_result = item.get("result", "")
        new_result = "no_cumple" if current_result != "no_cumple" else "cumple"
        
        update_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}", 
                                   headers=AUTH_HEADER, json={"result": new_result})
        assert update_resp.status_code == 200
        
        # Verify last_execution_change was updated
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        new_timestamp = verify_resp.json().get("last_execution_change", "")
        
        assert new_timestamp != "", "last_execution_change should be set"
        assert new_timestamp != old_timestamp or old_timestamp == "", "last_execution_change should be updated"
        print(f"SUCCESS: last_execution_change updated to {new_timestamp}")
    
    def test_checklist_change_recalculates_score(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} recalculates score_result"""
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        audit = get_resp.json()
        checklist = audit.get("checklist", [])
        
        if not checklist:
            pytest.skip("No checklist items to test")
        
        # Change a checklist item
        item = checklist[2] if len(checklist) > 2 else checklist[0]
        item_id = item.get("item_id")
        current_result = item.get("result", "")
        new_result = "cumple" if current_result != "cumple" else "no_cumple"
        
        update_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}", 
                                   headers=AUTH_HEADER, json={"result": new_result})
        assert update_resp.status_code == 200
        
        # Verify score_result exists
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        score = verify_resp.json().get("score_result")
        
        assert score is not None, "score_result should be calculated"
        assert "percentage" in score, "score_result should have percentage"
        assert "by_cycle" in score, "score_result should have by_cycle (PHVA)"
        print(f"SUCCESS: score_result recalculated - percentage: {score.get('percentage')}%")


class TestReportStaleFlag:
    """Test report_stale flag behavior"""
    
    def test_get_audit_preserves_report_stale(self):
        """GET /api/audits/{audit_id} preserves report_stale flag"""
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert get_resp.status_code == 200
        data = get_resp.json()
        
        assert "report_stale" in data, "report_stale should be in audit response"
        assert isinstance(data["report_stale"], bool), "report_stale should be boolean"
        print(f"SUCCESS: report_stale preserved in GET response: {data['report_stale']}")
    
    def test_get_audit_preserves_last_execution_change(self):
        """GET /api/audits/{audit_id} preserves last_execution_change flag"""
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert get_resp.status_code == 200
        data = get_resp.json()
        
        assert "last_execution_change" in data, "last_execution_change should be in audit response"
        print(f"SUCCESS: last_execution_change preserved: {data['last_execution_change']}")
    
    def test_ai_redaction_clears_report_stale(self):
        """PUT /api/audits/{audit_id}/ai-redaction clears report_stale flag"""
        # First ensure report_stale is True by changing checklist
        get_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        checklist = get_resp.json().get("checklist", [])
        
        if checklist:
            item = checklist[0]
            item_id = item.get("item_id")
            current_result = item.get("result", "")
            new_result = "parcial" if current_result != "parcial" else "cumple"
            requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}", 
                        headers=AUTH_HEADER, json={"result": new_result})
        
        # Verify report_stale is True
        verify_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert verify_resp.json().get("report_stale") == True, "report_stale should be True before AI redaction"
        
        # Save AI redaction
        redact_resp = requests.put(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction", 
                                   headers=AUTH_HEADER, 
                                   json={"ai_redacted_summary": f"Test summary {datetime.now().isoformat()}"})
        assert redact_resp.status_code == 200
        
        # Verify report_stale is now False
        final_resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert final_resp.json().get("report_stale") == False, "report_stale should be False after AI redaction"
        print(f"SUCCESS: AI redaction cleared report_stale flag")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
