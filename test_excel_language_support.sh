#!/bin/bash

# Test Excel Export with Language Support
# This script verifies that Excel exports are now available in both English and Japanese

echo "=========================================="
echo "Excel Export Language Support Test"
echo "=========================================="
echo ""

# Get a valid token for testing
echo "Step 1: Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=manager1&password=manager123" | python -c "import sys, json; data=json.load(sys.stdin); print(data['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token. Make sure the backend is running."
  exit 1
fi

echo "✓ Token obtained"
echo ""

# Test 1: Export monthly attendance in English
echo "Step 2: Testing monthly attendance export in English..."
curl -s -X GET "http://localhost:8000/attendance/export/monthly?department_id=1&year=2025&month=12&language=en" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_monthly_en.xlsx

if [ -f /tmp/test_monthly_en.xlsx ] && [ -s /tmp/test_monthly_en.xlsx ]; then
  echo "✓ English monthly export successful ($(du -h /tmp/test_monthly_en.xlsx | cut -f1))"
else
  echo "❌ English monthly export failed"
fi

# Test 2: Export monthly attendance in Japanese
echo "Step 3: Testing monthly attendance export in Japanese..."
curl -s -X GET "http://localhost:8000/attendance/export/monthly?department_id=1&year=2025&month=12&language=ja" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_monthly_ja.xlsx

if [ -f /tmp/test_monthly_ja.xlsx ] && [ -s /tmp/test_monthly_ja.xlsx ]; then
  echo "✓ Japanese monthly export successful ($(du -h /tmp/test_monthly_ja.xlsx | cut -f1))"
else
  echo "❌ Japanese monthly export failed"
fi

# Test 3: Export employee monthly in English
echo "Step 4: Testing employee monthly export in English..."
curl -s -X GET "http://localhost:8000/attendance/export/employee-monthly?year=2025&month=12&language=en" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_employee_en.xlsx

if [ -f /tmp/test_employee_en.xlsx ] && [ -s /tmp/test_employee_en.xlsx ]; then
  echo "✓ English employee export successful ($(du -h /tmp/test_employee_en.xlsx | cut -f1))"
else
  echo "❌ English employee export failed"
fi

# Test 4: Export employee monthly in Japanese
echo "Step 5: Testing employee monthly export in Japanese..."
curl -s -X GET "http://localhost:8000/attendance/export/employee-monthly?year=2025&month=12&language=ja" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/test_employee_ja.xlsx

if [ -f /tmp/test_employee_ja.xlsx ] && [ -s /tmp/test_employee_ja.xlsx ]; then
  echo "✓ Japanese employee export successful ($(du -h /tmp/test_employee_ja.xlsx | cut -f1))"
else
  echo "❌ Japanese employee export failed"
fi

echo ""
echo "=========================================="
echo "All tests completed!"
echo "=========================================="
