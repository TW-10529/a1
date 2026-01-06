#!/usr/bin/env python3
"""
Test the employee export endpoint directly
"""
import asyncio
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import Employee, User, Manager
from backend.app.main import export_employee_monthly_attendance
from unittest.mock import AsyncMock, MagicMock

async def test_export():
    """Test the export function"""
    print("=" * 70)
    print("TESTING EMPLOYEE MONTHLY EXPORT FUNCTION")
    print("=" * 70)
    print()
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Get an existing user (manager)
        user_result = await db.execute(select(User).filter(User.user_type == 'manager').limit(1))
        user = user_result.scalar_one_or_none()
        
        if not user:
            print("❌ No manager user found")
            return
        
        print(f"✅ Using user: {user.username} ({user.user_type})")
        
        # Get an employee
        emp_result = await db.execute(select(Employee).limit(1))
        employee = emp_result.scalar_one_or_none()
        
        if not employee:
            print("❌ No employee found")
            return
        
        print(f"✅ Using employee: {employee.employee_id}")
        print()
        
        # Try to call the export function
        print("Calling export_employee_monthly_attendance...")
        print("-" * 70)
        
        try:
            result = await export_employee_monthly_attendance(
                year=2026,
                month=1,
                employee_id=employee.employee_id,
                language='en',
                current_user=user,
                db=db
            )
            
            print("✅ Export successful!")
            print(f"   Response type: {type(result)}")
            print(f"   Response: {result}")
            
        except Exception as e:
            print(f"❌ Export failed: {e}")
            import traceback
            traceback.print_exc()
    
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

if __name__ == '__main__':
    asyncio.run(test_export())
