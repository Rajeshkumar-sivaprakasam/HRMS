from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.department import Department
from app.models.helpdesk import HelpdeskTicket
from app.models.leave import LeaveRequest
from app.models.payroll import PayrollRun
from app.shared.dependencies.auth import HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

Db = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/dashboard/hr", tags=["Dashboard - HR"])


@router.get("/summary", response_model=ApiResponse[dict], dependencies=[HROnly])
async def hr_dashboard_summary(db: Db):
    today = date.today()

    # Total active employees
    emp_count_stmt = select(func.count()).select_from(Employee).where(
        Employee.deleted_at.is_(None), Employee.status == "active"
    )
    total_employees = (await db.execute(emp_count_stmt)).scalar_one()

    # Today's attendance count
    att_count_stmt = select(func.count()).select_from(AttendanceRecord).where(
        AttendanceRecord.attendance_date == today,
        AttendanceRecord.status.in_(["P", "HD_FH", "HD_SH", "WFH"]),
    )
    present_today = (await db.execute(att_count_stmt)).scalar_one()

    # Pending leaves
    pending_leaves_stmt = select(func.count()).select_from(LeaveRequest).where(
        LeaveRequest.status == "pending",
        LeaveRequest.deleted_at.is_(None),
    )
    pending_leaves = (await db.execute(pending_leaves_stmt)).scalar_one()

    # Open helpdesk tickets
    open_tickets_stmt = select(func.count()).select_from(HelpdeskTicket).where(
        HelpdeskTicket.status == "open",
        HelpdeskTicket.deleted_at.is_(None),
    )
    open_tickets = (await db.execute(open_tickets_stmt)).scalar_one()

    # Latest payroll run
    payroll_stmt = (
        select(PayrollRun)
        .where(PayrollRun.deleted_at.is_(None))
        .order_by(PayrollRun.year.desc(), PayrollRun.month.desc())
        .limit(1)
    )
    latest_run = (await db.execute(payroll_stmt)).scalar_one_or_none()

    # New joiners this month
    new_joiners_stmt = select(func.count()).select_from(Employee).where(
        Employee.deleted_at.is_(None),
        func.extract("year", Employee.date_of_joining) == today.year,
        func.extract("month", Employee.date_of_joining) == today.month,
    )
    new_joiners = (await db.execute(new_joiners_stmt)).scalar_one()

    # Separations this month (leavers)
    leavers_stmt = select(func.count()).select_from(Employee).where(
        Employee.deleted_at.is_(None),
        Employee.status == "separated",
        func.extract("year", Employee.date_of_leaving) == today.year,
        func.extract("month", Employee.date_of_leaving) == today.month,
    )
    leavers = (await db.execute(leavers_stmt)).scalar_one()

    return ApiResponse.ok({
        "total_employees": total_employees,
        "present_today": present_today,
        "absent_today": total_employees - present_today,
        "pending_leaves": pending_leaves,
        "open_tickets": open_tickets,
        "new_joiners_this_month": new_joiners,
        "separations_this_month": leavers,
        "latest_payroll": {
            "month": latest_run.month,
            "year": latest_run.year,
            "status": latest_run.status,
            "total_net": float(latest_run.total_net),
        } if latest_run else None,
    })


@router.get("/attendance-trend", response_model=ApiResponse[dict], dependencies=[HROnly])
async def attendance_trend(db: Db, days: int = 7):
    """Get attendance trend for last N days with stats"""
    today = date.today()
    start_date = today - timedelta(days=days)

    # Get all records in date range
    all_records = (await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.attendance_date.between(start_date, today)
        ).order_by(AttendanceRecord.attendance_date)
    )).scalars().all()

    # Group by date
    trends_by_date = {}
    for record in all_records:
        date_key = record.attendance_date.isoformat()
        if date_key not in trends_by_date:
            trends_by_date[date_key] = {"present": 0, "late": 0, "absent": 0, "total": 0}

        trends_by_date[date_key]["total"] += 1
        if record.status in ["P", "HD_FH", "HD_SH", "WFH"]:
            trends_by_date[date_key]["present"] += 1
        else:
            trends_by_date[date_key]["absent"] += 1

        if record.is_late:
            trends_by_date[date_key]["late"] += 1

    trend_data = [
        {
            "date": date_str,
            "present_count": data["present"],
            "late_count": data["late"],
            "absent_count": data["absent"],
        }
        for date_str, data in sorted(trends_by_date.items())
    ]

    # Calculate statistics
    total_late = sum(1 for r in all_records if r.is_late)
    missed_clock_out = sum(1 for r in all_records if r.clock_out is None and r.clock_in is not None)
    avg_work_hours = sum(r.work_hours or 0 for r in all_records) / max(len(all_records), 1)

    return ApiResponse.ok({
        "trend": trend_data,
        "stats": {
            "total_late_arrivals": total_late,
            "missed_clock_out_count": missed_clock_out,
            "average_work_hours": round(avg_work_hours, 2),
        }
    })


@router.get("/department-headcount", response_model=ApiResponse[list], dependencies=[HROnly])
async def department_headcount(db: Db):
    """Get headcount by department with monthly growth"""
    today = date.today()

    departments = (await db.execute(
        select(Department).where(
            Department.deleted_at.is_(None)
        ).order_by(Department.name)
    )).scalars().all()

    data = []
    for dept in departments:
        # Get total active employees
        emp_count = (await db.execute(
            select(func.count()).select_from(Employee).where(
                Employee.department_id == dept.id,
                Employee.deleted_at.is_(None),
                Employee.status == "active"
            )
        )).scalar_one()

        # Get new joiners this month
        new_joiners = (await db.execute(
            select(func.count()).select_from(Employee).where(
                Employee.department_id == dept.id,
                Employee.deleted_at.is_(None),
                func.extract("year", Employee.date_of_joining) == today.year,
                func.extract("month", Employee.date_of_joining) == today.month,
            )
        )).scalar_one()

        data.append({
            "department_id": str(dept.id),
            "department_name": dept.name,
            "total_employees": emp_count,
            "growth_this_month": new_joiners,
        })

    return ApiResponse.ok(data)
