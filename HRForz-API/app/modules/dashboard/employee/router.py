from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.attendance import (
    AttendanceRecord,
    AttendanceRegularisation,
    EmployeeShiftAssignment,
    ShiftSchedule,
)
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest
from app.models.notification import Notification
from app.models.payroll import Payslip
from app.models.permission import PermissionRequest
from app.shared.dependencies.auth import CurrentUser, get_current_user
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/dashboard/employee", tags=["Dashboard - Employee"])

Db = Annotated[AsyncSession, Depends(get_db)]
Auth = Annotated[CurrentUser, Depends(get_current_user)]

PRESENT_STATUSES = ("P", "WFH", "LT", "R", "OT", "PE", "HD_FH", "HD_SH")


@router.get("/summary", response_model=ApiResponse[dict])
async def employee_dashboard_summary(current_user: Auth, db: Db):
    today = date.today()
    emp_id = current_user.employee_id

    month_start = today.replace(day=1)
    prev_month_end = month_start - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)

    # ── Today's attendance ──────────────────────────────────────────────────
    att_today = (await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == emp_id,
            AttendanceRecord.attendance_date == today,
        )
    )).scalar_one_or_none()

    # ── This month: working days attended ───────────────────────────────────
    days_this_month = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            AttendanceRecord.employee_id == emp_id,
            AttendanceRecord.attendance_date >= month_start,
            AttendanceRecord.attendance_date <= today,
            AttendanceRecord.status.in_(PRESENT_STATUSES),
        )
    )).scalar_one()

    days_prev_month = (await db.execute(
        select(func.count()).select_from(AttendanceRecord).where(
            AttendanceRecord.employee_id == emp_id,
            AttendanceRecord.attendance_date >= prev_month_start,
            AttendanceRecord.attendance_date <= prev_month_end,
            AttendanceRecord.status.in_(PRESENT_STATUSES),
        )
    )).scalar_one()

    # ── Avg work hours this month ────────────────────────────────────────────
    avg_hours_raw = (await db.execute(
        select(func.avg(AttendanceRecord.work_hours)).where(
            AttendanceRecord.employee_id == emp_id,
            AttendanceRecord.attendance_date >= month_start,
            AttendanceRecord.attendance_date <= today,
            AttendanceRecord.work_hours.isnot(None),
        )
    )).scalar_one()
    avg_hours = round(float(avg_hours_raw), 2) if avg_hours_raw else 0.0

    # ── Shift target hours ───────────────────────────────────────────────────
    shift = (await db.execute(
        select(ShiftSchedule)
        .join(EmployeeShiftAssignment, EmployeeShiftAssignment.shift_id == ShiftSchedule.id)
        .where(
            EmployeeShiftAssignment.employee_id == emp_id,
            EmployeeShiftAssignment.effective_from <= today,
            (EmployeeShiftAssignment.effective_to.is_(None))
            | (EmployeeShiftAssignment.effective_to >= today),
        )
        .limit(1)
    )).scalar_one_or_none()

    target_hours: float | None = None
    if shift:
        start_dt = datetime.combine(today, shift.start_time)
        end_dt = datetime.combine(today, shift.end_time)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)
        target_hours = round((end_dt - start_dt).total_seconds() / 3600, 2)

    # ── LOP days this year ───────────────────────────────────────────────────
    lop_raw = (await db.execute(
        select(func.sum(LeaveBalance.lop_days)).where(
            LeaveBalance.employee_id == emp_id,
            LeaveBalance.year == today.year,
        )
    )).scalar_one()
    lop_days = float(lop_raw) if lop_raw else 0.0

    # ── Leave balances ───────────────────────────────────────────────────────
    balances = list((await db.execute(
        select(LeaveBalance).where(
            LeaveBalance.employee_id == emp_id,
            LeaveBalance.year == today.year,
        )
    )).scalars().all())

    # ── Pending counts ───────────────────────────────────────────────────────
    pending_leaves = (await db.execute(
        select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.employee_id == emp_id,
            LeaveRequest.status == "pending",
            LeaveRequest.deleted_at.is_(None),
        )
    )).scalar_one()

    pending_permissions = (await db.execute(
        select(func.count()).select_from(PermissionRequest).where(
            PermissionRequest.employee_id == emp_id,
            PermissionRequest.status == "pending",
            PermissionRequest.deleted_at.is_(None),
        )
    )).scalar_one()

    pending_regularisations = (await db.execute(
        select(func.count()).select_from(AttendanceRegularisation).where(
            AttendanceRegularisation.employee_id == emp_id,
            AttendanceRegularisation.status == "pending",
            AttendanceRegularisation.deleted_at.is_(None),
        )
    )).scalar_one()

    # ── Unread notifications ─────────────────────────────────────────────────
    unread_notifs = (await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.recipient_id == emp_id,
            Notification.is_read.is_(False),
        )
    )).scalar_one()

    # ── Latest payslip ───────────────────────────────────────────────────────
    latest_slip = (await db.execute(
        select(Payslip)
        .where(Payslip.employee_id == emp_id, Payslip.is_published.is_(True))
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .limit(1)
    )).scalar_one_or_none()

    return ApiResponse.ok({
        "today_attendance": {
            "status": att_today.status if att_today else None,
            "clock_in": att_today.clock_in.isoformat() if att_today and att_today.clock_in else None,
            "clock_out": att_today.clock_out.isoformat() if att_today and att_today.clock_out else None,
            "work_hours": att_today.work_hours if att_today else None,
        },
        "monthly_attendance": {
            "days_attended": days_this_month,
            "days_attended_prev_month": days_prev_month,
            "mom_diff": days_this_month - days_prev_month,
        },
        "work_hours": {
            "avg_hours": avg_hours,
            "target_hours": target_hours,
            "on_track": avg_hours >= target_hours if target_hours else None,
        },
        "lop_days": lop_days,
        "leave_balances": [
            {
                "leave_type": b.leave_type,
                "entitled": b.entitled,
                "taken": b.taken,
                "available": b.available,
                "lop_days": b.lop_days,
            }
            for b in balances
        ],
        "pending_requests": {
            "total": pending_leaves + pending_permissions + pending_regularisations,
            "leaves": pending_leaves,
            "permissions": pending_permissions,
            "regularisations": pending_regularisations,
        },
        "unread_notifications": unread_notifs,
        "latest_payslip": {
            "month": latest_slip.month,
            "year": latest_slip.year,
            "net_salary": latest_slip.net_salary,
        } if latest_slip else None,
    })


@router.get("/whos-out-today", response_model=ApiResponse[list], dependencies=[Depends(get_current_user)])
async def whos_out_today(db: Db):
    today = date.today()

    requests = list((await db.execute(
        select(LeaveRequest)
        .options(
            joinedload(LeaveRequest.employee).joinedload(Employee.designation)
        )
        .where(
            LeaveRequest.status == "approved",
            LeaveRequest.from_date <= today,
            LeaveRequest.to_date >= today,
            LeaveRequest.deleted_at.is_(None),
        )
        .order_by(LeaveRequest.from_date)
    )).scalars().all())

    return ApiResponse.ok([
        {
            "employee_id": str(r.employee_id),
            "name": f"{r.employee.first_name} {r.employee.last_name}",
            "designation": r.employee.designation.name if r.employee.designation else None,
            "leave_type": r.leave_type,
            "from_date": r.from_date.isoformat(),
            "to_date": r.to_date.isoformat(),
        }
        for r in requests
    ])


@router.get("/birthdays", response_model=ApiResponse[list], dependencies=[Depends(get_current_user)])
async def birthdays_this_week(db: Db):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    employees = list((await db.execute(
        select(Employee)
        .options(joinedload(Employee.designation))
        .where(
            Employee.deleted_at.is_(None),
            Employee.status == "active",
            Employee.date_of_birth.isnot(None),
        )
    )).scalars().all())

    result = []
    for emp in employees:
        if not emp.date_of_birth:
            continue
        try:
            bday = emp.date_of_birth.replace(year=today.year)
        except ValueError:
            bday = emp.date_of_birth.replace(year=today.year, day=28)
        if week_start <= bday <= week_end:
            result.append({
                "employee_id": str(emp.id),
                "name": f"{emp.first_name} {emp.last_name}",
                "designation": emp.designation.name if emp.designation else None,
                "birthday": bday.strftime("%b %d"),
                "birthday_date": bday.isoformat(),
                "is_today": bday == today,
            })

    return ApiResponse.ok(sorted(result, key=lambda x: x["birthday_date"]))
