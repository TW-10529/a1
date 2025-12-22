# Employee Leave Statistics Search Feature

## Overview
Enhanced manager dashboard with detailed employee leave statistics search and reporting functionality.

## Features Implemented

### 1. Employee Search Functionality
- **Location**: Manager → Leave Requests page
- **Search by**: Employee ID (e.g., "E0001" or "0001")
- **Case-insensitive** string matching
- **Department-filtered** - Only shows employees in the manager's department

### 2. Quick Summary Display
After searching for an employee, displays:
- Employee Name and ID
- Total Paid Leave Entitlement
- Days Taken (Paid and Unpaid)
- Available Paid Days
- Quick "View Full Details" button

### 3. Detailed Leave Statistics Modal
Click "View Full Details" to open a comprehensive modal showing:

#### Paid Leave Statistics
- Total annual entitlement (days)
- Days taken
- Days available
- Usage percentage with visual progress bar

#### Unpaid Leave Statistics
- Total unpaid days taken

#### Monthly Breakdown
- Interactive table showing month-wise breakdown
- Columns: Month, Paid Days, Unpaid Days, Total Days
- Color-coded badges for easy reading

#### Annual Summary
- Year-wise totals for paid, unpaid, and total days
- Usage rate percentage

#### Key Metrics
- Monthly average calculation
- Monthly entitlement rate

### 4. Excel Export
- **Format**: Properly formatted HTML table (exported as .xls)
- **Content Includes**:
  - Employee information (name, ID, report date)
  - Paid leave summary with usage percentage
  - Unpaid leave summary
  - Yearly summary
  - Monthly breakdown table with totals row
- **File naming**: `{EmployeeName}_leave_statistics_{YYYY-MM-DD}.xls`

## Backend Integration

### API Endpoint
**Route**: `GET /leave-statistics/employee/{employee_id}`

**Authentication**: Manager role required (`require_manager` dependency)

**Parameters**:
- `employee_id` (string): Employee ID like "E0001"

**Response Structure**:
```json
{
  "employee_id": 1,
  "employee_name": "John Doe",
  "total_paid_leave": 10,
  "taken_paid_leave": 3,
  "taken_unpaid_leave": 2,
  "available_paid_leave": 7,
  "total_leaves_taken": 5,
  "monthly_breakdown": [
    {
      "month": "January 2025",
      "paid": 2,
      "unpaid": 1,
      "total": 3
    }
  ]
}
```

**Business Logic**:
1. Validates manager is authenticated
2. Filters employee by both `employee_id` (string) AND `department_id` (security)
3. Fetches all APPROVED leave requests for the employee
4. Calculates:
   - Total paid/unpaid days taken
   - Available days (entitlement - taken)
   - Monthly breakdown by leave type
5. Returns comprehensive statistics

### Database Fields Used
- **Employee Table**:
  - `id` (integer PK)
  - `employee_id` (string, unique)
  - `first_name`, `last_name`
  - `paid_leave_per_year` (default: 10)
  - `department_id` (FK)

- **LeaveRequest Table**:
  - `employee_id` (FK to Employee.id)
  - `leave_type` (paid/unpaid)
  - `start_date`, `end_date`
  - `status` (pending/approved/rejected)

- **Manager Table**:
  - `user_id` (FK to User.id)
  - `department_id` (FK)

## Frontend Integration

### Files Modified
1. **src/pages/Manager.jsx**
   - `handleSearchEmployee()` - Searches by employee ID (string)
   - `downloadAsExcel()` - Generates formatted Excel file
   - Modal component with detailed statistics
   - Quick summary cards

2. **src/services/api.js**
   - `getEmployeeLeaveStatistics(employeeId)` - API call function

### Key Component States
- `searchEmpId` - Search input value
- `employeeStats` - API response data
- `showEmployeeStats` - Modal visibility toggle

## Security Features
✅ Manager authentication required
✅ Department isolation (can only see own department employees)
✅ String employee ID filtering (no SQL injection risks)
✅ Token-based API authentication

## User Experience Flow
1. Manager enters employee ID in search box
2. System validates and searches for employee
3. Quick summary appears with employee details
4. Manager clicks "View Full Details"
5. Comprehensive modal opens with all statistics
6. Manager can download Excel report
7. Manager closes modal when done

## Technical Stack
- **Frontend**: React, Axios, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy (async)
- **Export Format**: HTML table in .xls format (Excel compatible)
