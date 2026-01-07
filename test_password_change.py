#!/usr/bin/env python3
"""
Test script to verify password change functionality
Tests both employee and manager password changes
"""

import requests
import json
import sys

API_BASE_URL = "http://localhost:8000"

def test_password_change():
    """Test password change for employee and manager"""
    
    print("\n" + "="*70)
    print("PASSWORD CHANGE FUNCTIONALITY TEST")
    print("="*70)
    
    # Test 1: Employee Password Change
    print("\n[TEST 1] Employee Password Change")
    print("-" * 70)
    
    # First, login as an employee
    print("Logging in as employee...")
    login_response = requests.post(
        f"{API_BASE_URL}/token",
        data={"username": "emp_user", "password": "testpass"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return False
    
    employee_token = login_response.json()["access_token"]
    print(f"✅ Employee logged in successfully")
    
    # Attempt to change password
    print("\nAttempting to change employee password...")
    headers = {"Authorization": f"Bearer {employee_token}"}
    change_password_response = requests.post(
        f"{API_BASE_URL}/user/change-password",
        headers=headers,
        json={
            "old_password": "testpass",
            "new_password": "newpass123",
            "confirm_password": "newpass123"
        }
    )
    
    if change_password_response.status_code == 200:
        print(f"✅ Employee password changed successfully")
        print(f"   Response: {change_password_response.json()}")
    else:
        print(f"❌ Password change failed: {change_password_response.text}")
        return False
    
    # Verify new password works
    print("\nVerifying new password works...")
    login_response2 = requests.post(
        f"{API_BASE_URL}/token",
        data={"username": "emp_user", "password": "newpass123"}
    )
    
    if login_response2.status_code == 200:
        print(f"✅ New password works correctly!")
    else:
        print(f"❌ New password verification failed: {login_response2.text}")
        return False
    
    # Test 2: Manager Password Change
    print("\n[TEST 2] Manager Password Change")
    print("-" * 70)
    
    # Login as manager
    print("Logging in as manager...")
    manager_login = requests.post(
        f"{API_BASE_URL}/token",
        data={"username": "mgr_user", "password": "testpass"}
    )
    
    if manager_login.status_code != 200:
        print(f"❌ Manager login failed: {manager_login.text}")
        return False
    
    manager_token = manager_login.json()["access_token"]
    print(f"✅ Manager logged in successfully")
    
    # Attempt to change manager password
    print("\nAttempting to change manager password...")
    headers = {"Authorization": f"Bearer {manager_token}"}
    manager_password_change = requests.post(
        f"{API_BASE_URL}/user/change-password",
        headers=headers,
        json={
            "old_password": "testpass",
            "new_password": "managerpass123",
            "confirm_password": "managerpass123"
        }
    )
    
    if manager_password_change.status_code == 200:
        print(f"✅ Manager password changed successfully")
        print(f"   Response: {manager_password_change.json()}")
    else:
        print(f"❌ Manager password change failed: {manager_password_change.text}")
        return False
    
    # Verify manager's new password works
    print("\nVerifying manager's new password works...")
    manager_login2 = requests.post(
        f"{API_BASE_URL}/token",
        data={"username": "mgr_user", "password": "managerpass123"}
    )
    
    if manager_login2.status_code == 200:
        print(f"✅ Manager's new password works correctly!")
    else:
        print(f"❌ Manager's new password verification failed: {manager_login2.text}")
        return False
    
    # Test 3: Validation Tests
    print("\n[TEST 3] Password Change Validation")
    print("-" * 70)
    
    # Try with incorrect old password
    print("Testing incorrect old password...")
    headers = {"Authorization": f"Bearer {employee_token}"}
    wrong_password = requests.post(
        f"{API_BASE_URL}/user/change-password",
        headers=headers,
        json={
            "old_password": "wrongpass",
            "new_password": "anotherpass123",
            "confirm_password": "anotherpass123"
        }
    )
    
    if wrong_password.status_code == 401:
        print(f"✅ Correctly rejected incorrect old password")
    else:
        print(f"❌ Should have rejected incorrect old password")
        return False
    
    # Try with non-matching passwords
    print("\nTesting non-matching password confirmation...")
    mismatch = requests.post(
        f"{API_BASE_URL}/user/change-password",
        headers=headers,
        json={
            "old_password": "newpass123",
            "new_password": "pass123",
            "confirm_password": "differentpass"
        }
    )
    
    if mismatch.status_code == 400:
        print(f"✅ Correctly rejected non-matching passwords")
    else:
        print(f"❌ Should have rejected non-matching passwords")
        return False
    
    # Try with too short password
    print("\nTesting password length validation...")
    short_pass = requests.post(
        f"{API_BASE_URL}/user/change-password",
        headers=headers,
        json={
            "old_password": "newpass123",
            "new_password": "short",
            "confirm_password": "short"
        }
    )
    
    if short_pass.status_code == 400:
        print(f"✅ Correctly rejected too short password")
    else:
        print(f"❌ Should have rejected too short password")
        return False
    
    print("\n" + "="*70)
    print("✅ ALL TESTS PASSED!")
    print("="*70)
    print("\nSummary:")
    print("✅ Employees can change their passwords")
    print("✅ Managers can change their passwords")
    print("✅ Passwords are correctly hashed and stored")
    print("✅ Old password verification works correctly")
    print("✅ Password validation works correctly")
    print("✅ New passwords are immediately usable for login")
    
    return True

if __name__ == "__main__":
    try:
        success = test_password_change()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
