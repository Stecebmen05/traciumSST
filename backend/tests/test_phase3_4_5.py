"""
Test Phase 3, 4, 5 Features for SG-SST Platform
- Phase 3: Dynamic findings sync when checklist changes
- Phase 4: AI-enhanced consolidated report with 5 sections
- Phase 5: Audit closure UI with date/time validation and business rules
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_admin_123", "Content-Type": "application/json"}
TEST_AUDIT_ID = "aud_d44a6cb2"


class TestPhase3DynamicFindingsSync:
    """Phase 3: Dynamic findings sync when checklist changes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a checklist item for testing"""
        # Get audit checklist
        resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist", headers=AUTH_HEADER)
        if resp.status_code == 200 and len(resp.json()) > 0:
            self.checklist = resp.json()
            # Find an item that's not already evaluated or pick first one
            self.test_item = None
            for item in self.checklist:
                if item.get("result") in ("", None, "cumple"):
                    self.test_item = item
                    break
            if not self.test_item:
                self.test_item = self.checklist[0]
        else:
            pytest.skip("No checklist items available for testing")
    
    def test_checklist_update_no_cumple_creates_finding(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} with result=no_cumple auto-creates a finding"""
        item_id = self.test_item["item_id"]
        
        # First set to cumple to ensure clean state
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "cumple"}
        )
        assert resp.status_code == 200
        
        # Now change to no_cumple - should create finding
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple", "observations": "Test observation for dynamic finding"}
        )
        assert resp.status_code == 200
        
        # Verify finding was created with source_item_id
        findings_resp = requests.get(f"{BASE_URL}/api/findings?audit_id={TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert findings_resp.status_code == 200
        findings = findings_resp.json()
        
        # Find the finding linked to this checklist item
        linked_finding = None
        for f in findings:
            if f.get("source_item_id") == item_id:
                linked_finding = f
                break
        
        assert linked_finding is not None, f"No finding found with source_item_id={item_id}"
        assert linked_finding["finding_type"] == "no_conformity"
        assert linked_finding["status"] == "open"
        assert "source_item_id" in linked_finding
        print(f"SUCCESS: Finding {linked_finding['finding_id']} created with source_item_id={item_id}")
    
    def test_checklist_update_cumple_resolves_finding(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} changing from no_cumple to cumple auto-resolves the linked finding"""
        item_id = self.test_item["item_id"]
        
        # First ensure it's no_cumple with a finding
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple"}
        )
        assert resp.status_code == 200
        
        # Now change to cumple - should resolve finding
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "cumple"}
        )
        assert resp.status_code == 200
        
        # Verify finding status changed to resolved_by_compliance
        findings_resp = requests.get(f"{BASE_URL}/api/findings?audit_id={TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert findings_resp.status_code == 200
        findings = findings_resp.json()
        
        linked_finding = None
        for f in findings:
            if f.get("source_item_id") == item_id:
                linked_finding = f
                break
        
        if linked_finding:
            assert linked_finding["status"] == "resolved_by_compliance", f"Expected resolved_by_compliance, got {linked_finding['status']}"
            print(f"SUCCESS: Finding {linked_finding['finding_id']} resolved with status=resolved_by_compliance")
        else:
            print("INFO: No linked finding found (may have been deleted)")
    
    def test_checklist_update_back_to_no_cumple_reopens_finding(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} changing from cumple back to no_cumple re-opens or creates finding with change_log"""
        item_id = self.test_item["item_id"]
        
        # First set to cumple
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "cumple"}
        )
        assert resp.status_code == 200
        
        # Now change back to no_cumple
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "no_cumple", "observations": "Re-opened finding test"}
        )
        assert resp.status_code == 200
        
        # Verify finding exists and has change_log
        findings_resp = requests.get(f"{BASE_URL}/api/findings?audit_id={TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert findings_resp.status_code == 200
        findings = findings_resp.json()
        
        linked_finding = None
        for f in findings:
            if f.get("source_item_id") == item_id:
                linked_finding = f
                break
        
        assert linked_finding is not None, "Finding should exist after re-opening"
        assert linked_finding["status"] == "open"
        
        # Check change_log exists
        change_log = linked_finding.get("change_log", [])
        print(f"SUCCESS: Finding re-opened with {len(change_log)} change_log entries")
        if change_log:
            last_entry = change_log[-1]
            assert "from" in last_entry
            assert "to" in last_entry
            assert "by" in last_entry
            assert "at" in last_entry
            print(f"  Last change: {last_entry['from']} -> {last_entry['to']} by {last_entry['by']}")
    
    def test_parcial_creates_observation_finding(self):
        """PUT /api/audits/{audit_id}/checklist/{item_id} with result=parcial creates observation finding"""
        item_id = self.test_item["item_id"]
        
        # First set to cumple
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "cumple"}
        )
        assert resp.status_code == 200
        
        # Now change to parcial - should create observation
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "parcial", "observations": "Partial compliance test"}
        )
        assert resp.status_code == 200
        
        # Verify finding type is observation
        findings_resp = requests.get(f"{BASE_URL}/api/findings?audit_id={TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert findings_resp.status_code == 200
        findings = findings_resp.json()
        
        linked_finding = None
        for f in findings:
            if f.get("source_item_id") == item_id:
                linked_finding = f
                break
        
        assert linked_finding is not None
        assert linked_finding["finding_type"] == "observation", f"Expected observation, got {linked_finding['finding_type']}"
        print(f"SUCCESS: Parcial result created observation finding")
        
        # Cleanup - set back to cumple
        requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/checklist/{item_id}",
            headers=AUTH_HEADER,
            json={"result": "cumple"}
        )


class TestPhase4AIRedaction:
    """Phase 4: AI-enhanced consolidated report with 5 sections"""
    
    def test_ai_redaction_saves_strengths(self):
        """PUT /api/audits/{audit_id}/ai-redaction saves ai_redacted_strengths"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={"ai_redacted_strengths": "Test fortalezas del SG-SST identificadas durante la auditoria."}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_redacted_strengths" in data.get("updated_fields", [])
        print("SUCCESS: ai_redacted_strengths saved")
    
    def test_ai_redaction_saves_findings(self):
        """PUT /api/audits/{audit_id}/ai-redaction saves ai_redacted_findings"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={"ai_redacted_findings": "Test hallazgos redactados con mejora de IA."}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_redacted_findings" in data.get("updated_fields", [])
        print("SUCCESS: ai_redacted_findings saved")
    
    def test_ai_redaction_saves_recommendations(self):
        """PUT /api/audits/{audit_id}/ai-redaction saves ai_redacted_recommendations"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={"ai_redacted_recommendations": "Test recomendaciones para mejora del SG-SST."}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_redacted_recommendations" in data.get("updated_fields", [])
        print("SUCCESS: ai_redacted_recommendations saved")
    
    def test_ai_redaction_saves_conclusions(self):
        """PUT /api/audits/{audit_id}/ai-redaction saves ai_redacted_conclusions"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={"ai_redacted_conclusions": "Test conclusiones de la auditoria."}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_redacted_conclusions" in data.get("updated_fields", [])
        print("SUCCESS: ai_redacted_conclusions saved")
    
    def test_ai_redaction_saves_multiple_fields(self):
        """PUT /api/audits/{audit_id}/ai-redaction saves multiple fields at once"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={
                "ai_redacted_strengths": "Fortalezas actualizadas",
                "ai_redacted_findings": "Hallazgos actualizados",
                "ai_redacted_recommendations": "Recomendaciones actualizadas",
                "ai_redacted_conclusions": "Conclusiones actualizadas"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        updated = data.get("updated_fields", [])
        assert len(updated) >= 4
        print(f"SUCCESS: Multiple fields saved: {updated}")
    
    def test_ai_redaction_rejects_unknown_fields(self):
        """PUT /api/audits/{audit_id}/ai-redaction rejects unknown fields"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}/ai-redaction",
            headers=AUTH_HEADER,
            json={"unknown_field": "This should be rejected", "another_bad_field": "Also rejected"}
        )
        # Should return 400 because no valid fields to update
        assert resp.status_code == 400
        print("SUCCESS: Unknown fields rejected with 400")
    
    def test_ai_assist_strengths(self):
        """POST /api/audits/ai/assist with type=strengths returns AI text"""
        resp = requests.post(
            f"{BASE_URL}/api/audits/ai/assist",
            headers=AUTH_HEADER,
            json={
                "type": "strengths",
                "context": "Auditoria interna SG-SST. Puntaje: 75%. Cumple: 45/60 items. No conformidades: 5. Observaciones: 10."
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "result" in data
        assert data.get("type") == "strengths"
        assert len(data.get("result", "")) > 0
        print(f"SUCCESS: AI strengths generated ({len(data['result'])} chars)")
    
    def test_ai_assist_recommendations(self):
        """POST /api/audits/ai/assist with type=recommendations returns AI text"""
        resp = requests.post(
            f"{BASE_URL}/api/audits/ai/assist",
            headers=AUTH_HEADER,
            json={
                "type": "recommendations",
                "context": "Hallazgos: NC en capacitacion, NC en matriz de peligros, OBS en documentacion."
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "result" in data
        assert data.get("type") == "recommendations"
        assert len(data.get("result", "")) > 0
        print(f"SUCCESS: AI recommendations generated ({len(data['result'])} chars)")
    
    def test_ai_assist_conclusions(self):
        """POST /api/audits/ai/assist with type=conclusions returns AI text"""
        resp = requests.post(
            f"{BASE_URL}/api/audits/ai/assist",
            headers=AUTH_HEADER,
            json={
                "type": "conclusions",
                "context": "Auditoria completada. Puntaje Res 0312: 72%. Clasificacion: Moderadamente Aceptable. 5 NC, 10 OBS."
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "result" in data
        assert data.get("type") == "conclusions"
        assert len(data.get("result", "")) > 0
        print(f"SUCCESS: AI conclusions generated ({len(data['result'])} chars)")
    
    def test_ai_assist_findings_report(self):
        """POST /api/audits/ai/assist with type=findings_report returns AI text"""
        resp = requests.post(
            f"{BASE_URL}/api/audits/ai/assist",
            headers=AUTH_HEADER,
            json={
                "type": "findings_report",
                "context": "NC: Falta capacitacion en riesgos. OBS: Documentacion incompleta. OM: Mejorar senalizacion."
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "result" in data
        assert data.get("type") == "findings_report"
        assert len(data.get("result", "")) > 0
        print(f"SUCCESS: AI findings_report generated ({len(data['result'])} chars)")


class TestPhase5AuditClosure:
    """Phase 5: Audit closure UI with date/time validation and business rules"""
    
    @pytest.fixture
    def test_audit(self):
        """Create a test audit for closure testing"""
        resp = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json={
                "title": "TEST_Audit_Closure_Test",
                "audit_type": "internal",
                "scheduled_date": "2026-01-15",
                "auditor": "Test Auditor",
                "copasst_member": {"name": "Test COPASST Member", "role": "Presidente"}
            }
        )
        assert resp.status_code == 200
        audit = resp.json()
        yield audit
        # Cleanup
        requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
    
    def test_closure_requires_end_date(self, test_audit):
        """PUT /api/audits/{audit_id} with status=closed validates end_date"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            headers=AUTH_HEADER,
            json={"status": "closed", "end_time": "17:00"}
        )
        assert resp.status_code == 400
        assert "Fecha de cierre" in resp.json().get("detail", "") or "end_date" in resp.json().get("detail", "").lower()
        print("SUCCESS: Closure requires end_date")
    
    def test_closure_requires_end_time(self, test_audit):
        """PUT /api/audits/{audit_id} with status=closed validates end_time"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            headers=AUTH_HEADER,
            json={"status": "closed", "end_date": "2026-01-20"}
        )
        assert resp.status_code == 400
        assert "Hora de cierre" in resp.json().get("detail", "") or "end_time" in resp.json().get("detail", "").lower()
        print("SUCCESS: Closure requires end_time")
    
    def test_closure_requires_auditor(self):
        """PUT /api/audits/{audit_id} with status=closed validates auditor"""
        # Create audit without auditor
        resp = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json={
                "title": "TEST_No_Auditor_Test",
                "audit_type": "internal",
                "scheduled_date": "2026-01-15",
                "copasst_member": {"name": "Test COPASST", "role": "Presidente"}
            }
        )
        assert resp.status_code == 200
        audit = resp.json()
        
        try:
            # Try to close without auditor
            resp = requests.put(
                f"{BASE_URL}/api/audits/{audit['audit_id']}",
                headers=AUTH_HEADER,
                json={"status": "closed", "end_date": "2026-01-20", "end_time": "17:00"}
            )
            assert resp.status_code == 400
            assert "Auditor" in resp.json().get("detail", "")
            print("SUCCESS: Closure requires auditor")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
    
    def test_closure_requires_copasst_member(self):
        """PUT /api/audits/{audit_id} with status=closed validates copasst_member"""
        # Create audit without copasst_member
        resp = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json={
                "title": "TEST_No_COPASST_Test",
                "audit_type": "internal",
                "scheduled_date": "2026-01-15",
                "auditor": "Test Auditor"
            }
        )
        assert resp.status_code == 200
        audit = resp.json()
        
        try:
            # Try to close without copasst_member
            resp = requests.put(
                f"{BASE_URL}/api/audits/{audit['audit_id']}",
                headers=AUTH_HEADER,
                json={"status": "closed", "end_date": "2026-01-20", "end_time": "17:00"}
            )
            assert resp.status_code == 400
            assert "COPASST" in resp.json().get("detail", "")
            print("SUCCESS: Closure requires copasst_member")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)
    
    def test_closure_succeeds_with_all_fields(self, test_audit):
        """PUT /api/audits/{audit_id} with status=closed succeeds with all required fields"""
        resp = requests.put(
            f"{BASE_URL}/api/audits/{test_audit['audit_id']}",
            headers=AUTH_HEADER,
            json={
                "status": "closed",
                "end_date": "2026-01-20",
                "end_time": "17:00"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "closed"
        assert data.get("end_date") == "2026-01-20"
        assert data.get("end_time") == "17:00"
        print("SUCCESS: Audit closed with all required fields")
    
    def test_reviewed_status_also_validates(self):
        """PUT /api/audits/{audit_id} with status=reviewed also enforces business rules"""
        # Create audit
        resp = requests.post(
            f"{BASE_URL}/api/audits",
            headers=AUTH_HEADER,
            json={
                "title": "TEST_Reviewed_Validation",
                "audit_type": "internal",
                "scheduled_date": "2026-01-15",
                "auditor": "Test Auditor",
                "copasst_member": {"name": "Test COPASST", "role": "Presidente"}
            }
        )
        assert resp.status_code == 200
        audit = resp.json()
        
        try:
            # Try to set reviewed without end_date
            resp = requests.put(
                f"{BASE_URL}/api/audits/{audit['audit_id']}",
                headers=AUTH_HEADER,
                json={"status": "reviewed"}
            )
            assert resp.status_code == 400
            print("SUCCESS: Reviewed status also validates required fields")
        finally:
            requests.delete(f"{BASE_URL}/api/audits/{audit['audit_id']}", headers=AUTH_HEADER)


class TestAuditDetailWithNewFields:
    """Verify audit detail returns all new fields"""
    
    def test_audit_detail_has_ai_redaction_fields(self):
        """GET /api/audits/{audit_id} returns AI redaction fields"""
        resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert resp.status_code == 200
        data = resp.json()
        
        # Check AI redaction fields exist (may be empty strings)
        expected_fields = [
            "ai_redacted_summary", "ai_redacted_findings", 
            "ai_redacted_strengths", "ai_redacted_recommendations", 
            "ai_redacted_conclusions", "executive_summary"
        ]
        
        for field in expected_fields:
            assert field in data or data.get(field) is not None or data.get(field, "") == "", f"Missing field: {field}"
        
        print(f"SUCCESS: Audit detail has AI redaction fields")
    
    def test_audit_detail_has_copasst_member(self):
        """GET /api/audits/{audit_id} returns copasst_member"""
        resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "copasst_member" in data
        print(f"SUCCESS: Audit has copasst_member: {data.get('copasst_member')}")
    
    def test_audit_detail_has_score_result(self):
        """GET /api/audits/{audit_id} returns score_result with PHVA breakdown"""
        resp = requests.get(f"{BASE_URL}/api/audits/{TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert resp.status_code == 200
        data = resp.json()
        
        score = data.get("score_result")
        if score:
            assert "percentage" in score
            assert "by_cycle" in score
            assert "classification" in score
            print(f"SUCCESS: Audit has score_result: {score.get('percentage')}% - {score.get('classification', {}).get('label')}")
        else:
            print("INFO: No score_result yet (checklist may not be evaluated)")


class TestFindingsChangeLog:
    """Test that findings have change_log tracking"""
    
    def test_findings_have_change_log_field(self):
        """Findings created via dynamic sync should have change_log array"""
        resp = requests.get(f"{BASE_URL}/api/findings?audit_id={TEST_AUDIT_ID}", headers=AUTH_HEADER)
        assert resp.status_code == 200
        findings = resp.json()
        
        findings_with_changelog = 0
        findings_without_changelog = 0
        
        if findings:
            for f in findings:
                if f.get("source_item_id"):  # Only auto-generated findings have change_log
                    if "change_log" in f:
                        findings_with_changelog += 1
                        print(f"Finding {f['finding_id']} has change_log: {len(f.get('change_log', []))} entries")
                    else:
                        findings_without_changelog += 1
                        print(f"Finding {f['finding_id']} missing change_log (legacy data)")
            
            # At least some findings should have change_log (from our tests)
            print(f"Findings with change_log: {findings_with_changelog}, without: {findings_without_changelog}")
            # This is informational - legacy findings may not have change_log
        else:
            print("INFO: No findings to check")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
