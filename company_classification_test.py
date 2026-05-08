import requests
import sys
from datetime import datetime
import json

class CompanyClassificationTester:
    def __init__(self, base_url="https://compliance-guardian-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = "test_session_admin_123"
        self.session_token = self.admin_token
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
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
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_company(self, name, workers, risk_level):
        """Create a test company with specific parameters"""
        company_data = {
            "name": name,
            "workers_count": workers,
            "risk_level": risk_level,
            "nit": f"test-{workers}-{risk_level}",
            "economic_activity": "Testing",
            "city": "Test City"
        }
        
        success, company = self.run_test(
            f"Create test company: {name}",
            "POST",
            "companies",
            200,
            data=company_data
        )
        
        if success:
            return company.get('company_id')
        return None

    def test_company_classification_scenarios(self):
        """Test different company classification scenarios"""
        print("\n=== TESTING COMPANY CLASSIFICATION SCENARIOS ===")
        
        test_scenarios = [
            # (workers, risk_level, expected_applicable_count, description)
            (10, 1, "basic", "<=10 workers risk I-III → basic standards"),
            (10, 3, "basic", "<=10 workers risk I-III → basic standards"),
            (25, 2, "intermediate", "11-50 workers risk I-III → intermediate standards"),
            (50, 3, "intermediate", "11-50 workers risk I-III → intermediate standards"),
            (10, 4, "all_60", "<=10 workers risk IV → ALL 60 standards"),
            (25, 5, "all_60", "11-50 workers risk V → ALL 60 standards"),
            (51, 1, "all_60", ">50 workers any risk → ALL 60 standards"),
            (100, 2, "all_60", ">50 workers any risk → ALL 60 standards"),
        ]
        
        all_passed = True
        
        for workers, risk_level, expected_type, description in test_scenarios:
            print(f"\n--- Testing: {description} ---")
            
            # Create test company
            company_name = f"Test Company {workers}w R{risk_level}"
            company_id = self.create_test_company(company_name, workers, risk_level)
            
            if not company_id:
                print(f"❌ Failed to create test company")
                all_passed = False
                continue
            
            # Switch to test company
            success, _ = self.run_test(
                f"Switch to {company_name}",
                "POST",
                f"companies/{company_id}/switch",
                200
            )
            
            if not success:
                print(f"❌ Failed to switch to company")
                all_passed = False
                continue
            
            # Get applicable standards
            success, applicable = self.run_test(
                f"Get applicable standards for {company_name}",
                "GET",
                "standards/applicable",
                200
            )
            
            if success:
                applicable_count = applicable.get('applicable_count', 0)
                company_type = applicable.get('company_type', '')
                total_weight = applicable.get('total_weight', 0)
                
                print(f"   Workers: {workers}, Risk: {risk_level}")
                print(f"   Company type: {company_type}")
                print(f"   Applicable standards: {applicable_count}/60")
                print(f"   Total weight: {total_weight}%")
                
                # Validate results based on expected type
                if expected_type == "all_60":
                    if applicable_count == 60 and total_weight == 100.0:
                        print(f"✅ PASS: {description}")
                    else:
                        print(f"❌ FAIL: Expected 60/100%, got {applicable_count}/{total_weight}%")
                        all_passed = False
                elif expected_type == "basic":
                    # Basic standards should be less than 60
                    if applicable_count < 60 and company_type == "10_or_less":
                        print(f"✅ PASS: {description}")
                    else:
                        print(f"❌ FAIL: Expected basic standards (<60), got {applicable_count}")
                        all_passed = False
                elif expected_type == "intermediate":
                    # Intermediate standards should be between basic and 60
                    if applicable_count < 60 and company_type == "11_to_50":
                        print(f"✅ PASS: {description}")
                    else:
                        print(f"❌ FAIL: Expected intermediate standards (<60), got {applicable_count}")
                        all_passed = False
            else:
                all_passed = False
            
            # Clean up test company
            self.run_test(
                f"Delete test company {company_id}",
                "DELETE",
                f"companies/{company_id}",
                200
            )
        
        return all_passed

    def test_checklist_generation_different_companies(self):
        """Test checklist generation for different company types"""
        print("\n=== TESTING CHECKLIST GENERATION FOR DIFFERENT COMPANY TYPES ===")
        
        # Test with >50 workers company (should get 60 items)
        company_id = self.create_test_company("Large Test Company", 75, 2)
        if not company_id:
            return False
        
        # Switch to large company
        success, _ = self.run_test(
            "Switch to large company",
            "POST",
            f"companies/{company_id}/switch",
            200
        )
        
        if not success:
            return False
        
        # Create test audit
        audit_data = {
            "title": "Test Audit for Large Company",
            "audit_type": "internal",
            "scheduled_date": "2026-02-01",
            "auditor": "Test Auditor",
            "scope": "Complete SG-SST"
        }
        
        success, audit = self.run_test(
            "Create test audit for large company",
            "POST",
            "audits",
            200,
            data=audit_data
        )
        
        if not success:
            return False
        
        audit_id = audit.get('audit_id')
        
        # Generate checklist
        success, result = self.run_test(
            f"Generate checklist for large company audit",
            "POST",
            f"audits/{audit_id}/checklist/generate",
            200
        )
        
        if success:
            print(f"   Generation result: {result.get('message', '')}")
            
            # Check checklist count
            success, checklist = self.run_test(
                f"Get checklist for large company audit",
                "GET",
                f"audits/{audit_id}/checklist",
                200
            )
            
            if success:
                count = len(checklist)
                print(f"   Checklist items for >50 workers company: {count}")
                
                if count == 60:
                    print("✅ PASS: Large company gets 60 checklist items")
                    checklist_passed = True
                else:
                    print(f"❌ FAIL: Expected 60 items, got {count}")
                    checklist_passed = False
            else:
                checklist_passed = False
        else:
            checklist_passed = False
        
        # Clean up
        self.run_test(f"Delete test audit", "DELETE", f"audits/{audit_id}", 200)
        self.run_test(f"Delete test company", "DELETE", f"companies/{company_id}", 200)
        
        return checklist_passed

    def run_all_tests(self):
        """Run all company classification tests"""
        print("🚀 Starting Company Classification Testing...")
        print(f"Base URL: {self.base_url}")
        
        tests = [
            self.test_company_classification_scenarios,
            self.test_checklist_generation_different_companies
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
    tester = CompanyClassificationTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())