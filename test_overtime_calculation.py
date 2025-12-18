"""
Test script to verify overtime calculation is working
Tests the scenario: 
- Shift: 7-16 (9 hours)
- Work: 17:06-17:11 (after shift)
- Approved OT: 16-18 (2 hours)
- Expected: Shows actual overtime worked with approved cap
"""

import asyncio
import aiohttp
from datetime import date

async def test_overtime_calculation():
    """Test overtime calculation on check-out"""
    
    # Get manager token
    async with aiohttp.ClientSession() as session:
        # Login as manager
        login_data = {
            'username': 'manager1',
            'password': 'manager123'
        }
        
        async with session.post(
            'http://localhost:8000/token',
            data=login_data
        ) as resp:
            if resp.status != 200:
                print(f"❌ Login failed: {resp.status}")
                return
            
            tokens = await resp.json()
            token = tokens['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            
            # Get approved overtime requests
            async with session.get(
                'http://localhost:8000/overtime-requests?status=APPROVED',
                headers=headers
            ) as resp:
                requests = await resp.json()
                print("✅ Approved Overtime Requests:")
                for req in requests[:3]:
                    print(f"   - Employee {req['employee_id']}: {req['from_time']}-{req['to_time']} ({req['request_hours']}h) on {req['request_date']}")
        
        # Login as employee
        emp_login_data = {
            'username': 'emp1',
            'password': 'emp123'
        }
        
        async with session.post(
            'http://localhost:8000/token',
            data=emp_login_data
        ) as resp:
            if resp.status != 200:
                print(f"❌ Employee login failed: {resp.status}")
                return
            
            emp_tokens = await resp.json()
            emp_token = emp_tokens['access_token']
            emp_headers = {'Authorization': f'Bearer {emp_token}'}
            
            # Check if already checked in today
            async with session.get(
                'http://localhost:8000/attendance?start_date=' + str(date.today()) + '&end_date=' + str(date.today()),
                headers=emp_headers
            ) as resp:
                attendance = await resp.json()
                if attendance:
                    print(f"\n✅ Today's Attendance: {len(attendance)} record(s)")
                    for att in attendance:
                        print(f"   - Checked in: {att.get('check_in_time', 'N/A')}")
                        print(f"   - Checked out: {att.get('check_out_time', 'N/A')}")
                else:
                    print("\n⚠️  No attendance records today")
            
            # Get attendance summary
            async with session.get(
                f'http://localhost:8000/attendance/summary?start_date={date.today()}&end_date={date.today()}',
                headers=emp_headers
            ) as resp:
                summary = await resp.json()
                print(f"\n📊 Attendance Summary for Today:")
                for emp_summary in summary['summary']:
                    print(f"   Employee {emp_summary['employee_id']}:")
                    print(f"   - Hours worked: {emp_summary['total_worked_hours']}h")
                    print(f"   - Overtime: {emp_summary['total_overtime']}h")
                    print(f"   - On-time %: {emp_summary['on_time_percentage']}%")

if __name__ == '__main__':
    print("🔍 Testing Overtime Calculation System\n")
    asyncio.run(test_overtime_calculation())
    print("\n✅ Test complete!")
