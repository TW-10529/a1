"""
Mock Data Seeding Script
Creates sample data for testing: departments, managers, employees, schedules, attendance, and approved overtime
Run: python seed_mock_data.py
"""

import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.database import engine, DATABASE_URL
from app.models import (
    User, UserType, Department, Manager, Employee, Role, Shift, 
    Schedule, Attendance, OvertimeRequest, OvertimeStatus
)
from app.auth import get_password_hash


async def seed_data():
    print("🌱 Starting mock data seeding...")
    
    # Create async session
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # ===== 1. CREATE DEPARTMENTS =====
            print("\n📍 Creating departments...")
            dept = Department(
                dept_id="001",
                name="IT Department",
                description="Information Technology"
            )
            session.add(dept)
            await session.flush()
            dept_id = dept.id
            print(f"✅ Created department: {dept.name}")

            # ===== 2. CREATE MANAGER USER & MANAGER RECORD =====
            print("\n👔 Creating manager...")
            manager_user = User(
                username="manager1",
                email="manager@company.com",
                hashed_password=get_password_hash("manager123"),
                full_name="John Manager",
                user_type=UserType.MANAGER,
                is_active=True
            )
            session.add(manager_user)
            await session.flush()
            
            manager_record = Manager(
                user_id=manager_user.id,
                department_id=dept_id,
                is_active=True
            )
            session.add(manager_record)
            await session.flush()
            print(f"✅ Created manager: {manager_user.full_name} (username: manager1, password: manager123)")

            # ===== 3. CREATE ROLES =====
            print("\n🎯 Creating roles...")
            role_developer = Role(
                name="Developer",
                description="Software Developer",
                department_id=dept_id,
                priority=50,
                break_minutes=60,
                weekend_required=False
            )
            session.add(role_developer)
            await session.flush()
            
            role_manager = Role(
                name="Team Lead",
                description="Team Lead",
                department_id=dept_id,
                priority=60,
                break_minutes=60,
                weekend_required=False
            )
            session.add(role_manager)
            await session.flush()
            print(f"✅ Created roles: Developer, Team Lead")

            # ===== 4. CREATE SHIFTS =====
            print("\n⏰ Creating shifts...")
            shift_morning = Shift(
                role_id=role_developer.id,
                name="Morning Shift",
                start_time="09:00",
                end_time="18:00",
                priority=50,
                min_emp=1,
                max_emp=5
            )
            session.add(shift_morning)
            await session.flush()
            
            shift_afternoon = Shift(
                role_id=role_developer.id,
                name="Afternoon Shift",
                start_time="13:00",
                end_time="22:00",
                priority=40,
                min_emp=1,
                max_emp=5
            )
            session.add(shift_afternoon)
            await session.flush()
            print(f"✅ Created shifts: Morning (9-18), Afternoon (13-22)")

            # ===== 5. CREATE EMPLOYEE USERS & RECORDS =====
            print("\n👥 Creating employees...")
            employees_data = [
                ("emp1", "emp1@company.com", "Alice Johnson"),
                ("emp2", "emp2@company.com", "Bob Smith"),
                ("emp3", "emp3@company.com", "Carol White"),
            ]
            
            employees = []
            for username, email, full_name in employees_data:
                emp_user = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash("emp123"),
                    full_name=full_name,
                    user_type=UserType.EMPLOYEE,
                    is_active=True
                )
                session.add(emp_user)
                await session.flush()
                
                emp_record = Employee(
                    employee_id=f"E{len(employees)+1:04d}",
                    first_name=full_name.split()[0],
                    last_name=full_name.split()[1],
                    email=email,
                    department_id=dept_id,
                    role_id=role_developer.id,
                    user_id=emp_user.id,
                    weekly_hours=40.0,
                    daily_max_hours=8.0,
                    shifts_per_week=5,
                    hire_date=date.today() - timedelta(days=365)
                )
                session.add(emp_record)
                await session.flush()
                employees.append((emp_record, full_name))
                print(f"  ✅ {full_name} (username: {username}, password: emp123)")

            # ===== 6. CREATE SCHEDULES =====
            print("\n📅 Creating schedules...")
            today = date.today()
            for i in range(7):  # 7 days of schedules
                schedule_date = today + timedelta(days=i)
                
                # Assign morning shift to emp1, afternoon to emp2, morning to emp3
                if i < 5:  # Only weekdays
                    for emp_idx, shift in enumerate([shift_morning, shift_afternoon, shift_morning]):
                        emp = employees[emp_idx][0]
                        schedule = Schedule(
                            department_id=dept_id,
                            employee_id=emp.id,
                            role_id=role_developer.id,
                            shift_id=shift.id,
                            date=schedule_date,
                            start_time=shift.start_time,
                            end_time=shift.end_time,
                            status="scheduled"
                        )
                        session.add(schedule)
            await session.flush()
            print(f"✅ Created schedules for next 7 days")

            # ===== 7. CREATE OVERTIME REQUESTS (APPROVED) =====
            print("\n⏱️ Creating approved overtime requests...")
            
            # Overtime for Alice today (18:00-19:00, 1 hour)
            overtime1 = OvertimeRequest(
                employee_id=employees[0][0].id,
                request_date=today,
                from_time="18:00",
                to_time="19:00",
                request_hours=1.0,
                reason="Critical bug fix needed",
                status=OvertimeStatus.APPROVED,
                manager_id=manager_user.id,
                manager_notes="Approved - urgent production issue",
                approved_at=datetime.now()
            )
            session.add(overtime1)
            
            # Overtime for Bob tomorrow (22:00-23:30, 1.5 hours)
            overtime2 = OvertimeRequest(
                employee_id=employees[1][0].id,
                request_date=today + timedelta(days=1),
                from_time="22:00",
                to_time="23:30",
                request_hours=1.5,
                reason="Project deadline completion",
                status=OvertimeStatus.APPROVED,
                manager_id=manager_user.id,
                manager_notes="Approved - project milestone",
                approved_at=datetime.now()
            )
            session.add(overtime2)
            
            # Overtime for Carol in 2 days (19:00-20:30, 1.5 hours)
            overtime3 = OvertimeRequest(
                employee_id=employees[2][0].id,
                request_date=today + timedelta(days=2),
                from_time="19:00",
                to_time="20:30",
                request_hours=1.5,
                reason="Client training session",
                status=OvertimeStatus.APPROVED,
                manager_id=manager_user.id,
                manager_notes="Approved - client requirement",
                approved_at=datetime.now()
            )
            session.add(overtime3)
            await session.flush()
            print(f"✅ Created approved overtime requests:")
            print(f"   - Alice: 18:00-19:00 (1.0 hr)")
            print(f"   - Bob: 22:00-23:30 (1.5 hrs)")
            print(f"   - Carol: 19:00-20:30 (1.5 hrs)")

            # ===== 8. CREATE ATTENDANCE RECORDS =====
            print("\n📝 Creating attendance records with check-in/out times...")
            
            # Alice today: 09:00-19:00 (9hrs normal + 1hr approved OT = shows 1hr OT)
            attendance1 = Attendance(
                employee_id=employees[0][0].id,
                schedule_id=None,
                date=today,
                in_time="09:00",
                out_time="19:00",
                status="onTime",
                out_status="onTime",
                worked_hours=9.0,
                overtime_hours=1.0,  # 9hr - 8hr max = 1hr, within approved 1hr
                break_minutes=60
            )
            session.add(attendance1)
            
            # Bob yesterday: 13:00-22:30 (9.5hrs normal + 1.5hrs OT = shows 1.5hrs OT)
            attendance2 = Attendance(
                employee_id=employees[1][0].id,
                schedule_id=None,
                date=today - timedelta(days=1),
                in_time="13:00",
                out_time="22:30",
                status="onTime",
                out_status="onTime",
                worked_hours=9.5,
                overtime_hours=1.5,  # 9.5hr - 8hr max = 1.5hr, within approved 1.5hr
                break_minutes=60
            )
            session.add(attendance2)
            
            # Carol 2 days ago: 09:00-18:00 (8hrs normal, no OT)
            attendance3 = Attendance(
                employee_id=employees[2][0].id,
                schedule_id=None,
                date=today - timedelta(days=2),
                in_time="09:00",
                out_time="18:00",
                status="onTime",
                out_status="onTime",
                worked_hours=8.0,
                overtime_hours=0.0,  # No overtime worked
                break_minutes=60
            )
            session.add(attendance3)
            
            # Carol today: 09:00-20:45 (11hrs worked, but only 1.5hr approved OT)
            # Will show 1.5hr (min of 3hr actual - but 1.5hr approved)
            attendance4 = Attendance(
                employee_id=employees[2][0].id,
                schedule_id=None,
                date=today,
                in_time="09:00",
                out_time="20:45",
                status="onTime",
                out_status="onTime",
                worked_hours=11.75,
                overtime_hours=1.5,  # min(11.75-8, 1.5) = 1.5hr
                break_minutes=60
            )
            session.add(attendance4)
            
            await session.flush()
            print(f"✅ Created attendance records:")
            print(f"   - Alice (today): 09:00-19:00 → 1.0hr OT (matches approved)")
            print(f"   - Bob (yesterday): 13:00-22:30 → 1.5hr OT (matches approved)")
            print(f"   - Carol (2 days ago): 09:00-18:00 → 0.0hr OT")
            print(f"   - Carol (today): 09:00-20:45 → 1.5hr OT (capped at approved)")

            # Commit all changes
            await session.commit()
            
            print("\n" + "="*60)
            print("✅ MOCK DATA SEEDING COMPLETE!")
            print("="*60)
            print("\n📋 TEST CREDENTIALS:")
            print("   MANAGER:")
            print("      Username: manager1")
            print("      Password: manager123")
            print("   EMPLOYEES:")
            print("      Username: emp1/emp2/emp3")
            print("      Password: emp123")
            print("\n📊 TEST DATA CREATED:")
            print("   ✓ 1 Department (IT)")
            print("   ✓ 1 Manager with 3 Employees")
            print("   ✓ 2 Roles, 2 Shifts")
            print("   ✓ 7 days of Schedules")
            print("   ✓ 3 Approved Overtime Requests")
            print("   ✓ 4 Attendance Records with OT calculations")
            print("\n🧪 TO TEST OVERTIME CALCULATION:")
            print("   1. Login as manager1 (password: manager123)")
            print("   2. Go to Attendance/Manager view")
            print("   3. Check overtime_hours column:")
            print("      - Alice: 1.0 hour")
            print("      - Bob: 1.5 hours")
            print("      - Carol (today): 1.5 hours (capped at approved)")
            print("\n💡 HOW IT WORKS:")
            print("   - Alice worked 1hr OT, approved for 1hr → Shows: 1.0hr ✓")
            print("   - Bob worked 1.5hr OT, approved for 1.5hr → Shows: 1.5hr ✓")
            print("   - Carol worked 3.75hr OT, approved for 1.5hr → Shows: 1.5hr ✓")
            print("\n" + "="*60)
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding data: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(seed_data())
