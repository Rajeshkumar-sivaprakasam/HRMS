import uuid
from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.attendance import (
    AttendanceStatus,
    ClockMethod,
    RegularisationStatus,
)
from app.shared.schemas.listing import ListingFilter, ListingRequest, PaginationInput


class ClockInRequest(BaseModel):
    method: ClockMethod = ClockMethod.WEB_PORTAL
    remarks: str | None = None


class ClockOutRequest(BaseModel):
    method: ClockMethod = ClockMethod.WEB_PORTAL
    remarks: str | None = None


class AttendanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    employee_code: str | None = None
    employee_name: str | None = None
    employee_email: str | None = None
    department_id: uuid.UUID | None = None
    department: str | None = None
    designation_id: uuid.UUID | None = None
    designation: str | None = None          # "role" in the UI
    attendance_date: date
    status: AttendanceStatus
    clock_in: datetime | None
    clock_out: datetime | None
    work_hours: float | None
    is_late: bool
    is_early_out: bool
    overtime_hours: float | None
    remarks: str | None


class ManualAttendanceRequest(BaseModel):
    employee_id: uuid.UUID
    attendance_date: date
    status: AttendanceStatus
    clock_in: datetime | None = None
    clock_out: datetime | None = None
    remarks: str | None = None


class RegularisationCreateRequest(BaseModel):
    attendance_record_id: uuid.UUID
    requested_clock_in: time | None = None
    requested_clock_out: time | None = None
    reason: str = Field(min_length=5)


class RegularisationActionRequest(BaseModel):
    status: RegularisationStatus
    rejection_reason: str | None = None


class RegularisationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    attendance_record_id: uuid.UUID
    employee_id: uuid.UUID
    requested_clock_in: time | None
    requested_clock_out: time | None
    reason: str
    status: RegularisationStatus
    approved_by: uuid.UUID | None
    approved_at: datetime | None
    rejection_reason: str | None


class ShiftScheduleCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    start_time: time
    end_time: time
    grace_minutes: int = 15
    is_default: bool = False


class ShiftScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    start_time: time
    end_time: time
    grace_minutes: int
    is_default: bool
    is_active: bool


class MonthlySummaryRequest(BaseModel):
    """Request body for GET /attendance/monthly-summary."""

    month: Optional[int] = Field(default=None, ge=1, le=12)
    year: Optional[int] = Field(default=None, ge=2000, le=2100)
    employee_id: Optional[uuid.UUID] = None  # HR-only override


class MonthlyAttendanceSummary(BaseModel):
    """Full monthly KPI card payload for the Attendance page."""

    employee_id: uuid.UUID
    month: int
    year: int

    # ── Core counts ──────────────────────────────────────────────────────────
    total_working_days: int
    """Calendar working days in the month (weekdays excluding public holidays)."""

    present_days: int
    """Days the employee was marked Present / WFH / Regularised / OT / Permission."""

    absent_days: int
    half_days: int
    leave_days: int
    holiday_days: int

    # ── KPI metrics ──────────────────────────────────────────────────────────
    day_percent: float
    """Attendance % = (present_days / total_working_days) * 100."""

    total_worked_hours: float
    """Sum of work_hours for all clocked-in records in the month."""

    avg_working_time: float
    """Average daily work hours = total_worked_hours / max(present_days, 1)."""

    late_arrivals: int
    """Number of days the employee clocked in after shift start + grace."""

    strikes: int
    """Penalty strikes = floor(late_arrivals / 3).  Every 3 lates = 1 strike."""


# ── Weekly Stats ──────────────────────────────────────────────────────────────

class WeeklyStatsResponse(BaseModel):
    """'This Week' KPI card payload for the Attendance page."""

    # Date window
    week_start: date
    week_end: date

    # Hours logged
    hours_logged: float
    """Total work hours clocked this week (decimal, e.g. 31.083)."""

    hours_logged_label: str
    """Human-readable label, e.g. '31h 5m'."""

    weekly_target_hours: float
    """Configured weekly target (default 42 h for a 5-day × 8.4 h week)."""

    hours_progress_percent: float
    """hours_logged / weekly_target_hours * 100, capped at 100."""

    # Avg in-time
    avg_clock_in_time: Optional[str]
    """Average clock-in time formatted as HH:MM AM/PM, e.g. '09:02 AM'. None if no records."""

    is_on_schedule: bool
    """True when avg_clock_in_time <= shift start + grace minutes."""

    # Streak
    current_streak: int
    """Consecutive present-days ending today (or last working day)."""

    personal_best_streak: int
    """All-time longest consecutive present-day run for this employee."""


class AttendanceListFilter(ListingFilter):
    """Filter schema for the attendance /list endpoint."""

    sortBy: str = Field(default="attendance_date")
    sortOrder: str = Field(default="asc", pattern="^(asc|desc)$")

    # ── Date range ───────────────────────────────────────────────────────────
    from_date: Optional[date] = None
    """Start of date range (inclusive). Leave blank for open-ended."""

    to_date: Optional[date] = None
    """End of date range (inclusive). Leave blank for open-ended."""

    # ── Employee filters ──────────────────────────────────────────────────────
    employee_id: Optional[uuid.UUID] = None
    """Filter by exact employee UUID."""

    employee_code: Optional[str] = None
    """Filter by employee code (partial match)."""

    employee_name: Optional[str] = None
    """Filter by employee name (partial match across first_name + last_name)."""

    # ── Org filters ───────────────────────────────────────────────────────────
    department_id: Optional[uuid.UUID] = None
    """Filter by department UUID."""

    designation_id: Optional[uuid.UUID] = None
    """Filter by designation (role) UUID."""

    # ── Attendance state filter ───────────────────────────────────────────────
    status: Optional[AttendanceStatus] = None


class AttendanceListRequest(BaseModel):
    """Full request body for POST /attendance/list."""

    filter: AttendanceListFilter = Field(default_factory=AttendanceListFilter)
    pagination: PaginationInput = Field(default_factory=PaginationInput)
    paginationFlag: bool = Field(default=True)

    @property
    def page(self) -> int:
        return self.pagination.page

    @property
    def size(self) -> int:
        return self.pagination.size

    @property
    def offset(self) -> int:
        return (self.pagination.page - 1) * self.pagination.size

    @property
    def limit(self) -> int:
        return self.pagination.size
