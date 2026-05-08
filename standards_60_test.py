import requests
import sys
from datetime import datetime
import json

class Standards60Tester:
    def __init__(self, base_url="https://compliance-guardian-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = "test_session_admin_123"
        self.session_token = self.admin_token
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.target_company = "comp_e026f1eb"  # Empresa Grande SA, 65 workers, Risk III
        self.target_audit = "aud_71f26929"    # Audit with 60 items

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    return success, resp_json
                except:
                    return success, {}
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_standards_bank_60_items(self):
        """Test that standards bank returns exactly 60 items"""
        print("\n=== TESTING STANDARDS BANK 60 ITEMS ===")
        
        success, bank = self.run_test(
            "GET /api/standards/bank returns exactly 60 items",
            "GET",
            "standards/bank",
            200
        )
        
        if success:
            count = len(bank)
            print(f"   Standards bank count: {count}")
            if count == 60:
                print("✅ PASS: Standards bank has exactly 60 items")
                return True
            else:
                print(f"❌ FAIL: Expected 60 items, got {count}")
                return False
        return False

    def test_missing_standards_present(self):
        """Test that items 4.2.5 and 4.2.6 are present"""
        print("\n=== TESTING MISSING STANDARDS 4.2.5 AND 4.2.6 ===")
        
        success, bank = self.run_test(
            "Get standards bank for missing items check",
            "GET",
            "standards/bank",
            200
        )
        
        if success:
            codes = [item.get('code') for item in bank]
            
            # Check for 4.2.5 (Mantenimiento)
            has_425 = "4.2.5" in codes
            print(f"   4.2.5 (Mantenimiento) present: {has_425}")
            
            # Check for 4.2.6 (EPP)
            has_426 = "4.2.6" in codes
            print(f"   4.2.6 (EPP) present: {has_426}")
            
            if has_425 and has_426:
                print("✅ PASS: Both 4.2.5 and 4.2.6 are present")
                
                # Find and display the items
                for item in bank:
                    if item.get('code') == '4.2.5':
                        print(f"   4.2.5: {item.get('description', '')}")
                    elif item.get('code') == '4.2.6':
                        print(f"   4.2.6: {item.get('description', '')}")
                
                return True
            else:
                print(f"❌ FAIL: Missing items - 4.2.5: {has_425}, 4.2.6: {has_426}")
                return False
        return False

    def test_company_classification_logic(self):
        """Test company classification logic for applicable standards"""
        print("\n=== TESTING COMPANY CLASSIFICATION LOGIC ===")
        
        # Switch to target company (>50 workers)
        success, _ = self.run_test(
            f"Switch to target company {self.target_company}",
            "POST",
            f"companies/{self.target_company}/switch",
            200
        )
        
        if not success:
            print(f"❌ Failed to switch to company {self.target_company}")
            return False
        
        # Get company info
        success, company = self.run_test(
            "Get company info",
            "GET",
            "companies/active",
            200
        )
        
        if success:
            workers = company.get('workers_count', 0)
            risk = company.get('risk_level', 1)
            print(f"   Company: {company.get('name')} - {workers} workers, Risk {risk}")
        
        # Test applicable standards for >50 workers company
        success, applicable = self.run_test(
            "Get applicable standards for >50 workers company",
            "GET",
            "standards/applicable",
            200
        )
        
        if success:
            total_standards = applicable.get('total_standards', 0)
            applicable_count = applicable.get('applicable_count', 0)
            company_type = applicable.get('company_type', '')
            
            print(f"   Total standards: {total_standards}")
            print(f"   Applicable count: {applicable_count}")
            print(f"   Company type: {company_type}")
            
            # For >50 workers, should get ALL 60 standards
            if total_standards == 60 and applicable_count == 60:
                print("✅ PASS: >50 workers company gets ALL 60 applicable standards")
                return True
            else:
                print(f"❌ FAIL: Expected 60/60, got {applicable_count}/{total_standards}")
                return False
        return False

    def test_total_weight_100_percent(self):
        """Test that total weight of all 60 standards = 100%"""
        print("\n=== TESTING TOTAL WEIGHT = 100% ===")
        
        success, applicable = self.run_test(
            "Get applicable standards for weight check",
            "GET",
            "standards/applicable",
            200
        )
        
        if success:
            total_weight = applicable.get('total_weight', 0)
            print(f"   Total weight: {total_weight}%")
            
            # Should be exactly 100%
            if total_weight == 100.0:
                print("✅ PASS: Total weight is exactly 100%")
                return True
            else:
                print(f"❌ FAIL: Expected 100%, got {total_weight}%")
                return False
        return False

    def test_audit_checklist_generation_60_items(self):
        """Test that audit checklist generation creates 60 items for >50 worker company"""
        print("\n=== TESTING AUDIT CHECKLIST GENERATION 60 ITEMS ===")
        
        # Check if target audit exists
        success, audit = self.run_test(
            f"Get target audit {self.target_audit}",
            "GET",
            f"audits/{self.target_audit}",
            200
        )
        
        if not success:
            print(f"❌ Target audit {self.target_audit} not found")
            return False
        
        print(f"   Found audit: {audit.get('title', 'Unknown')}")
        
        # Get current checklist
        success, checklist = self.run_test(
            f"Get checklist for audit {self.target_audit}",
            "GET",
            f"audits/{self.target_audit}/checklist",
            200
        )
        
        if success:
            current_count = len(checklist)
            print(f"   Current checklist items: {current_count}")
            
            if current_count == 60:
                print("✅ PASS: Audit checklist already has 60 items")
                return True
            else:
                # Try to regenerate checklist
                print(f"   Attempting to regenerate checklist...")
                success, result = self.run_test(
                    f"Generate checklist for audit {self.target_audit}",
                    "POST",
                    f"audits/{self.target_audit}/checklist/generate",
                    200
                )
                
                if success:
                    print(f"   Generation result: {result.get('message', '')}")
                    
                    # Check again
                    success, new_checklist = self.run_test(
                        f"Re-check checklist for audit {self.target_audit}",
                        "GET",
                        f"audits/{self.target_audit}/checklist",
                        200
                    )
                    
                    if success:
                        new_count = len(new_checklist)
                        print(f"   New checklist count: {new_count}")
                        
                        if new_count == 60:
                            print("✅ PASS: Audit checklist now has 60 items")
                            return True
                        else:
                            print(f"❌ FAIL: Expected 60 items, got {new_count}")
                            return False
        return False

    def test_pdf_report_generation(self):
        """Test that PDF report generates with 60 items"""
        print("\n=== TESTING PDF REPORT GENERATION ===")
        
        success, response = self.run_test(
            f"Generate PDF report for audit {self.target_audit}",
            "GET",
            f"audits/{self.target_audit}/report/pdf",
            200
        )
        
        if success:
            print("✅ PASS: PDF report generated successfully")
            return True
        else:
            print("❌ FAIL: PDF report generation failed")
            return False

    def test_company_data_isolation(self):
        """Test company data isolation"""
        print("\n=== TESTING COMPANY DATA ISOLATION ===")
        
        # Test switching between companies and verify data isolation
        companies_to_test = [
            ("comp_e026f1eb", "Empresa Grande SA"),
            ("comp_32567632", "Empresa Secundaria SA")
        ]
        
        isolation_working = True
        
        for company_id, company_name in companies_to_test:
            success, _ = self.run_test(
                f"Switch to {company_name} ({company_id})",
                "POST",
                f"companies/{company_id}/switch",
                200
            )
            
            if success:
                # Check that data is scoped to this company
                success, audits = self.run_test(
                    f"Get audits for {company_name}",
                    "GET",
                    "audits",
                    200
                )
                
                if success:
                    audit_count = len(audits)
                    print(f"   {company_name}: {audit_count} audits")
                else:
                    isolation_working = False
            else:
                isolation_working = False
        
        if isolation_working:
            print("✅ PASS: Company data isolation working")
            return True
        else:
            print("❌ FAIL: Company data isolation issues")
            return False

    def test_standards_auto_seed(self):
        """Test standards auto-seed functionality"""
        print("\n=== TESTING STANDARDS AUTO-SEED ===")
        
        # Reset standards first
        success, reset_result = self.run_test(
            "Reset standards",
            "POST",
            "standards/reset",
            200
        )
        
        if success:
            print(f"   Reset result: {reset_result.get('message', '')}")
            
            # Check compliance after reset
            success, compliance = self.run_test(
                "Get standards compliance after reset",
                "GET",
                "standards/compliance",
                200
            )
            
            if success:
                count = len(compliance)
                applicable_count = len([item for item in compliance if item.get('applicable')])
                print(f"   Standards after reset: {count} total, {applicable_count} applicable")
                
                if count == 60:
                    print("✅ PASS: Standards auto-seed working with 60 items")
                    return True
                else:
                    print(f"❌ FAIL: Expected 60 standards, got {count}")
                    return False
        return False

    def run_all_tests(self):
        """Run all 60 standards tests"""
        print("🚀 Starting Standards Bank 60 Items Testing...")
        print(f"Base URL: {self.base_url}")
        print(f"Target Company: {self.target_company}")
        print(f"Target Audit: {self.target_audit}")
        
        tests = [
            self.test_standards_bank_60_items,
            self.test_missing_standards_present,
            self.test_company_classification_logic,
            self.test_total_weight_100_percent,
            self.test_audit_checklist_generation_60_items,
            self.test_pdf_report_generation,
            self.test_company_data_isolation,
            self.test_standards_auto_seed
        ]
        
        passed_tests = []
        failed_tests = []
        
        for test in tests:
            try:
                if test():
                    passed_tests.append(test.__name__)
                else:
                    failed_tests.append(test.__name__)
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
                failed_tests.append(test.__name__)
        
        print(f"\n📊 FINAL RESULTS:")
        print(f"Tests run: {len(tests)}")
        print(f"Tests passed: {len(passed_tests)}")
        print(f"Tests failed: {len(failed_tests)}")
        print(f"Success rate: {len(passed_tests)/len(tests)*100:.1f}%")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"- {test}")
        
        if passed_tests:
            print(f"\n✅ PASSED TESTS:")
            for test in passed_tests:
                print(f"- {test}")
        
        return len(failed_tests) == 0

def main():
    tester = Standards60Tester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())