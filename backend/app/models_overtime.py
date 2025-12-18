"""
Overtime Models for Shift Scheduler
"""

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class OvertimeStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class OvertimeTracking(Base):
    """Track monthly overtime for each employee"""
    __tablename__ = "overtime_tracking"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id', name='fk_overtime_employee'), nullable=False)
    month = Column(Integer, nullable=False)  # Month (1-12)
    year = Column(Integer, nullable=False)  # Year
    allocated_hours = Column(Float, default=0)  # Hours allocated/approved for this month
    used_hours = Column(Float, default=0)  # Hours already used
    remaining_hours = Column(Float, default=0)  # Remaining available hours
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="overtime_tracking")


class OvertimeRequest(Base):
    """Employee overtime requests"""
    __tablename__ = "overtime_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id', name='fk_ot_request_employee'), nullable=False)
    request_date = Column(Date, nullable=False)  # Date of overtime request
    request_hours = Column(Float, nullable=False)  # Hours requested
    reason = Column(Text, nullable=False)  # Reason for overtime
    status = Column(SQLEnum(OvertimeStatus), default=OvertimeStatus.PENDING)
    manager_id = Column(Integer, ForeignKey('users.id', name='fk_ot_request_manager'), nullable=True)
    manager_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="overtime_requests")
    manager = relationship("User")


class OvertimeWorked(Base):
    """Track actual overtime worked per day"""
    __tablename__ = "overtime_worked"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id', name='fk_ot_worked_employee'), nullable=False)
    work_date = Column(Date, nullable=False, index=True)
    overtime_hours = Column(Float, nullable=False)  # Hours worked over 8 hrs/day
    approval_status = Column(SQLEnum(OvertimeStatus), default=OvertimeStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="overtime_worked")
