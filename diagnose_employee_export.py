#!/usr/bin/env python3
"""
Diagnostic tool to help troubleshoot Employee Monthly Report downloads
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import Employee, Attendance, User
from datetime import date

async def diagnose():
    """Run diagnostic tests"""
    print("=" * 70)
    print("EMPLOYEE MONTHLY REPORT - DIAGNOSTIC TOOL")
    print("=" * 70)
    print()
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Check 1: Count employees
        print("1️⃣ CHECKING EMPLOYEES IN DATABASE")
        print("-" * 70)
        emp_result = await db.execute(select(Employee).limit(10))
        employees = emp_result.scalars().all()
        print(f"Total employees found: {len(employees)}")
        if employees:
            print("Sample employees:")
            for emp in employees[:5]:
                print(f"  • {emp.employee_id}: {emp.first_name} {emp.last_name}")
        else:
            print("  ⚠️  WARNING: No employees found in database!")
        print()
        
        # Check 2: Check attendance records
        print("2️⃣ CHECKING ATTENDANCE RECORDS")
        print("-" * 70)
        att_result = await db.execute(select(Attendance).limit(1))
        att_records = att_result.scalars().all()
        print(f"Total attendance records: {len(att_records)}")
        if att_records:
            rec = att_records[0]
            print(f"Sample record:")
            print(f"  • Employee ID: {rec.employee_id}")
            print(f"  • Date: {rec.date}")
            print(f"  • Check-in: {rec.in_time}")
            print(f"  • Check-out: {rec.out_time}")
        else:
            print("  ⚠️  WARNING: No attendance records found!")
        print()
        
        # Check 3: Look for specific employee
        print("3️⃣ LOOKING FOR TEST EMPLOYEES")
        print("-" * 70)
        test_ids = ['EMP001', 'EMP0100', 'EMP0001']
        for test_id in test_ids:
            result = await db.execute(
                select(Employee).filter(Employee.employee_id == test_id)
            )
            emp = result.scalar_one_or_none()
            if emp:
                print(f"✅ Found: {test_id}")
                # Check attendance for this employee
                att_result = await db.execute(
                    select(Attendance).filter(
                        Attendance.employee_id == emp.id,
                        Attendance.date >= date(2025, 1, 1),
                        Attendance.date <= date(2025, 12, 31)
                    ).limit(1)
                )
                att = att_result.scalar_one_or_none()
                if att:
                    print(f"   → Has attendance records for 2025")
                else:
                    print(f"   → ⚠️  No attendance records for 2025")
            else:
                print(f"❌ Not found: {test_id}")
        print()
        
        # Check 4: Verify users exist
        print("4️⃣ CHECKING USERS (for authorization)")
        print("-" * 70)
        user_result = await db.execute(select(User).limit(5))
        users = user_result.scalars().all()
        print(f"Total users: {len(users)}")
        for user in users[:3]:
            print(f"  • {user.user_type}: {user.username}")
        print()
        
        print("=" * 70)
        print("RECOMMENDATIONS:")
        print("=" * 70)
        if not employees:
            print("❌ No employees found - create test employees first")
        elif not att_records:
            print("❌ No attendance records - add attendance data first")
        else:
            print("✅ Database appears healthy")
            print()
            print("If download still fails, check:")
            print("1. Browser console (F12) for JavaScript errors")
            print("2. Backend logs for Python errors")
            print("3. Network tab to see actual API response")
            print("4. Verify you're logged in as Manager/Admin")
            
    except Exception as e:
        print(f"❌ Error during diagnosis: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == '__main__':
    asyncio.run(diagnose())
