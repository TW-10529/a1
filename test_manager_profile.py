#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_manager_profile():
    """Test the manager profile endpoint"""
    
    # First, login as a manager
    print("=" * 60)
    print("MANAGER PROFILE ENDPOINT TEST")
    print("=" * 60)
    
    # Test 1: Get auth token for manager
    print("\n1. Testing manager login...")
    login_data = {
        "username": "manager1",
        "password": "manager123"
    }
    
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return False
    
    token = response.json().get("access_token")
    user_type = response.json().get("user_type")
    print(f"✓ Login successful")
    print(f"  User Type: {user_type}")
    print(f"  Token: {token[:20]}...")
    
    # Test 2: Get manager profile
    print("\n2. Testing /manager/profile endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/manager/profile", headers=headers)
    if response.status_code != 200:
        print(f"❌ Profile fetch failed: {response.status_code}")
        print(response.text)
        return False
    
    profile = response.json()
    print(f"✓ Profile fetched successfully")
    print(f"\nProfile Details:")
    print(f"  Manager ID: {profile.get('manager_id')}")
    print(f"  Full Name: {profile.get('full_name')}")
    print(f"  Username: {profile.get('username')}")
    print(f"  Email: {profile.get('email')}")
    print(f"  Department: {profile.get('department_name')}")
    print(f"  Status: {'Active' if profile.get('is_active') else 'Inactive'}")
    print(f"  Created At: {profile.get('created_at')}")
    print(f"  Updated At: {profile.get('updated_at')}")
    
    # Test 3: Password change for manager
    print("\n3. Testing password change for manager...")
    old_password = "manager123"
    new_password = "newpassword123"
    
    password_data = {
        "old_password": old_password,
        "new_password": new_password,
        "confirm_password": new_password
    }
    
    response = requests.post(f"{BASE_URL}/user/change-password", json=password_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Password change failed: {response.status_code}")
        print(response.text)
        return False
    
    print(f"✓ Password changed successfully")
    print(f"  Response: {response.json()}")
    
    # Test 4: Try login with new password
    print("\n4. Testing login with new password...")
    login_data = {
        "username": "manager1",
        "password": new_password
    }
    
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code != 200:
        print(f"❌ Login with new password failed: {response.status_code}")
        print(response.text)
        return False
    
    print(f"✓ Login with new password successful")
    
    # Test 5: Reset password back
    print("\n5. Resetting password back...")
    new_token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {new_token}"}
    
    password_data = {
        "old_password": new_password,
        "new_password": old_password,
        "confirm_password": old_password
    }
    
    response = requests.post(f"{BASE_URL}/user/change-password", json=password_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Password reset failed: {response.status_code}")
        print(response.text)
        return False
    
    print(f"✓ Password reset successful")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = test_manager_profile()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Test error: {e}")
        sys.exit(1)
