# Individual Employee Monthly Report Download - TROUBLESHOOTING GUIDE

## ✅ The Good News
The download feature **IS WORKING CORRECTLY** in the backend. The issue is an **authorization check** that prevents downloading reports for employees outside your department.

## ❌ The Problem

You're getting an error because you're trying to download a report for an employee who is **NOT in your department**.

### Error Message:
```
403: Can only download reports for employees in your department
```

## ✅ The Solution

### Step 1: Check Your Department
When you login as a Manager, you manage a specific department:
- **Manager1** → IT Department
- **Manager2** → HR Department  
- **Manager3** → Finance Department

### Step 2: Get an Employee ID from YOUR Department

**If you're Manager1 (IT Department)**, use one of these employees:
- EMP006
- EMP007
- EMP008
- EMP009
- EMP010

**If you're Manager2 (HR Department)**, use one of these employees:
- EMP011
- EMP012
- EMP013
- EMP014
- EMP015

**If you're Manager3 (Finance Department)**, use one of these employees:
- EMP021
- EMP022
- EMP023
- EMP024
- EMP025

### Step 3: Download the Report

1. Login as **your manager account** (e.g., manager1)
2. Go to **Attendance** section
3. In "**Download Individual Employee Monthly Report**" box:
   - **Employee ID**: Enter an employee from YOUR department (e.g., EMP006)
   - **Month**: Select month (e.g., January)
   - **Year**: Select year (e.g., 2026)
4. Click **"Download Individual Employee Monthly Report"** button
5. ✅ File downloads successfully!

## 📊 Department Structure

```
IT Department (manager1 manages)
├── EMP006 - Employee 6
├── EMP007 - Employee 7
├── EMP008 - Employee 8
├── EMP009 - Employee 9
└── EMP010 - Employee 10

HR Department (manager2 manages)
├── EMP011 - Employee 1
├── EMP012 - Employee 2
├── EMP013 - Employee 3
├── EMP014 - Employee 4
└── EMP015 - Employee 5

Finance Department (manager3 manages)
├── EMP021 - Employee 1
├── EMP022 - Employee 2
├── EMP023 - Employee 3
├── EMP024 - Employee 4
└── EMP025 - Employee 5
```

## 🔍 How Authorization Works

The system checks:
1. **Is the user a Manager or Admin?** → Only managers/admins can download other's reports
2. **Is the employee in the manager's department?** → Prevents managers from seeing other departments' employees
3. **Does the employee exist?** → Validates the employee ID

This is a **security feature** to prevent unauthorized access to other departments' data.

## ✅ What Works

After following the steps above:
- ✅ Excel file downloads with proper name
- ✅ Both English and Japanese languages work
- ✅ All headers properly translated
- ✅ All employee data included
- ✅ File opens correctly in Excel/LibreOffice/Google Sheets

## 🆘 Still Having Issues?

### Check 1: Is the Employee ID correct?
- Make sure you entered an ID from YOUR department
- The ID should be in format: **EMP00X** (e.g., EMP006)
- Check the list above for valid IDs in your department

### Check 2: Are you logged in as a Manager?
- Employee accounts can only download their own reports
- Admin can download any employee's report
- Make sure you're using a manager or admin account

### Check 3: Check Browser Console (F12)
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for error messages starting with "Download failed"
4. These will tell you exactly what's wrong

### Check 4: Check Network Tab (F12)
1. Press **F12** to open Developer Tools
2. Go to **Network** tab
3. Click the download button
4. Look for request to `/attendance/export/employee-monthly`
5. Check the response for error details

## Example: Successful Download

```
Manager: manager1
Department: IT Department
Employee to download: EMP006 (same department) ✅
Year: 2026
Month: 1

Request:
GET /attendance/export/employee-monthly
    ?employee_id=EMP006
    &year=2026
    &month=1
    &language=en

Response:
✅ 200 OK
✅ File: employee_EMP006_Employee 6_2026-01_attendance.xlsx
✅ Contains all data with English headers
```

## Example: Failed Download (Authorization Error)

```
Manager: manager2 (HR Department)
Department: HR Department
Employee to download: EMP006 (IT Department) ❌
Year: 2026
Month: 1

Request:
GET /attendance/export/employee-monthly
    ?employee_id=EMP006  ❌ NOT in HR Department
    &year=2026
    &month=1
    &language=en

Response:
❌ 403 Forbidden
❌ Message: "Can only download reports for employees in your department"
```

## Testing with Admin Account

If you have **Admin** access, you can download any employee's report regardless of department. 

1. Login as **admin** account
2. Go to **Admin Dashboard**
3. Enter any Employee ID (e.g., EMP006, EMP011, EMP021)
4. Select Month and Year
5. Click Download ✅ Works for any employee!

## For IT Support

If you need to test with different employees, modify the database or create new test data for your department.

## Summary

| Scenario | Works? | Why |
|----------|--------|-----|
| Manager downloads own department's employee | ✅ YES | Authorization check passes |
| Manager downloads other department's employee | ❌ NO | Security restriction (403) |
| Admin downloads any employee | ✅ YES | Admin has all access |
| Employee downloads own report (no employee_id) | ✅ YES | Can access their own data |
| Download with valid employee + correct month | ✅ YES | All data exports correctly |
| Download when no attendance data exists | ✅ YES | Exports empty report (no error) |

---

**Status: ✅ WORKING CORRECTLY**

The download feature is functioning as designed with proper security checks.
