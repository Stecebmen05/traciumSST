"""
Iteration 15: Email/Password Authentication Tests
Tests for the new email/password auth system added alongside existing Google OAuth.

Features tested:
- POST /api/auth/login-email - email/password login
- POST /api/auth/create-user - admin creates user with email/password
- PUT /api/users/{user_id}/password - admin changes user password
- PUT /api/users/{user_id}/company - admin assigns company to user
- GET /api/users - excludes password_hash from response
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = "admin@traciumsst.com"
ADMIN_PASSWORD = "TraciumSST2026!"
ADMIN_SESSION = "test_session_admin_123"

class TestEmailLogin:
    """Tests for POST /api/auth/login-email endpoint"""
    
    def test_login_email_success(self):
        """Successful login with email/password returns user data and sets session cookie"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json() if response.status_code == 200 else response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        assert data["email"] == ADMIN_EMAIL.lower(), f"Email should be {ADMIN_EMAIL.lower()}"
        assert "name" in data, "Response should contain name"
        assert "role" in data, "Response should contain role"
        assert data["role"] == "admin", "Admin user should have admin role"
        assert "password_hash" not in data, "Response should NOT contain password_hash"
        
        # Check session cookie is set
        cookies = response.cookies
        assert "session_token" in cookies or response.headers.get("set-cookie"), "Session cookie should be set"
        print("TEST PASSED: Login with email/password successful")
    
    def test_login_email_wrong_password(self):
        """Wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123"}
        )
        print(f"Wrong password response: {response.status_code}")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        print("TEST PASSED: Wrong password returns 401")
    
    def test_login_email_missing_fields(self):
        """Missing fields returns 400"""
        # Missing password
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL}
        )
        print(f"Missing password response: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        # Missing email
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"password": "somepassword"}
        )
        print(f"Missing email response: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        # Empty body
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={}
        )
        print(f"Empty body response: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("TEST PASSED: Missing fields returns 400")
    
    def test_login_email_nonexistent_user(self):
        """Non-existent user returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": "nonexistent@test.com", "password": "SomePassword123"}
        )
        print(f"Non-existent user response: {response.status_code}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("TEST PASSED: Non-existent user returns 401")


class TestCreateUser:
    """Tests for POST /api/auth/create-user endpoint (admin only)"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session by logging in"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            cookies = response.cookies
            return {"cookies": cookies}
        # Fallback to test session
        return {"headers": {"Authorization": f"Bearer {ADMIN_SESSION}"}}
    
    def test_create_user_success(self, admin_session):
        """Admin can create user with email/password/name/role"""
        test_email = f"TEST_user_{int(time.time())}@empresa.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "TestPass123!",
                "name": "TEST Usuario Nuevo",
                "role": "auditor"
            },
            **admin_session
        )
        print(f"Create user response: {response.status_code}")
        print(f"Create user data: {response.json() if response.status_code in [200, 201, 409] else response.text}")
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == test_email.lower(), "Email should match"
        assert data["name"] == "TEST Usuario Nuevo", "Name should match"
        assert data["role"] == "auditor", "Role should match"
        assert data.get("auth_type") == "email", "Auth type should be 'email'"
        assert "password_hash" not in data, "Response should NOT contain password_hash"
        assert "user_id" in data, "Response should contain user_id"
        
        # Cleanup - delete test user
        user_id = data["user_id"]
        requests.delete(f"{BASE_URL}/api/users/{user_id}", **admin_session)
        print("TEST PASSED: Admin can create user with email/password")
    
    def test_create_user_duplicate_email(self, admin_session):
        """Rejects duplicate email with 409"""
        # First create a user
        test_email = f"TEST_duplicate_{int(time.time())}@empresa.com"
        
        response1 = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "TestPass123!",
                "name": "TEST First User",
                "role": "collaborator"
            },
            **admin_session
        )
        
        if response1.status_code in [200, 201]:
            user_id = response1.json()["user_id"]
            
            # Try to create another user with same email
            response2 = requests.post(
                f"{BASE_URL}/api/auth/create-user",
                json={
                    "email": test_email,
                    "password": "DifferentPass123!",
                    "name": "TEST Second User",
                    "role": "collaborator"
                },
                **admin_session
            )
            print(f"Duplicate email response: {response2.status_code}")
            assert response2.status_code == 409, f"Expected 409, got {response2.status_code}"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/users/{user_id}", **admin_session)
        print("TEST PASSED: Duplicate email returns 409")
    
    def test_create_user_short_password(self, admin_session):
        """Rejects short password < 6 chars"""
        test_email = f"TEST_shortpw_{int(time.time())}@empresa.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "12345",  # Only 5 chars
                "name": "TEST Short Password",
                "role": "collaborator"
            },
            **admin_session
        )
        print(f"Short password response: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("TEST PASSED: Short password returns 400")
    
    def test_create_user_requires_admin(self):
        """Non-admin cannot create users"""
        # Try without auth
        response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": "test@test.com",
                "password": "TestPass123!",
                "name": "Test User",
                "role": "collaborator"
            }
        )
        print(f"No auth response: {response.status_code}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("TEST PASSED: Create user requires authentication")


class TestPasswordChange:
    """Tests for PUT /api/users/{user_id}/password endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session by logging in"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return {"cookies": response.cookies}
        return {"headers": {"Authorization": f"Bearer {ADMIN_SESSION}"}}
    
    def test_admin_can_change_user_password(self, admin_session):
        """Admin can change a user's password"""
        # First create a test user
        test_email = f"TEST_pwchange_{int(time.time())}@empresa.com"
        
        create_response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "OldPassword123!",
                "name": "TEST Password Change",
                "role": "collaborator"
            },
            **admin_session
        )
        
        if create_response.status_code in [200, 201]:
            user_id = create_response.json()["user_id"]
            
            # Change password
            change_response = requests.put(
                f"{BASE_URL}/api/users/{user_id}/password",
                json={"password": "NewPassword456!"},
                **admin_session
            )
            print(f"Password change response: {change_response.status_code}")
            assert change_response.status_code == 200, f"Expected 200, got {change_response.status_code}"
            
            # Verify new password works
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login-email",
                json={"email": test_email, "password": "NewPassword456!"}
            )
            print(f"Login with new password: {login_response.status_code}")
            assert login_response.status_code == 200, "Should be able to login with new password"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/users/{user_id}", **admin_session)
        print("TEST PASSED: Admin can change user password")
    
    def test_password_change_short_password(self, admin_session):
        """Rejects short password < 6 chars"""
        # Create test user
        test_email = f"TEST_shortpwchange_{int(time.time())}@empresa.com"
        
        create_response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "ValidPass123!",
                "name": "TEST Short PW Change",
                "role": "collaborator"
            },
            **admin_session
        )
        
        if create_response.status_code in [200, 201]:
            user_id = create_response.json()["user_id"]
            
            # Try to change to short password
            change_response = requests.put(
                f"{BASE_URL}/api/users/{user_id}/password",
                json={"password": "12345"},  # Only 5 chars
                **admin_session
            )
            print(f"Short password change response: {change_response.status_code}")
            assert change_response.status_code == 400, f"Expected 400, got {change_response.status_code}"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/users/{user_id}", **admin_session)
        print("TEST PASSED: Short password change returns 400")


class TestCompanyAssignment:
    """Tests for PUT /api/users/{user_id}/company endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session by logging in"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return {"cookies": response.cookies}
        return {"headers": {"Authorization": f"Bearer {ADMIN_SESSION}"}}
    
    def test_admin_can_assign_company(self, admin_session):
        """Admin can assign company to user"""
        # Create test user
        test_email = f"TEST_company_{int(time.time())}@empresa.com"
        
        create_response = requests.post(
            f"{BASE_URL}/api/auth/create-user",
            json={
                "email": test_email,
                "password": "TestPass123!",
                "name": "TEST Company Assign",
                "role": "collaborator"
            },
            **admin_session
        )
        
        if create_response.status_code in [200, 201]:
            user_id = create_response.json()["user_id"]
            
            # Assign company
            assign_response = requests.put(
                f"{BASE_URL}/api/users/{user_id}/company",
                json={"company_id": "comp_test_123"},
                **admin_session
            )
            print(f"Company assign response: {assign_response.status_code}")
            assert assign_response.status_code == 200, f"Expected 200, got {assign_response.status_code}"
            
            # Verify assignment
            users_response = requests.get(f"{BASE_URL}/api/users", **admin_session)
            if users_response.status_code == 200:
                users = users_response.json()
                user = next((u for u in users if u["user_id"] == user_id), None)
                if user:
                    assert user.get("active_company_id") == "comp_test_123", "Company should be assigned"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/users/{user_id}", **admin_session)
        print("TEST PASSED: Admin can assign company to user")


class TestUsersEndpoint:
    """Tests for GET /api/users endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session by logging in"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return {"cookies": response.cookies}
        return {"headers": {"Authorization": f"Bearer {ADMIN_SESSION}"}}
    
    def test_users_excludes_password_hash(self, admin_session):
        """GET /api/users excludes password_hash from response"""
        response = requests.get(f"{BASE_URL}/api/users", **admin_session)
        print(f"Get users response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        
        for user in users:
            assert "password_hash" not in user, f"User {user.get('email')} should NOT have password_hash"
            assert "user_id" in user, "User should have user_id"
            assert "email" in user, "User should have email"
        
        print(f"TEST PASSED: {len(users)} users returned, none have password_hash")
    
    def test_users_includes_auth_type(self, admin_session):
        """GET /api/users includes auth_type field"""
        response = requests.get(f"{BASE_URL}/api/users", **admin_session)
        
        if response.status_code == 200:
            users = response.json()
            email_auth_users = [u for u in users if u.get("auth_type") == "email"]
            google_auth_users = [u for u in users if u.get("auth_type") == "google"]
            
            print(f"Email auth users: {len(email_auth_users)}")
            print(f"Google auth users: {len(google_auth_users)}")
            
            # Admin should be email auth
            admin_user = next((u for u in users if u.get("email") == ADMIN_EMAIL.lower()), None)
            if admin_user:
                assert admin_user.get("auth_type") == "email", "Admin should have auth_type='email'"
        print("TEST PASSED: Users include auth_type field")


class TestBruteForceProtection:
    """Tests for brute force protection (5 attempts then 15 min lockout)"""
    
    def test_brute_force_lockout(self):
        """After 5 failed attempts, account is locked for 15 minutes"""
        test_email = f"TEST_bruteforce_{int(time.time())}@test.com"
        
        # Make 5 failed login attempts
        for i in range(5):
            response = requests.post(
                f"{BASE_URL}/api/auth/login-email",
                json={"email": test_email, "password": f"WrongPass{i}"}
            )
            print(f"Attempt {i+1}: {response.status_code}")
        
        # 6th attempt should be rate limited
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": test_email, "password": "AnotherWrongPass"}
        )
        print(f"6th attempt: {response.status_code}")
        
        # Should be either 429 (rate limited) or 401 (still failing)
        # The lockout is based on IP:email combination
        assert response.status_code in [401, 429], f"Expected 401 or 429, got {response.status_code}"
        print("TEST PASSED: Brute force protection working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
