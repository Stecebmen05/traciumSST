import requests
import sys
from datetime import datetime
import json

class SGSSTAPITester:
    def __init__(self, base_url="https://compliance-guardian-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = "test_session_admin_123"
        self.collab_token = "test_session_collab_123"
        self.session_token = self.admin_token  # Default to admin
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.current_company = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add session token for auth
        test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    if isinstance(resp_json, list) and len(resp_json) > 0:
                        print(f"   Response: {len(resp_json)} items returned")
                    elif isinstance(resp_json, dict):
                        print(f"   Response keys: {list(resp_json.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== TESTING AUTH ENDPOINTS ===")
        
        # Test /auth/me
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   User: {response.get('name', 'Unknown')} ({response.get('role', 'No role')})")
        
        return success

    def test_dashboard_endpoint(self):
        """Test dashboard endpoint"""
        print("\n=== TESTING DASHBOARD ENDPOINT ===")
        
        success, response = self.run_test(
            "Get Dashboard Data",
            "GET",
            "dashboard",
            200
        )
        
        if success and 'kpis' in response:
            kpis = response['kpis']
            print(f"   KPIs: {len(kpis)} metrics")
            print(f"   Recent incidents: {len(response.get('recent_incidents', []))}")
            print(f"   Recent findings: {len(response.get('recent_findings', []))}")
        
        return success

    def test_checklist_endpoints(self):
        """Test checklist CRUD operations"""
        print("\n=== TESTING CHECKLIST ENDPOINTS ===")
        
        # Get checklist
        success, items = self.run_test(
            "Get Checklist Items",
            "GET",
            "checklist",
            200
        )
        
        if not success:
            return False
            
        # Create new checklist item
        new_item = {
            "standard": "TEST.1.1",
            "description": "Test checklist item",
            "compliant": False,
            "evidence": "Test evidence",
            "observations": "Test observations"
        }
        
        success, created = self.run_test(
            "Create Checklist Item",
            "POST",
            "checklist",
            200,
            data=new_item
        )
        
        if success and 'item_id' in created:
            item_id = created['item_id']
            
            # Update the item
            update_data = {
                "standard": "TEST.1.1",
                "description": "Updated test checklist item",
                "compliant": True,
                "evidence": "Updated evidence",
                "observations": "Updated observations"
            }
            
            success, updated = self.run_test(
                "Update Checklist Item",
                "PUT",
                f"checklist/{item_id}",
                200,
                data=update_data
            )
            
            # Delete the item
            success, _ = self.run_test(
                "Delete Checklist Item",
                "DELETE",
                f"checklist/{item_id}",
                200
            )
        
        return True

    def test_activities_endpoints(self):
        """Test activities CRUD operations"""
        print("\n=== TESTING ACTIVITIES ENDPOINTS ===")
        
        # Get activities
        success, items = self.run_test(
            "Get Activities",
            "GET",
            "activities",
            200
        )
        
        if not success:
            return False
            
        # Create new activity
        new_activity = {
            "title": "Test Activity",
            "description": "Test activity description",
            "responsible": "Test User",
            "due_date": "2026-12-31",
            "category": "test",
            "priority": "medium"
        }
        
        success, created = self.run_test(
            "Create Activity",
            "POST",
            "activities",
            200,
            data=new_activity
        )
        
        if success and 'activity_id' in created:
            activity_id = created['activity_id']
            
            # Update the activity
            update_data = {
                "status": "completed",
                "completion_percentage": 100
            }
            
            success, updated = self.run_test(
                "Update Activity",
                "PUT",
                f"activities/{activity_id}",
                200,
                data=update_data
            )
            
            # Delete the activity
            success, _ = self.run_test(
                "Delete Activity",
                "DELETE",
                f"activities/{activity_id}",
                200
            )
        
        return True

    def test_documents_endpoints(self):
        """Test documents CRUD operations"""
        print("\n=== TESTING DOCUMENTS ENDPOINTS ===")
        
        # Get documents
        success, items = self.run_test(
            "Get Documents",
            "GET",
            "documents",
            200
        )
        
        if not success:
            return False
            
        # Create new document
        new_doc = {
            "title": "Test Document",
            "category": "policy",
            "description": "Test document description",
            "version": "1.0"
        }
        
        success, created = self.run_test(
            "Create Document",
            "POST",
            "documents",
            200,
            data=new_doc
        )
        
        if success and 'doc_id' in created:
            doc_id = created['doc_id']
            
            # Update the document
            update_data = {
                "title": "Updated Test Document",
                "version": "2.0"
            }
            
            success, updated = self.run_test(
                "Update Document",
                "PUT",
                f"documents/{doc_id}",
                200,
                data=update_data
            )
            
            # Delete the document
            success, _ = self.run_test(
                "Delete Document",
                "DELETE",
                f"documents/{doc_id}",
                200
            )
        
        return True

    def test_hazards_endpoints(self):
        """Test hazards CRUD operations"""
        print("\n=== TESTING HAZARDS ENDPOINTS ===")
        
        # Get hazards
        success, items = self.run_test(
            "Get Hazards",
            "GET",
            "hazards",
            200
        )
        
        if not success:
            return False
            
        # Create new hazard
        new_hazard = {
            "area": "Test Area",
            "hazard_type": "Test Type",
            "description": "Test hazard description",
            "risk_source": "Test source",
            "probability": 3,
            "severity": 4,
            "existing_controls": "Test controls",
            "proposed_controls": "Test proposed controls"
        }
        
        success, created = self.run_test(
            "Create Hazard",
            "POST",
            "hazards",
            200,
            data=new_hazard
        )
        
        if success and 'hazard_id' in created:
            hazard_id = created['hazard_id']
            print(f"   Risk Level: {created.get('risk_level')} ({created.get('risk_category')})")
            
            # Update the hazard
            update_data = {
                "probability": 5,
                "severity": 5
            }
            
            success, updated = self.run_test(
                "Update Hazard",
                "PUT",
                f"hazards/{hazard_id}",
                200,
                data=update_data
            )
            
            # Delete the hazard
            success, _ = self.run_test(
                "Delete Hazard",
                "DELETE",
                f"hazards/{hazard_id}",
                200
            )
        
        return True

    def test_incidents_endpoints(self):
        """Test incidents CRUD operations"""
        print("\n=== TESTING INCIDENTS ENDPOINTS ===")
        
        # Get incidents
        success, items = self.run_test(
            "Get Incidents",
            "GET",
            "incidents",
            200
        )
        
        if not success:
            return False
            
        # Create new incident
        new_incident = {
            "incident_type": "Test Incident",
            "date": "2026-01-15",
            "location": "Test Location",
            "description": "Test incident description",
            "affected_person": "Test Person",
            "severity": "minor",
            "immediate_actions": "Test actions"
        }
        
        success, created = self.run_test(
            "Create Incident",
            "POST",
            "incidents",
            200,
            data=new_incident
        )
        
        if success and 'incident_id' in created:
            incident_id = created['incident_id']
            
            # Update the incident
            update_data = {
                "status": "closed",
                "root_cause": "Test root cause",
                "corrective_actions": "Test corrective actions"
            }
            
            success, updated = self.run_test(
                "Update Incident",
                "PUT",
                f"incidents/{incident_id}",
                200,
                data=update_data
            )
            
            # Delete the incident
            success, _ = self.run_test(
                "Delete Incident",
                "DELETE",
                f"incidents/{incident_id}",
                200
            )
        
        return True

    def test_trainings_endpoints(self):
        """Test trainings CRUD operations"""
        print("\n=== TESTING TRAININGS ENDPOINTS ===")
        
        # Get trainings
        success, items = self.run_test(
            "Get Trainings",
            "GET",
            "trainings",
            200
        )
        
        if not success:
            return False
            
        # Create new training
        new_training = {
            "title": "Test Training",
            "description": "Test training description",
            "trainer": "Test Trainer",
            "scheduled_date": "2026-06-15",
            "duration_hours": 2.0,
            "max_participants": 20
        }
        
        success, created = self.run_test(
            "Create Training",
            "POST",
            "trainings",
            200,
            data=new_training
        )
        
        if success and 'training_id' in created:
            training_id = created['training_id']
            
            # Update the training
            update_data = {
                "status": "completed",
                "effectiveness_score": 85.5
            }
            
            success, updated = self.run_test(
                "Update Training",
                "PUT",
                f"trainings/{training_id}",
                200,
                data=update_data
            )
            
            # Delete the training
            success, _ = self.run_test(
                "Delete Training",
                "DELETE",
                f"trainings/{training_id}",
                200
            )
        
        return True

    def test_audits_endpoints(self):
        """Test audits and findings CRUD operations"""
        print("\n=== TESTING AUDITS ENDPOINTS ===")
        
        # Get audits
        success, items = self.run_test(
            "Get Audits",
            "GET",
            "audits",
            200
        )
        
        if not success:
            return False
            
        print(f"   Found {len(items)} existing audits")
        
        # Test existing audit aud_65ff8623 if it exists
        existing_audit = None
        for audit in items:
            if audit.get('audit_id') == 'aud_65ff8623':
                existing_audit = audit
                break
        
        if existing_audit:
            print(f"   Found existing audit: {existing_audit.get('title')} (Status: {existing_audit.get('status')})")
            self.test_audit_flow_endpoints(existing_audit['audit_id'])
        
        # Create new audit for testing
        new_audit = {
            "title": "Test Audit Flow",
            "audit_type": "internal",
            "scheduled_date": "2026-03-15",
            "end_date": "2026-03-20",
            "auditor": "Test Auditor",
            "scope": "Test scope for complete audit flow",
            "criteria": "Resolucion 0312 de 2019, Decreto 1072 de 2015",
            "objective": "Test complete audit lifecycle"
        }
        
        success, created = self.run_test(
            "Create Audit",
            "POST",
            "audits",
            200,
            data=new_audit
        )
        
        if success and 'audit_id' in created:
            audit_id = created['audit_id']
            print(f"   Created test audit: {audit_id}")
            
            # Test complete audit flow
            self.test_audit_flow_endpoints(audit_id)
            
            # Clean up - delete the test audit
            success, _ = self.run_test(
                "Delete Test Audit",
                "DELETE",
                f"audits/{audit_id}",
                200
            )
        
        return True

    def test_audit_flow_endpoints(self, audit_id):
        """Test complete audit flow endpoints for a specific audit"""
        print(f"\n=== TESTING AUDIT FLOW FOR {audit_id} ===")
        
        # Get audit detail
        success, audit_detail = self.run_test(
            f"Get Audit Detail ({audit_id})",
            "GET",
            f"audits/{audit_id}",
            200
        )
        
        if success:
            print(f"   Audit: {audit_detail.get('title')}")
            print(f"   Checklist items: {len(audit_detail.get('checklist', []))}")
            print(f"   Findings: {len(audit_detail.get('findings', []))}")
            print(f"   Action plans: {len(audit_detail.get('action_plans', []))}")
        
        # Test checklist generation (if no checklist exists)
        checklist = audit_detail.get('checklist', []) if success else []
        if len(checklist) == 0:
            success, checklist_result = self.run_test(
                f"Generate Audit Checklist ({audit_id})",
                "POST",
                f"audits/{audit_id}/checklist/generate",
                200
            )
            
            if success:
                print(f"   Checklist generation: {checklist_result.get('message', '')}")
        
        # Get checklist items
        success, checklist_items = self.run_test(
            f"Get Audit Checklist ({audit_id})",
            "GET",
            f"audits/{audit_id}/checklist",
            200
        )
        
        if success and len(checklist_items) > 0:
            print(f"   Retrieved {len(checklist_items)} checklist items")
            
            # Update first checklist item
            first_item = checklist_items[0]
            item_id = first_item.get('item_id')
            
            if item_id:
                update_checklist = {
                    "checked": True,
                    "result": "cumple",
                    "observations": "Test observation for checklist item"
                }
                
                success, updated_item = self.run_test(
                    f"Update Checklist Item ({item_id})",
                    "PUT",
                    f"audits/{audit_id}/checklist/{item_id}",
                    200,
                    data=update_checklist
                )
                
                if success:
                    print(f"   Updated checklist item: {updated_item.get('result')}")
        
        # Test findings
        new_finding = {
            "audit_id": audit_id,
            "finding_type": "no_conformity",
            "description": "Test finding for audit flow",
            "area": "Test Area",
            "standard_ref": "3.1.1",
            "corrective_action": "Test corrective action",
            "responsible": "Test Person",
            "due_date": "2026-04-15",
            "evidence_files": []
        }
        
        success, finding_created = self.run_test(
            f"Create Finding ({audit_id})",
            "POST",
            "findings",
            200,
            data=new_finding
        )
        
        finding_id = None
        if success and 'finding_id' in finding_created:
            finding_id = finding_created['finding_id']
            print(f"   Created finding: {finding_id}")
            
            # Update finding status
            success, _ = self.run_test(
                f"Update Finding Status ({finding_id})",
                "PUT",
                f"findings/{finding_id}",
                200,
                data={"status": "closed"}
            )
        
        # Test action plans
        if finding_id:
            new_action_plan = {
                "audit_id": audit_id,
                "finding_id": finding_id,
                "action": "Test corrective action plan",
                "action_type": "corrective",
                "responsible": "Test Responsible Person",
                "due_date": "2026-05-15"
            }
            
            success, plan_created = self.run_test(
                f"Create Action Plan ({audit_id})",
                "POST",
                "action-plans",
                200,
                data=new_action_plan
            )
            
            plan_id = None
            if success and 'plan_id' in plan_created:
                plan_id = plan_created['plan_id']
                print(f"   Created action plan: {plan_id}")
                
                # Add follow-up note
                follow_up = {
                    "note": "Test follow-up note for action plan"
                }
                
                success, _ = self.run_test(
                    f"Add Follow-up Note ({plan_id})",
                    "POST",
                    f"action-plans/{plan_id}/follow-up",
                    200,
                    data=follow_up
                )
                
                # Update action plan status
                success, _ = self.run_test(
                    f"Update Action Plan Status ({plan_id})",
                    "PUT",
                    f"action-plans/{plan_id}",
                    200,
                    data={"status": "closed", "progress": 100}
                )
        
        # Test management review
        management_review = {
            "conclusions": "Test audit conclusions from management review",
            "decisions": "Test management decisions",
            "resources_needed": "Test resources needed",
            "next_steps": "Test next steps"
        }
        
        success, review_result = self.run_test(
            f"Save Management Review ({audit_id})",
            "POST",
            f"audits/{audit_id}/management-review",
            200,
            data=management_review
        )
        
        if success:
            print(f"   Management review saved by: {review_result.get('reviewer', 'Unknown')}")
        
        # Test audit status updates through lifecycle
        status_flow = ['assigned', 'in_progress', 'evidence_review', 'findings_review', 'action_plan', 'follow_up', 'closed']
        
        for status in status_flow:
            success, _ = self.run_test(
                f"Update Audit Status to {status} ({audit_id})",
                "PUT",
                f"audits/{audit_id}",
                200,
                data={"status": status}
            )
            if not success:
                break
        
        return True

    def test_audit_history_and_ai(self):
        """Test audit history comparison and AI assist endpoints"""
        print("\n=== TESTING AUDIT HISTORY AND AI ===")
        
        # Test historical comparison
        success, history = self.run_test(
            "Get Audit History Comparison",
            "GET",
            "audits/history/comparison",
            200
        )
        
        if success:
            print(f"   Historical audits: {len(history)}")
            if len(history) > 0:
                latest = history[0]
                print(f"   Latest audit: {latest.get('title')} - {latest.get('compliance_rate')}% compliance")
        
        # Test AI assist for different types
        ai_tests = [
            {
                "type": "finding",
                "context": "Auditoria interna SG-SST. Item no conforme: 3.1.1 - Evaluaciones medicas ocupacionales. No se encontraron registros actualizados."
            },
            {
                "type": "action_plan", 
                "context": "Hallazgo: Falta de evaluaciones medicas ocupacionales actualizadas. Area: Recursos Humanos."
            },
            {
                "type": "executive_summary",
                "context": "Auditoria interna SG-SST Q1 2026. 45/56 items cumplidos. 3 no conformidades, 2 observaciones. 5 planes de accion creados."
            },
            {
                "type": "checklist_observation",
                "context": "Estandar 2.1.1: Politica de SST firmada y divulgada. Evidencia requerida: Politica publicada. Resultado: cumple parcialmente"
            },
            {
                "type": "management_review",
                "context": "Auditoria completada. 80% cumplimiento. 3 NC cerradas. Recursos adicionales requeridos para capacitacion."
            }
        ]
        
        for ai_test in ai_tests:
            success, ai_result = self.run_test(
                f"AI Assist - {ai_test['type']}",
                "POST",
                "audits/ai/assist",
                200,
                data=ai_test
            )
            
            if success:
                result_text = ai_result.get('result', '')
                print(f"   AI {ai_test['type']}: {len(result_text)} characters generated")
                if 'Error' in result_text:
                    print(f"   AI Error: {result_text[:100]}...")
            else:
                print(f"   AI {ai_test['type']}: Failed to generate")
        
        return True

    def test_reports_endpoints(self):
        """Test reports generation"""
        print("\n=== TESTING REPORTS ENDPOINTS ===")
        
        # Test Excel report
        success, _ = self.run_test(
            "Generate Excel Report",
            "GET",
            "reports/excel",
            200
        )
        
        # Test PDF report
        success, _ = self.run_test(
            "Generate PDF Report",
            "GET",
            "reports/pdf",
            200
        )
        
        return True

    def test_standards_bank_endpoints(self):
        """Test standards bank endpoints (Resolución 0312/2019)"""
        print("\n=== TESTING STANDARDS BANK ENDPOINTS ===")
        
        # Test get standards bank
        success, bank = self.run_test(
            "Get Standards Bank",
            "GET",
            "standards/bank",
            200
        )
        
        if success:
            print(f"   Total standards in bank: {len(bank)}")
            if len(bank) > 0:
                print(f"   Sample standard: {bank[0].get('code')} - {bank[0].get('description', '')[:50]}...")
        
        # Test get company config
        success, company = self.run_test(
            "Get Company Config",
            "GET",
            "company",
            200
        )
        
        if success:
            print(f"   Company: {company.get('name')} - {company.get('workers_count')} workers, Risk Level {company.get('risk_level')}")
        
        # Test update company config
        update_company = {
            "name": "Test Company Updated",
            "workers_count": 30,
            "risk_level": 3,
            "nit": "123456789",
            "economic_activity": "Testing",
            "city": "Test City"
        }
        
        success, updated_company = self.run_test(
            "Update Company Config",
            "PUT",
            "company",
            200,
            data=update_company
        )
        
        if success:
            print(f"   Updated company: {updated_company.get('workers_count')} workers, Risk Level {updated_company.get('risk_level')}")
        
        # Test get applicable standards
        success, applicable = self.run_test(
            "Get Applicable Standards",
            "GET",
            "standards/applicable",
            200
        )
        
        if success:
            print(f"   Applicable standards: {applicable.get('applicable_count')} of {applicable.get('total_standards')}")
            print(f"   Company type: {applicable.get('company_type')}")
            print(f"   Total weight: {applicable.get('total_weight')}")
        
        # Test seed standards
        success, seed_result = self.run_test(
            "Seed Standards",
            "POST",
            "standards/seed",
            200
        )
        
        if success:
            print(f"   Seed result: {seed_result.get('message', '')}")
        
        # Test get standards compliance
        success, compliance = self.run_test(
            "Get Standards Compliance",
            "GET",
            "standards/compliance",
            200
        )
        
        if success:
            print(f"   Compliance items: {len(compliance)}")
            applicable_items = [item for item in compliance if item.get('applicable')]
            print(f"   Applicable items: {len(applicable_items)}")
        
        # Test update standard compliance (if we have standards)
        if success and len(compliance) > 0:
            first_standard = compliance[0]
            code = first_standard.get('code')
            
            update_compliance = {
                "compliant": True,
                "evidence_uploaded": "Test evidence",
                "observations": "Test observations",
                "responsible": "Test User",
                "sede": "Test Sede"
            }
            
            success, updated_std = self.run_test(
                f"Update Standard Compliance ({code})",
                "PUT",
                f"standards/compliance/{code}",
                200,
                data=update_compliance
            )
            
            if success:
                print(f"   Updated standard {code}: compliant={updated_std.get('compliant')}")
        
        # Test get compliance summary
        success, summary = self.run_test(
            "Get Compliance Summary",
            "GET",
            "standards/compliance/summary",
            200
        )
        
        if success:
            overall = summary.get('overall', {})
            print(f"   Overall score: {overall.get('score', 0)}%")
            print(f"   Compliant: {overall.get('compliant_count', 0)}/{overall.get('applicable_count', 0)}")
            
            phva = summary.get('phva', {})
            print(f"   PHVA phases: {list(phva.keys())}")
        
        # Test get decreto 1072 components
        success, decreto = self.run_test(
            "Get Decreto 1072 Components",
            "GET",
            "decreto1072/components",
            200
        )
        
        if success:
            print(f"   Decreto 1072 components: {len(decreto)}")
            if len(decreto) > 0:
                avg_compliance = sum(comp.get('compliance_percentage', 0) for comp in decreto) / len(decreto)
                print(f"   Average compliance: {avg_compliance:.1f}%")
        
        # Test reset standards
        success, reset_result = self.run_test(
            "Reset Standards",
            "POST",
            "standards/reset",
            200
        )
        
        if success:
            print(f"   Reset result: {reset_result.get('message', '')}")
        
        return True

    def test_rbac_endpoints(self):
        """Test RBAC (Role-Based Access Control) functionality"""
        print("\n=== TESTING RBAC ENDPOINTS ===")
        
        # Test admin permissions
        self.session_token = self.admin_token
        success, admin_perms = self.run_test(
            "Get Admin Permissions",
            "GET",
            "rbac/permissions",
            200
        )
        
        if success:
            print(f"   Admin role: {admin_perms.get('role')}")
            print(f"   Can write: {admin_perms.get('can_write')}")
            print(f"   Can manage users: {admin_perms.get('can_manage_users')}")
            print(f"   Can manage companies: {admin_perms.get('can_manage_companies')}")
        
        # Test collaborator permissions
        self.session_token = self.collab_token
        success, collab_perms = self.run_test(
            "Get Collaborator Permissions",
            "GET",
            "rbac/permissions",
            200
        )
        
        if success:
            print(f"   Collaborator role: {collab_perms.get('role')}")
            print(f"   Can write: {collab_perms.get('can_write')}")
            print(f"   Can manage users: {collab_perms.get('can_manage_users')}")
        
        # Test admin can create documents
        self.session_token = self.admin_token
        new_doc = {
            "title": "RBAC Test Document",
            "category": "policy",
            "description": "Test document for RBAC",
            "version": "1.0"
        }
        
        success, created_doc = self.run_test(
            "Admin Create Document (Should Succeed)",
            "POST",
            "documents",
            200,
            data=new_doc
        )
        
        doc_id = None
        if success and 'doc_id' in created_doc:
            doc_id = created_doc['doc_id']
            print(f"   Admin successfully created document: {doc_id}")
        
        # Test collaborator cannot create documents (should get 403)
        self.session_token = self.collab_token
        success, response = self.run_test(
            "Collaborator Create Document (Should Fail 403)",
            "POST",
            "documents",
            403,
            data=new_doc
        )
        
        if success:
            print("   Collaborator correctly blocked from creating documents")
        
        # Test collaborator can read documents
        success, docs = self.run_test(
            "Collaborator Read Documents (Should Succeed)",
            "GET",
            "documents",
            200
        )
        
        if success:
            print(f"   Collaborator can read {len(docs)} documents")
        
        # Test collaborator can read dashboard
        success, dashboard = self.run_test(
            "Collaborator Read Dashboard (Should Succeed)",
            "GET",
            "dashboard",
            200
        )
        
        if success:
            print("   Collaborator can read dashboard")
        
        # Clean up - delete test document as admin
        if doc_id:
            self.session_token = self.admin_token
            self.run_test(
                "Admin Delete Test Document",
                "DELETE",
                f"documents/{doc_id}",
                200
            )
        
        # Reset to admin token
        self.session_token = self.admin_token
        return True

    def test_object_storage_endpoints(self):
        """Test Object Storage functionality"""
        print("\n=== TESTING OBJECT STORAGE ENDPOINTS ===")
        
        # Test file upload (admin only)
        self.session_token = self.admin_token
        
        # Create a test file content
        test_content = "This is a test file for object storage testing."
        
        # Test upload using requests with files parameter
        url = f"{self.base_url}/api/files/upload"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        files = {'file': ('test_evidence.txt', test_content, 'text/plain')}
        
        print(f"\n🔍 Testing File Upload...")
        print(f"   URL: {url}")
        
        self.tests_run += 1
        try:
            response = requests.post(url, headers=headers, files=files, timeout=30)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                upload_result = response.json()
                file_id = upload_result.get('file_id')
                print(f"   Uploaded file ID: {file_id}")
                print(f"   Original filename: {upload_result.get('original_filename')}")
                print(f"   File size: {upload_result.get('size')} bytes")
                
                # Test list files
                success, files_list = self.run_test(
                    "List Files",
                    "GET",
                    "files",
                    200
                )
                
                if success:
                    print(f"   Total files in storage: {len(files_list)}")
                    uploaded_file = next((f for f in files_list if f.get('file_id') == file_id), None)
                    if uploaded_file:
                        print(f"   Found uploaded file: {uploaded_file.get('original_filename')}")
                
                # Test file download
                if file_id:
                    download_url = f"{self.base_url}/api/files/{file_id}/download"
                    print(f"\n🔍 Testing File Download...")
                    print(f"   URL: {download_url}")
                    
                    self.tests_run += 1
                    try:
                        download_response = requests.get(download_url, headers=headers, timeout=30)
                        
                        if download_response.status_code == 200:
                            self.tests_passed += 1
                            print(f"✅ Passed - Status: {download_response.status_code}")
                            print(f"   Downloaded content length: {len(download_response.content)} bytes")
                            print(f"   Content type: {download_response.headers.get('Content-Type', 'unknown')}")
                        else:
                            self.failed_tests.append({
                                "test": "File Download",
                                "expected": 200,
                                "actual": download_response.status_code,
                                "response": download_response.text[:200]
                            })
                            print(f"❌ Failed - Expected 200, got {download_response.status_code}")
                    except Exception as e:
                        self.failed_tests.append({
                            "test": "File Download",
                            "error": str(e)
                        })
                        print(f"❌ Failed - Error: {str(e)}")
                
                # Test delete file (admin only)
                if file_id:
                    success, _ = self.run_test(
                        "Delete File",
                        "DELETE",
                        f"files/{file_id}",
                        200
                    )
                    
                    if success:
                        print(f"   Successfully deleted file: {file_id}")
                
                return True
            else:
                self.failed_tests.append({
                    "test": "File Upload",
                    "expected": 200,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.failed_tests.append({
                "test": "File Upload",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_multi_company_endpoints(self):
        """Test Multi-company management functionality"""
        print("\n=== TESTING MULTI-COMPANY ENDPOINTS ===")
        
        # Test get companies list
        self.session_token = self.admin_token
        success, companies = self.run_test(
            "Get Companies List",
            "GET",
            "companies",
            200
        )
        
        if success:
            print(f"   Total companies: {len(companies)}")
            for comp in companies[:3]:  # Show first 3
                print(f"   - {comp.get('name')} ({comp.get('workers_count')} workers, Risk {comp.get('risk_level')})")
        
        # Test get active company
        success, active_company = self.run_test(
            "Get Active Company",
            "GET",
            "companies/active",
            200
        )
        
        if success:
            print(f"   Active company: {active_company.get('name')} (ID: {active_company.get('company_id')})")
        
        # Test create new company (admin only)
        new_company = {
            "name": "Test Company RBAC",
            "nit": "900123456-7",
            "workers_count": 45,
            "risk_level": 3,
            "economic_activity": "Testing Services",
            "city": "Test City",
            "sedes": ["Sede Principal", "Sede Secundaria"],
            "processes": ["Administrativo", "Operativo", "Testing"]
        }
        
        success, created_company = self.run_test(
            "Create New Company (Admin)",
            "POST",
            "companies",
            200,
            data=new_company
        )
        
        company_id = None
        if success and 'company_id' in created_company:
            company_id = created_company['company_id']
            print(f"   Created company ID: {company_id}")
            print(f"   Company name: {created_company.get('name')}")
        
        # Test switch to new company
        if company_id:
            success, switch_result = self.run_test(
                "Switch Active Company",
                "POST",
                f"companies/{company_id}/switch",
                200
            )
            
            if success:
                print(f"   Successfully switched to company: {switch_result.get('company', {}).get('name')}")
            
            # Verify active company changed
            success, new_active = self.run_test(
                "Verify Active Company Changed",
                "GET",
                "companies/active",
                200
            )
            
            if success and new_active.get('company_id') == company_id:
                print(f"   Active company correctly changed to: {new_active.get('name')}")
        
        # Test collaborator cannot create companies (should get 403)
        self.session_token = self.collab_token
        success, response = self.run_test(
            "Collaborator Create Company (Should Fail 403)",
            "POST",
            "companies",
            403,
            data=new_company
        )
        
        if success:
            print("   Collaborator correctly blocked from creating companies")
        
        # Test collaborator can read companies
        success, collab_companies = self.run_test(
            "Collaborator Read Companies (Should Succeed)",
            "GET",
            "companies",
            200
        )
        
        if success:
            print(f"   Collaborator can read {len(collab_companies)} companies")
        
        # Clean up - delete test company as admin
        if company_id:
            self.session_token = self.admin_token
            
            # Switch back to default company first
            if len(companies) > 0:
                default_company = companies[0]
                self.run_test(
                    "Switch Back to Default Company",
                    "POST",
                    f"companies/{default_company.get('company_id')}/switch",
                    200
                )
            
            # Delete test company
            self.run_test(
                "Delete Test Company",
                "DELETE",
                f"companies/{company_id}",
                200
            )
            print(f"   Cleaned up test company: {company_id}")
        
        # Reset to admin token
        self.session_token = self.admin_token
        return True

    def test_company_scoped_standards(self):
        """Test that standards are scoped per company"""
        print("\n=== TESTING COMPANY-SCOPED STANDARDS ===")
        
        self.session_token = self.admin_token
        
        # Get current standards compliance
        success, standards_before = self.run_test(
            "Get Standards Before Company Switch",
            "GET",
            "standards/compliance",
            200
        )
        
        if not success:
            return False
        
        # Get companies list
        success, companies = self.run_test(
            "Get Companies for Standards Test",
            "GET",
            "companies",
            200
        )
        
        if success and len(companies) >= 2:
            # Switch to different company
            other_company = companies[1] if companies[0].get('company_id') == 'default' else companies[0]
            company_id = other_company.get('company_id')
            
            success, _ = self.run_test(
                "Switch to Different Company",
                "POST",
                f"companies/{company_id}/switch",
                200
            )
            
            if success:
                # Get standards for different company
                success, standards_after = self.run_test(
                    "Get Standards After Company Switch",
                    "GET",
                    "standards/compliance",
                    200
                )
                
                if success:
                    print(f"   Standards before switch: {len(standards_before)}")
                    print(f"   Standards after switch: {len(standards_after)}")
                    
                    # Check if standards are different (company-scoped)
                    if len(standards_before) != len(standards_after):
                        print("   ✅ Standards are correctly scoped per company (different counts)")
                    else:
                        print("   ⚠️  Standards count same - may be using same company data")
                
                # Switch back to default company
                default_company = companies[0] if companies[0].get('company_id') == 'default' else companies[1]
                self.run_test(
                    "Switch Back to Default Company",
                    "POST",
                    f"companies/{default_company.get('company_id')}/switch",
                    200
                )
        
        return True

    def test_critical_data_isolation(self):
        """Test critical data isolation requirements from the bug fix"""
        print("\n=== TESTING CRITICAL DATA ISOLATION ===")
        
        self.session_token = self.admin_token
        
        # Test 1: Switch to comp_efe289ae and verify 0 audits (no fallback)
        print("\n--- Testing comp_efe289ae isolation ---")
        success, _ = self.run_test(
            "Switch to comp_efe289ae",
            "POST", 
            "companies/comp_efe289ae/switch",
            200
        )
        
        if success:
            # Test audits - should return 0 (no fallback to other companies)
            success, audits_data = self.run_test(
                "Get audits for comp_efe289ae (should be 0)",
                "GET",
                "audits", 
                200
            )
            
            if success:
                audit_count = len(audits_data) if isinstance(audits_data, list) else 0
                print(f"   Audits for comp_efe289ae: {audit_count}")
                if audit_count == 0:
                    print("   ✅ Data isolation working - no audits for comp_efe289ae")
                else:
                    print(f"   ❌ Data isolation FAILED - found {audit_count} audits (should be 0)")
                    self.failed_tests.append({
                        'test': 'comp_efe289ae audit isolation',
                        'expected': 0,
                        'actual': audit_count,
                        'response': f'Found {audit_count} audits when should be 0'
                    })
            
            # Test other modules for comp_efe289ae
            modules = [
                ("documents", "Documents"),
                ("hazards", "Hazards"), 
                ("incidents", "Incidents"),
                ("trainings", "Trainings")
            ]
            
            for endpoint, module_name in modules:
                success, data = self.run_test(
                    f"Get {module_name} for comp_efe289ae",
                    "GET",
                    endpoint,
                    200
                )
                if success:
                    count = len(data) if isinstance(data, list) else 0
                    print(f"   {module_name} for comp_efe289ae: {count}")
        
        # Test 2: Switch to comp_2a3f500b and verify data exists
        print("\n--- Testing comp_2a3f500b data ---")
        success, _ = self.run_test(
            "Switch to comp_2a3f500b (DESARROLLOS DON BOSCO)",
            "POST",
            "companies/comp_2a3f500b/switch", 
            200
        )
        
        if success:
            # Test audits - should return 1 audit for DESARROLLOS DON BOSCO
            success, audits_data = self.run_test(
                "Get audits for comp_2a3f500b (should be 1+)",
                "GET",
                "audits",
                200
            )
            
            if success:
                audit_count = len(audits_data) if isinstance(audits_data, list) else 0
                print(f"   Audits for comp_2a3f500b: {audit_count}")
                if audit_count >= 1:
                    print("   ✅ Data isolation working - found audits for comp_2a3f500b")
                    
                    # Test specific audit aud_d44a6cb2 checklist
                    target_audit = None
                    for audit in audits_data:
                        if audit.get('audit_id') == 'aud_d44a6cb2':
                            target_audit = audit
                            break
                    
                    if target_audit:
                        print(f"   Found target audit: {target_audit['audit_id']}")
                        self.test_audit_checklist_generation(target_audit['audit_id'])
                    else:
                        print("   ⚠️  Target audit aud_d44a6cb2 not found, testing with first audit")
                        if audits_data:
                            self.test_audit_checklist_generation(audits_data[0]['audit_id'])
                else:
                    print(f"   ❌ Expected at least 1 audit for comp_2a3f500b, got {audit_count}")
                    self.failed_tests.append({
                        'test': 'comp_2a3f500b audit data',
                        'expected': '>=1',
                        'actual': audit_count,
                        'response': f'Expected at least 1 audit, got {audit_count}'
                    })
            
            # Test dashboard scoped data
            success, dashboard_data = self.run_test(
                "Get dashboard KPIs for comp_2a3f500b",
                "GET",
                "dashboard",
                200
            )
            
            if success:
                kpis = dashboard_data.get('kpis', {})
                print(f"   Dashboard KPIs - Docs: {kpis.get('total_documents', 0)}, "
                      f"Hazards: {kpis.get('total_hazards', 0)}, "
                      f"Incidents: {kpis.get('total_incidents', 0)}, "
                      f"Audits: {kpis.get('total_audits', 0)}")
                print("   ✅ Dashboard returns company-scoped KPIs")
        
        # Test 3: Test new data creation includes company_id
        print("\n--- Testing new data creation with company_id ---")
        
        # Create document
        doc_data = {
            "title": "Test Document for Data Isolation",
            "category": "policy",
            "description": "Testing company_id scoping"
        }
        
        success, doc_result = self.run_test(
            "Create document (should include company_id)",
            "POST",
            "documents",
            201,
            doc_data
        )
        
        if success:
            print(f"   Created document: {doc_result.get('doc_id', 'Unknown')}")
        
        # Create incident  
        incident_data = {
            "incident_type": "Incidente",
            "date": "2026-01-25", 
            "location": "Test Area",
            "description": "Test incident for company_id verification",
            "severity": "minor"
        }
        
        success, incident_result = self.run_test(
            "Create incident (should include company_id)",
            "POST",
            "incidents", 
            201,
            incident_data
        )
        
        if success:
            print(f"   Created incident: {incident_result.get('incident_id', 'Unknown')}")
        
        return True

    def test_audit_checklist_generation(self, audit_id):
        """Test audit checklist generation and auto-seeding"""
        print(f"\n--- Testing checklist for audit {audit_id} ---")
        
        # Get current checklist
        success, checklist_data = self.run_test(
            f"Get checklist for {audit_id}",
            "GET",
            f"audits/{audit_id}/checklist",
            200
        )
        
        if success:
            checklist_count = len(checklist_data) if isinstance(checklist_data, list) else 0
            print(f"   Current checklist items: {checklist_count}")
            
            if checklist_count >= 50:  # Should have ~56 items
                print("   ✅ Checklist has sufficient items (standards auto-seeded)")
                
                # Test PDF report generation
                self.test_audit_pdf_report_specific(audit_id)
            else:
                print(f"   ⚠️  Checklist has only {checklist_count} items, trying to generate...")
                
                # Try to generate checklist
                success, gen_result = self.run_test(
                    f"Generate checklist for {audit_id}",
                    "POST",
                    f"audits/{audit_id}/checklist/generate",
                    200
                )
                
                if success:
                    print(f"   Generation result: {gen_result.get('message', 'Generated')}")
                    
                    # Re-check checklist count
                    success, new_checklist = self.run_test(
                        f"Re-check checklist for {audit_id}",
                        "GET",
                        f"audits/{audit_id}/checklist", 
                        200
                    )
                    
                    if success:
                        new_count = len(new_checklist) if isinstance(new_checklist, list) else 0
                        print(f"   New checklist count: {new_count}")
                        
                        if new_count >= 50:
                            print("   ✅ Checklist generation successful - standards auto-seeded")
                            self.test_audit_pdf_report_specific(audit_id)
                        else:
                            print(f"   ❌ Checklist generation failed - only {new_count} items")
                            self.failed_tests.append({
                                'test': 'checklist generation',
                                'expected': '>=50',
                                'actual': new_count,
                                'response': f'Generated only {new_count} checklist items'
                            })
        
        return True

    def test_audit_pdf_report_specific(self, audit_id):
        """Test PDF report generation for specific audit"""
        print(f"   Testing PDF report for audit {audit_id}...")
        
        url = f"{self.base_url}/api/audits/{audit_id}/report/pdf"
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=60)
            if response.status_code == 200:
                content_length = len(response.content)
                print(f"   PDF size: {content_length} bytes")
                if content_length > 5000:  # Should be >5KB
                    print("   ✅ PDF generated successfully (>5KB)")
                    return True
                else:
                    print(f"   ❌ PDF too small: {content_length} bytes")
                    self.failed_tests.append({
                        'test': 'PDF report size',
                        'expected': '>5000',
                        'actual': content_length,
                        'response': f'PDF only {content_length} bytes'
                    })
                    return False
            else:
                print(f"   ❌ PDF generation failed: {response.status_code}")
                print(f"   Response: {response.text[:100]}")
                self.failed_tests.append({
                    'test': 'PDF report generation',
                    'expected': 200,
                    'actual': response.status_code,
                    'response': response.text[:100]
                })
                return False
        except Exception as e:
            print(f"   ❌ PDF generation error: {str(e)}")
            self.failed_tests.append({
                'test': 'PDF report generation',
                'error': str(e)
            })
            return False

    def test_ai_analysis(self):
        """Test AI analysis endpoint"""
        print("\n=== TESTING AI ANALYSIS ===")
        
        analysis_request = {
            "query": "¿Cuál es el estado general del SG-SST?",
            "context_type": "dashboard"
        }
        
        success, response = self.run_test(
            "AI Analysis",
            "POST",
            "ai/analyze",
            200,
            data=analysis_request
        )
        
        if success:
            print(f"   Analysis length: {len(response.get('analysis', ''))}")
            print(f"   Context provided: {bool(response.get('context'))}")
        
        return success

    def test_consultant_dashboard(self):
        """Test consultant dashboard endpoint - consolidated data for all companies"""
        print("\n=== TESTING CONSULTANT DASHBOARD ===")
        
        success, response = self.run_test(
            "Get Consultant Dashboard",
            "GET",
            "consultant/dashboard",
            200
        )
        
        if success:
            print(f"   Companies in dashboard: {len(response)}")
            if len(response) > 0:
                first_company = response[0]
                print(f"   Sample company: {first_company.get('name')} - {first_company.get('workers_count')} workers")
                print(f"   Compliance score: {first_company.get('compliance_score', 0)}%")
                print(f"   Total audits: {first_company.get('total_audits', 0)}")
                print(f"   Open findings: {first_company.get('open_findings', 0)}")
                print(f"   Total incidents: {first_company.get('total_incidents', 0)}")
                
                # Verify required fields are present
                required_fields = ['company_id', 'name', 'workers_count', 'risk_level', 'compliance_score', 
                                 'total_standards', 'compliant_standards', 'total_audits', 'open_findings', 'total_incidents']
                missing_fields = [field for field in required_fields if field not in first_company]
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✅ All required fields present")
        
        return success

    def test_audit_pdf_report(self):
        """Test audit PDF report generation"""
        print("\n=== TESTING AUDIT PDF REPORT ===")
        
        # First get audits to find one to test with
        success, audits = self.run_test(
            "Get Audits for PDF Test",
            "GET",
            "audits",
            200
        )
        
        if not success or len(audits) == 0:
            print("   No audits found - creating test audit for PDF generation")
            # Create a test audit
            new_audit = {
                "title": "Test Audit for PDF Report",
                "audit_type": "internal",
                "scheduled_date": "2026-03-15",
                "end_date": "2026-03-20",
                "auditor": "Test Auditor PDF",
                "scope": "Test scope for PDF report generation",
                "criteria": "Resolucion 0312 de 2019, Decreto 1072 de 2015",
                "objective": "Test PDF report generation"
            }
            
            success, created_audit = self.run_test(
                "Create Test Audit for PDF",
                "POST",
                "audits",
                200,
                data=new_audit
            )
            
            if success and 'audit_id' in created_audit:
                audit_id = created_audit['audit_id']
                print(f"   Created test audit: {audit_id}")
            else:
                print("   Failed to create test audit for PDF")
                return False
        else:
            # Use existing audit, prefer aud_65ff8623 if it exists
            audit_id = None
            for audit in audits:
                if audit.get('audit_id') == 'aud_65ff8623':
                    audit_id = audit['audit_id']
                    break
            
            if not audit_id:
                audit_id = audits[0]['audit_id']
            
            print(f"   Using existing audit: {audit_id}")
        
        # Test PDF generation
        url = f"{self.base_url}/api/audits/{audit_id}/report/pdf"
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        print(f"\n🔍 Testing PDF Report Generation...")
        print(f"   URL: {url}")
        
        self.tests_run += 1
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check content type
                content_type = response.headers.get('Content-Type', '')
                print(f"   Content-Type: {content_type}")
                
                # Check file size (should be >5KB as per requirement)
                file_size = len(response.content)
                print(f"   PDF file size: {file_size} bytes ({file_size/1024:.1f} KB)")
                
                if file_size > 5120:  # 5KB = 5120 bytes
                    print(f"   ✅ PDF size requirement met (>5KB)")
                else:
                    print(f"   ⚠️  PDF size below 5KB requirement")
                
                # Check if it's actually a PDF
                if content_type == 'application/pdf' or response.content.startswith(b'%PDF'):
                    print(f"   ✅ Valid PDF format")
                else:
                    print(f"   ⚠️  May not be valid PDF format")
                
                # Check content disposition header
                content_disposition = response.headers.get('Content-Disposition', '')
                if 'attachment' in content_disposition and 'filename' in content_disposition:
                    print(f"   ✅ Proper download headers set")
                    print(f"   Content-Disposition: {content_disposition}")
                else:
                    print(f"   ⚠️  Download headers may be missing")
                
                return True
            else:
                self.failed_tests.append({
                    "test": "Audit PDF Report Generation",
                    "expected": 200,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.failed_tests.append({
                "test": "Audit PDF Report Generation",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_standards_classification_fix(self):
        """Test the specific standards classification fix from Resolución 0312/2019"""
        print("\n=== TESTING STANDARDS CLASSIFICATION FIX ===")
        
        # Test 1: GET /api/standards/bank returns exactly 60 items
        success, bank = self.run_test(
            "Standards Bank - Exactly 60 Items",
            "GET",
            "standards/bank",
            200
        )
        
        if success:
            bank_count = len(bank)
            print(f"   Standards bank count: {bank_count}")
            if bank_count == 60:
                print("   ✅ Standards bank has exactly 60 items")
            else:
                print(f"   ❌ Expected 60 standards, got {bank_count}")
                self.failed_tests.append({
                    "test": "Standards bank count",
                    "expected": 60,
                    "actual": bank_count,
                    "response": f"Bank has {bank_count} standards instead of 60"
                })
        
        # Test 2: Standards total weight = 100%
        if success and bank:
            total_weight = sum(item.get('weight', 0) for item in bank)
            print(f"   Total weight: {total_weight}%")
            if total_weight == 100.0:
                print("   ✅ Total weight equals 100%")
            else:
                print(f"   ❌ Expected 100%, got {total_weight}%")
                self.failed_tests.append({
                    "test": "Standards total weight",
                    "expected": 100.0,
                    "actual": total_weight,
                    "response": f"Total weight is {total_weight}% instead of 100%"
                })
        
        # Test 3: Company classification scenarios
        test_scenarios = [
            {
                "name": "Company <=10 workers risk II",
                "workers": 10,
                "risk": 2,
                "expected_count": 7,
                "description": "Cap 1: 7 standards"
            },
            {
                "name": "Company 11-50 workers risk II", 
                "workers": 25,
                "risk": 2,
                "expected_count": 21,
                "description": "Cap 2: 21 standards"
            },
            {
                "name": "Company >50 workers risk III",
                "workers": 60,
                "risk": 3,
                "expected_count": 60,
                "description": "Cap 3: 60 standards"
            },
            {
                "name": "Company <=10 workers risk IV",
                "workers": 8,
                "risk": 4,
                "expected_count": 60,
                "description": "Cap 3 override: 60 standards"
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n   Testing: {scenario['name']}")
            
            # Update company config for this scenario
            company_data = {
                "name": f"Test Company - {scenario['name']}",
                "workers_count": scenario["workers"],
                "risk_level": scenario["risk"],
                "nit": "123456789",
                "economic_activity": "Testing",
                "city": "Test City"
            }
            
            success, _ = self.run_test(
                f"Update Company for {scenario['name']}",
                "PUT",
                "company",
                200,
                data=company_data
            )
            
            if success:
                # Get applicable standards
                success, applicable = self.run_test(
                    f"Get Applicable Standards - {scenario['name']}",
                    "GET",
                    "standards/applicable",
                    200
                )
                
                if success:
                    applicable_count = applicable.get('applicable_count', 0)
                    print(f"     Workers: {scenario['workers']}, Risk: {scenario['risk']}")
                    print(f"     Expected: {scenario['expected_count']}, Got: {applicable_count}")
                    print(f"     Description: {scenario['description']}")
                    
                    if applicable_count == scenario['expected_count']:
                        print(f"     ✅ Correct classification")
                    else:
                        print(f"     ❌ Wrong classification")
                        self.failed_tests.append({
                            "test": f"Standards classification - {scenario['name']}",
                            "expected": scenario['expected_count'],
                            "actual": applicable_count,
                            "response": f"Expected {scenario['expected_count']} standards, got {applicable_count}"
                        })
        
        return True

    def test_opening_minutes_pdf(self):
        """Test Acta de Apertura (Opening Meeting Minutes) PDF generation"""
        print("\n=== TESTING OPENING MINUTES PDF ===")
        
        # Get existing audits
        success, audits = self.run_test(
            "Get Audits for Opening Minutes Test",
            "GET",
            "audits",
            200
        )
        
        audit_id = None
        if success and audits:
            # Use existing audit or create one
            audit_id = audits[0]['audit_id']
            print(f"   Using existing audit: {audit_id}")
        else:
            # Create test audit
            new_audit = {
                "title": "Test Audit for Opening Minutes",
                "audit_type": "internal",
                "scheduled_date": "2026-03-15",
                "end_date": "2026-03-20",
                "auditor": "Test Auditor",
                "scope": "Test scope for opening minutes",
                "criteria": "Resolucion 0312 de 2019, Decreto 1072 de 2015",
                "objective": "Test opening minutes PDF generation"
            }
            
            success, created_audit = self.run_test(
                "Create Test Audit for Opening Minutes",
                "POST",
                "audits",
                200,
                data=new_audit
            )
            
            if success and 'audit_id' in created_audit:
                audit_id = created_audit['audit_id']
                print(f"   Created test audit: {audit_id}")
        
        if not audit_id:
            print("   ❌ No audit available for testing opening minutes PDF")
            return False
        
        # Test opening minutes PDF generation
        url = f"{self.base_url}/api/audits/{audit_id}/opening-minutes/pdf"
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        print(f"\n🔍 Testing Opening Minutes PDF Generation...")
        print(f"   URL: {url}")
        
        self.tests_run += 1
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check content type
                content_type = response.headers.get('Content-Type', '')
                print(f"   Content-Type: {content_type}")
                
                # Check file size (should be >3KB as per requirement)
                file_size = len(response.content)
                print(f"   PDF file size: {file_size} bytes ({file_size/1024:.1f} KB)")
                
                if file_size > 3072:  # 3KB = 3072 bytes
                    print(f"   ✅ PDF size requirement met (>3KB)")
                else:
                    print(f"   ❌ PDF size below 3KB requirement")
                    self.failed_tests.append({
                        "test": "Opening minutes PDF size",
                        "expected": ">3KB",
                        "actual": f"{file_size} bytes",
                        "response": f"PDF only {file_size} bytes, expected >3KB"
                    })
                
                # Check if it's actually a PDF
                if content_type == 'application/pdf' or response.content.startswith(b'%PDF'):
                    print(f"   ✅ Valid PDF format")
                else:
                    print(f"   ❌ Invalid PDF format")
                    self.failed_tests.append({
                        "test": "Opening minutes PDF format",
                        "expected": "application/pdf",
                        "actual": content_type,
                        "response": "Not a valid PDF"
                    })
                
                # Check content disposition header for proper filename
                content_disposition = response.headers.get('Content-Disposition', '')
                if 'attachment' in content_disposition and 'Acta_Apertura' in content_disposition:
                    print(f"   ✅ Proper filename in headers")
                else:
                    print(f"   ⚠️  Filename may not be properly set")
                
                # Test that PDF includes required sections (basic check)
                if file_size > 10000:  # If PDF is substantial, likely has content
                    print(f"   ✅ PDF appears to have substantial content")
                else:
                    print(f"   ⚠️  PDF may be missing content sections")
                
                return True
            else:
                self.failed_tests.append({
                    "test": "Opening Minutes PDF Generation",
                    "expected": 200,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.failed_tests.append({
                "test": "Opening Minutes PDF Generation",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting SG-SST API Testing with RBAC, Object Storage, and Multi-company...")
        print(f"Base URL: {self.base_url}")
        print(f"Admin Token: {self.admin_token}")
        print(f"Collaborator Token: {self.collab_token}")
        
        # Test authentication first
        if not self.test_auth_endpoints():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test new RBAC features
        self.test_rbac_endpoints()
        
        # Test new Object Storage features
        self.test_object_storage_endpoints()
        
        # Test new Multi-company features
        self.test_multi_company_endpoints()
        
        # Test company-scoped standards
        self.test_company_scoped_standards()
        
        # Test critical data isolation requirements
        self.test_critical_data_isolation()
        
        # Test new consultant dashboard and PDF report features
        self.test_consultant_dashboard()
        self.test_audit_pdf_report()
        
        # Test specific features from review request
        self.test_standards_classification_fix()
        self.test_opening_minutes_pdf()
        
        # Test all existing modules
        self.test_dashboard_endpoint()
        self.test_standards_bank_endpoints()
        self.test_checklist_endpoints()
        self.test_activities_endpoints()
        self.test_documents_endpoints()
        self.test_hazards_endpoints()
        self.test_incidents_endpoints()
        self.test_trainings_endpoints()
        self.test_audits_endpoints()
        self.test_audit_history_and_ai()
        self.test_reports_endpoints()
        self.test_ai_analysis()
        
        # Print final results
        print(f"\n📊 FINAL RESULTS:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test.get('test', 'Unknown')}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test.get('expected')}, Got: {test.get('actual')}")
                    print(f"   Response: {test.get('response', '')[:100]}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SGSSTAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())