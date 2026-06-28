from __future__ import annotations

import csv
import io
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.attendance.schemas import (
    AttendanceListRequest,
    AttendanceRecordResponse,
    ClockInRequest,
    ClockOutRequest,
    ManualAttendanceRequest,
    MonthlyAttendanceSummary,
    MonthlySummaryRequest,
    RegularisationActionRequest,
    RegularisationCreateRequest,
    RegularisationResponse,
    ShiftScheduleCreateRequest,
    ShiftScheduleResponse,
    WeeklyStatsResponse,
)
from app.modules.attendance.service import AttendanceService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly, ManagerOrHR
from app.shared.dependencies.db import get_db
from app.shared.enums.attendance import AttendanceStatus
from app.shared.schemas.response import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/status-options", response_model=ApiResponse[list[dict]])
async def get_status_options(current_user: CurrentUser = AuthRequired):
    """
    Returns a list of all possible attendance statuses for UI dropdown filters.
    Format: `[{"label": "Present", "value": "P"}, ...]`
    """
    options = []
    for status in AttendanceStatus:
        # Auto-format the enum name (e.g. HALF_DAY_FIRST -> "Half Day First")
        label = status.name.replace("_", " ").title()
        # Override some specific acronyms for better UX if needed
        if status.name == "WFH":
            label = "Work From Home"
        
        options.append({
            "label": label,
            "value": status.value
        })
        
    return ApiResponse.ok(options, "Attendance status options fetched")


@router.get("/weekly-stats", response_model=ApiResponse[WeeklyStatsResponse])
async def weekly_stats(
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns 'This Week' KPI cards for the Attendance page:

    | Field                  | Example          | Description                                    |
    |------------------------|------------------|------------------------------------------------|
    | hours_logged_label     | '31h 5m'         | Total hours clocked Mon → today                |
    | weekly_target_hours    | 42.0             | Configured target (Mon–Fri × 8.4 h default)    |
    | hours_progress_percent | 74.0             | % of target completed                          |
    | avg_clock_in_time      | '09:02 AM'       | Average clock-in time this week (12-h format)  |
    | is_on_schedule         | true             | avg in-time ≤ shift start + grace              |
    | current_streak         | 3                | Consecutive present working-days up to today   |
    | personal_best_streak   | 24               | All-time longest streak                        |
    """
    svc = AttendanceService(db)
    result = await svc.get_weekly_stats(current_user.employee_id)
    return ApiResponse.ok(result, "Weekly stats fetched")


@router.get("/today", response_model=ApiResponse[dict])
async def today_status(
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    svc = AttendanceService(db)
    record = await svc._repo.get_record(current_user.employee_id, date.today())

    if not record or not record.clock_in:
        return ApiResponse.ok({
            "attendance_record_id": str(record.id) if record else None,
            "status": "not_clocked_in",
            "clock_in": None,
            "clock_out": None,
            "work_hours": None,
            "is_late": False,
        })

    if record.clock_in and not record.clock_out:
        return ApiResponse.ok({
            "attendance_record_id": str(record.id),
            "status": "clocked_in",
            "clock_in": record.clock_in.isoformat(),
            "clock_out": None,
            "work_hours": record.work_hours,
            "is_late": record.is_late,
        })

    return ApiResponse.ok({
        "attendance_record_id": str(record.id),
        "status": "clocked_out",
        "clock_in": record.clock_in.isoformat(),
        "clock_out": record.clock_out.isoformat() if record.clock_out else None,
        "work_hours": record.work_hours,
        "is_late": record.is_late,
    })


@router.post("/monthly-summary", response_model=ApiResponse[MonthlyAttendanceSummary])
async def monthly_summary(
    payload: MonthlySummaryRequest = MonthlySummaryRequest(),
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the full set of Attendance KPI cards for a given month:

    | Field              | Description                                         |
    |--------------------|-----------------------------------------------------|
    | day_percent        | Attendance % for the month                          |
    | total_working_days | Weekdays minus public holidays (up to today)        |
    | avg_working_time   | Average daily work hours                            |
    | total_worked_hours | Sum of all work_hours entries                       |
    | late_arrivals      | Days clocked-in after shift start + grace           |
    | strikes            | Penalty strikes (floor(late_arrivals / 3))          |

    Non-HR users are always scoped to their own record.
    """
    svc = AttendanceService(db)

    # Employees can only see themselves; HR may override via payload.employee_id
    if current_user.is_hr_or_above() and payload.employee_id:
        emp_id = payload.employee_id
    else:
        emp_id = current_user.employee_id

    summary = await svc.get_monthly_summary(emp_id, payload.month, payload.year)
    return ApiResponse.ok(summary, "Monthly summary fetched")


@router.post("/clock-in", response_model=ApiResponse[AttendanceRecordResponse])
async def clock_in(
    payload: ClockInRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    record = await svc.clock_in(current_user, payload)
    return ApiResponse.ok(AttendanceRecordResponse.model_validate(record), "Clocked in successfully")


@router.post("/clock-out", response_model=ApiResponse[AttendanceRecordResponse])
async def clock_out(
    payload: ClockOutRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    record = await svc.clock_out(current_user, payload)
    return ApiResponse.ok(AttendanceRecordResponse.model_validate(record), "Clocked out successfully")


@router.post("/manual", response_model=ApiResponse[AttendanceRecordResponse], dependencies=[ManagerOrHR])
async def manual_entry(
    payload: ManualAttendanceRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    record = await svc.manual_entry(payload, current_user)
    return ApiResponse.ok(AttendanceRecordResponse.model_validate(record), "Attendance updated")


@router.post("/list", response_model=PaginatedResponse[AttendanceRecordResponse])
async def list_attendance(
    request: AttendanceListRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    # Non-HR users can only see their own records
    emp_id = None if current_user.is_hr_or_above() else current_user.employee_id
    items, total = await svc.list(request, emp_id)

    def _to_response(r: object) -> AttendanceRecordResponse:
        rec = AttendanceRecordResponse.model_validate(r)
        emp = getattr(r, "employee", None)
        if emp:
            rec.employee_name = rec.employee_name or f"{emp.first_name} {emp.last_name}"
            rec.employee_email = emp.email
            rec.employee_code = emp.employee_code
            if emp.department:
                rec.department_id = emp.department_id
                rec.department = emp.department.name
            if emp.designation:
                rec.designation_id = emp.designation_id
                rec.designation = emp.designation.name
        return rec

    data = [_to_response(r) for r in items]
    return PaginatedResponse.ok(data, total, request.page, request.size)


@router.post("/export")
async def export_attendance(
    request: AttendanceListRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    """
    Export the attendance list as a CSV file.
    Accepts the same filter body as POST /attendance/list (pagination is ignored).

    Returns: `text/csv` file download — `attendance_export.csv`
    """
    svc = AttendanceService(db)
    emp_id = None if current_user.is_hr_or_above() else current_user.employee_id
    rows = await svc.export_list(request, emp_id)

    # ── Build CSV in-memory ────────────────────────────────────────────────
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Employee ID",
        "Employee Code",
        "Employee Name",
        "Employee Email",
        "Department",
        "Designation / Role",
        "Date",
        "Status",
        "Clock In",
        "Clock Out",
        "Work Hours",
        "Is Late",
        "Is Early Out",
        "Overtime Hours",
        "Remarks",
    ])

    for r in rows:
        emp = getattr(r, "employee", None)
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else ""
        emp_code = emp.employee_code if emp else ""
        emp_email = emp.email if emp else ""
        dept_name = emp.department.name if emp and emp.department else ""
        desig_name = emp.designation.name if emp and emp.designation else ""
        writer.writerow([
            str(r.employee_id),
            emp_code,
            emp_name,
            emp_email,
            dept_name,
            desig_name,
            r.attendance_date.isoformat(),
            r.status,
            r.clock_in.isoformat() if r.clock_in else "",
            r.clock_out.isoformat() if r.clock_out else "",
            r.work_hours if r.work_hours is not None else "",
            "Yes" if r.is_late else "No",
            "Yes" if r.is_early_out else "No",
            r.overtime_hours if r.overtime_hours is not None else "",
            r.remarks or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_export.csv"},
    )


@router.post("/regularisations", response_model=ApiResponse[RegularisationResponse])
async def create_regularisation(
    payload: RegularisationCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    reg = await svc.create_regularisation(payload, current_user)
    return ApiResponse.created(RegularisationResponse.model_validate(reg), "Regularisation submitted")


@router.patch("/regularisations/{reg_id}", response_model=ApiResponse[RegularisationResponse], dependencies=[ManagerOrHR])
async def action_regularisation(
    reg_id: uuid.UUID,
    payload: RegularisationActionRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = AttendanceService(db)
    reg = await svc.action_regularisation(reg_id, payload, current_user)
    return ApiResponse.ok(RegularisationResponse.model_validate(reg), "Regularisation actioned")


@router.get("/shifts", response_model=ApiResponse[list[ShiftScheduleResponse]])
async def list_shifts(_: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = AttendanceService(db)
    shifts = await svc.list_shifts()
    return ApiResponse.ok([ShiftScheduleResponse.model_validate(s) for s in shifts])


@router.post("/shifts", response_model=ApiResponse[ShiftScheduleResponse], dependencies=[HROnly])
async def create_shift(payload: ShiftScheduleCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = AttendanceService(db)
    shift = await svc.create_shift(payload)
    return ApiResponse.created(ShiftScheduleResponse.model_validate(shift), "Shift created")
