from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import (
    AttendanceAlreadyClockedIn,
    BusinessRuleViolation,
    NotFound,
)
from app.models.attendance import AttendanceRecord, AttendanceRegularisation, ShiftSchedule
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.schemas import (
    ClockInRequest,
    ClockOutRequest,
    ManualAttendanceRequest,
    RegularisationActionRequest,
    RegularisationCreateRequest,
    ShiftScheduleCreateRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.attendance import AttendanceStatus, RegularisationStatus
from app.shared.utils.filter_builder import FilterBuilder


class AttendanceService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = AttendanceRepository(db)

    async def clock_in(self, current_user: CurrentUser, payload: ClockInRequest) -> AttendanceRecord:
        today = date.today()
        existing = await self._repo.get_record(current_user.employee_id, today)

        # Block only when currently clocked in (no clock_out yet)
        if existing and existing.clock_in and not existing.clock_out:
            raise AttendanceAlreadyClockedIn()

        now = datetime.utcnow()
        shift = await self._repo.get_default_shift()
        is_late = False
        if shift:
            grace = datetime.combine(today, shift.start_time).replace(tzinfo=None)
            from datetime import timedelta
            grace += timedelta(minutes=shift.grace_minutes)
            is_late = now.time() > grace.time()

        if existing:
            # Re-clock-in after a previous clock-out: start a new session,
            # keeping accumulated work_hours from earlier sessions intact.
            existing.clock_in = now
            existing.clock_out = None
            existing.clock_in_method = payload.method
            existing.is_late = existing.is_late or is_late
            existing.status = AttendanceStatus.PRESENT
            return await self._repo.save_record(existing)

        record = AttendanceRecord(
            employee_id=current_user.employee_id,
            attendance_date=today,
            status=AttendanceStatus.PRESENT,
            clock_in=now,
            clock_in_method=payload.method,
            is_late=is_late,
            remarks=payload.remarks,
        )
        return await self._repo.save_record(record)

    async def clock_out(self, current_user: CurrentUser, payload: ClockOutRequest) -> AttendanceRecord:
        today = date.today()
        record = await self._repo.get_record(current_user.employee_id, today)
        if not record or not record.clock_in:
            raise BusinessRuleViolation("No clock-in found for today")
        if record.clock_out:
            raise BusinessRuleViolation("Already clocked out today")

        now = datetime.utcnow()
        session_hours = round((now - record.clock_in.replace(tzinfo=None)).total_seconds() / 3600, 2)
        record.clock_out = now
        record.clock_out_method = payload.method
        # Accumulate hours across multiple sessions in the same day
        record.work_hours = round((record.work_hours or 0) + session_hours, 2)
        return await self._repo.save_record(record)

    async def manual_entry(self, payload: ManualAttendanceRequest, actor: CurrentUser) -> AttendanceRecord:
        existing = await self._repo.get_record(payload.employee_id, payload.attendance_date)
        if existing:
            for field in ["status", "clock_in", "clock_out", "remarks"]:
                v = getattr(payload, field)
                if v is not None:
                    setattr(existing, field, v)
            if existing.clock_in and existing.clock_out:
                delta = existing.clock_out.replace(tzinfo=None) - existing.clock_in.replace(tzinfo=None)
                existing.work_hours = round(delta.total_seconds() / 3600, 2)
            return await self._repo.save_record(existing)

        record = AttendanceRecord(
            employee_id=payload.employee_id,
            attendance_date=payload.attendance_date,
            status=payload.status,
            clock_in=payload.clock_in,
            clock_out=payload.clock_out,
            remarks=payload.remarks,
        )
        return await self._repo.save_record(record)

    async def list(self, request: "AttendanceListRequest", employee_id: uuid.UUID | None = None) -> tuple[list[AttendanceRecord], int]:
        f = request.filter

        # Employee scope: HR can filter by employee_id; employees are locked to themselves
        emp_id = employee_id or f.employee_id

        conditions = self._build_list_conditions(
            emp_id=emp_id,
            status=f.status,
            from_date=f.from_date,
            to_date=f.to_date,
            department_id=f.department_id,
            designation_id=f.designation_id,
            employee_name=f.employee_name,
            employee_code=f.employee_code,
        )
        return await self._repo.list_records(
            conditions,
            f.sortBy,
            f.sortOrder,
            request.offset,
            request.limit,
            request.paginationFlag,
        )

    async def export_list(self, request: "AttendanceListRequest", employee_id: uuid.UUID | None = None) -> list[AttendanceRecord]:
        """Return ALL matching records (no pagination) for CSV export."""
        f = request.filter
        emp_id = employee_id or f.employee_id

        conditions = self._build_list_conditions(
            emp_id=emp_id,
            status=f.status,
            from_date=f.from_date,
            to_date=f.to_date,
            department_id=f.department_id,
            designation_id=f.designation_id,
            employee_name=f.employee_name,
            employee_code=f.employee_code,
        )
        return await self._repo.list_records_for_export(conditions, f.sortBy, f.sortOrder)

    # ── internal helper ───────────────────────────────────────────────────────

    def _build_list_conditions(
        self,
        *,
        emp_id: uuid.UUID | None,
        status: "AttendanceStatus | None",
        from_date: "date | None",
        to_date: "date | None",
        department_id: "uuid.UUID | None",
        designation_id: "uuid.UUID | None",
        employee_name: "str | None",
        employee_code: "str | None",
    ):
        from sqlalchemy import and_, or_, true
        from app.models.employee import Employee

        # Core attendance conditions
        builder = (
            FilterBuilder(AttendanceRecord)
            .eq("employee_id", emp_id)
            .eq("status", status)
            .date_range("attendance_date", from_date, to_date)
        )

        # Cross-join sub-conditions via Employee relationship
        employee_conditions = []
        if department_id:
            employee_conditions.append(Employee.department_id == department_id)
        if designation_id:
            employee_conditions.append(Employee.designation_id == designation_id)
        if employee_code:
            employee_conditions.append(Employee.employee_code.ilike(f"%{employee_code}%"))
        if employee_name:
            # search across first_name + last_name individually and combined
            term = f"%{employee_name}%"
            employee_conditions.append(
                or_(
                    Employee.first_name.ilike(term),
                    Employee.last_name.ilike(term),
                    (Employee.first_name + " " + Employee.last_name).ilike(term),
                )
            )

        if employee_conditions:
            from sqlalchemy import exists, select as sa_select
            sub = (
                sa_select(Employee.id)
                .where(Employee.id == AttendanceRecord.employee_id, *employee_conditions)
                .correlate(AttendanceRecord)
            )
            builder.raw(exists(sub))

        return builder.build()

    async def create_regularisation(self, payload: RegularisationCreateRequest, current_user: CurrentUser) -> AttendanceRegularisation:
        record = await self._repo.get_record_by_id(payload.attendance_record_id)
        if not record or record.employee_id != current_user.employee_id:
            raise NotFound("Attendance record not found")

        reg = AttendanceRegularisation(
            attendance_record_id=payload.attendance_record_id,
            employee_id=current_user.employee_id,
            requested_clock_in=payload.requested_clock_in,
            requested_clock_out=payload.requested_clock_out,
            reason=payload.reason,
            status=RegularisationStatus.PENDING,
        )
        return await self._repo.save_regularisation(reg)

    async def action_regularisation(self, reg_id: uuid.UUID, payload: RegularisationActionRequest, actor: CurrentUser) -> AttendanceRegularisation:
        reg = await self._repo.get_regularisation(reg_id)
        if not reg:
            raise NotFound("Regularisation not found")
        if reg.status != RegularisationStatus.PENDING:
            raise BusinessRuleViolation("Regularisation already actioned")

        reg.status = payload.status
        reg.approved_by = actor.employee_id
        reg.approved_at = datetime.utcnow()
        reg.rejection_reason = payload.rejection_reason

        if payload.status == RegularisationStatus.APPROVED:
            record = await self._repo.get_record_by_id(reg.attendance_record_id)
            if record:
                if reg.requested_clock_in:
                    record.clock_in = datetime.combine(record.attendance_date, reg.requested_clock_in)
                if reg.requested_clock_out:
                    record.clock_out = datetime.combine(record.attendance_date, reg.requested_clock_out)
                if record.clock_in and record.clock_out:
                    delta = record.clock_out.replace(tzinfo=None) - record.clock_in.replace(tzinfo=None)
                    record.work_hours = round(delta.total_seconds() / 3600, 2)
                await self._repo.save_record(record)

        return await self._repo.save_regularisation(reg)

    async def create_shift(self, payload: ShiftScheduleCreateRequest) -> ShiftSchedule:
        if payload.is_default:
            existing_default = await self._repo.get_default_shift()
            if existing_default:
                existing_default.is_default = False
                await self._repo.save_shift(existing_default)
        shift = ShiftSchedule(**payload.model_dump())
        return await self._repo.save_shift(shift)

    async def list_shifts(self) -> list[ShiftSchedule]:
        return await self._repo.list_shifts()

    async def get_monthly_summary(
        self,
        employee_id: uuid.UUID,
        month: int | None,
        year: int | None,
    ) -> "MonthlyAttendanceSummary":
        """Compute the full attendance KPI summary for the requested month."""
        import calendar
        from math import floor

        from app.modules.attendance.schemas import MonthlyAttendanceSummary

        today = date.today()
        month = month or today.month
        year = year or today.year

        from_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        to_date = date(year, month, last_day)

        # Fetch raw data
        records = await self._repo.get_monthly_records(employee_id, from_date, to_date)
        public_holiday_dates: set[date] = set(
            await self._repo.get_public_holidays_for_month(from_date, to_date)
        )

        # ── Total working days (Mon–Fri, excluding public holidays, up to today) ──
        from datetime import timedelta as _td

        total_working_days = 0
        cur = from_date
        while cur <= min(to_date, today):
            if cur.weekday() < 5 and cur not in public_holiday_dates:
                total_working_days += 1
            cur += _td(days=1)

        # ── Aggregate from records ────────────────────────────────────────────
        PRESENT_STATUSES = {
            AttendanceStatus.PRESENT,
            AttendanceStatus.WFH,
            AttendanceStatus.REGULARISED,
            AttendanceStatus.OVERTIME,
            AttendanceStatus.PERMISSION,
            AttendanceStatus.LATE,
        }
        HALF_DAY_STATUSES = {AttendanceStatus.HALF_DAY_FIRST, AttendanceStatus.HALF_DAY_SECOND}

        present_days = 0
        absent_days = 0
        half_days = 0
        leave_days = 0
        holiday_days = 0
        total_worked_hours = 0.0
        late_arrivals = 0

        for rec in records:
            if rec.status in PRESENT_STATUSES:
                present_days += 1
            elif rec.status in HALF_DAY_STATUSES:
                half_days += 1
                present_days += 1  # count as present for %
            elif rec.status == AttendanceStatus.ON_LEAVE:
                leave_days += 1
            elif rec.status == AttendanceStatus.PUBLIC_HOLIDAY:
                holiday_days += 1
            elif rec.status == AttendanceStatus.ABSENT:
                absent_days += 1

            total_worked_hours += rec.work_hours or 0.0
            if rec.is_late:
                late_arrivals += 1

        total_worked_hours = round(total_worked_hours, 2)
        day_percent = round((present_days / total_working_days * 100) if total_working_days else 0.0, 2)
        avg_working_time = round(total_worked_hours / max(present_days, 1), 2)
        strikes = floor(late_arrivals / 3)

        return MonthlyAttendanceSummary(
            employee_id=employee_id,
            month=month,
            year=year,
            total_working_days=total_working_days,
            present_days=present_days,
            absent_days=absent_days,
            half_days=half_days,
            leave_days=leave_days,
            holiday_days=holiday_days,
            day_percent=day_percent,
            total_worked_hours=total_worked_hours,
            avg_working_time=avg_working_time,
            late_arrivals=late_arrivals,
            strikes=strikes,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Weekly Stats  ("This Week" KPI cards)
    # ─────────────────────────────────────────────────────────────────────────

    async def get_weekly_stats(
        self,
        employee_id: uuid.UUID,
        weekly_target_hours: float = 42.0,
    ) -> "WeeklyStatsResponse":
        """Compute the 'This Week' KPI summary for the Attendance page.

        Fields returned:
          - hours_logged / hours_logged_label / weekly_target_hours / hours_progress_percent
          - avg_clock_in_time / is_on_schedule
          - current_streak / personal_best_streak
        """
        from datetime import timedelta

        from app.modules.attendance.schemas import WeeklyStatsResponse

        today = date.today()

        # ── Week window: Monday → today (or Sunday) ───────────────────────────
        week_start = today - timedelta(days=today.weekday())   # Monday
        week_end = week_start + timedelta(days=6)              # Sunday

        # ── Fetch this-week records ───────────────────────────────────────────
        week_records = await self._repo.get_monthly_records(employee_id, week_start, today)

        # ── Hours logged ──────────────────────────────────────────────────────
        total_minutes = 0
        clock_in_seconds_list: list[int] = []

        for rec in week_records:
            total_minutes += int((rec.work_hours or 0.0) * 60)
            if rec.clock_in:
                # Normalise to local naive time-of-day in seconds since midnight
                ci = rec.clock_in
                # strip tz if present so arithmetic is consistent
                ci_naive = ci.replace(tzinfo=None)
                secs = ci_naive.hour * 3600 + ci_naive.minute * 60 + ci_naive.second
                clock_in_seconds_list.append(secs)

        hours_logged = round(total_minutes / 60, 3)
        h, m = divmod(total_minutes, 60)
        hours_logged_label = f"{h}h {m}m"

        progress = min(round(hours_logged / weekly_target_hours * 100, 2) if weekly_target_hours else 0.0, 100.0)

        # ── Avg clock-in time ─────────────────────────────────────────────────
        avg_clock_in_time: str | None = None
        is_on_schedule = False

        if clock_in_seconds_list:
            avg_secs = int(sum(clock_in_seconds_list) / len(clock_in_seconds_list))
            avg_h, rem = divmod(avg_secs, 3600)
            avg_m = rem // 60
            # Format as 12-hour AM/PM
            period = "AM" if avg_h < 12 else "PM"
            h12 = avg_h % 12 or 12
            avg_clock_in_time = f"{h12:02d}:{avg_m:02d} {period}"

            # Compare against shift start + grace
            shift = await self._repo.get_default_shift()
            if shift:
                from datetime import datetime as _dt
                shift_limit = _dt.combine(today, shift.start_time)
                from datetime import timedelta as _td
                shift_limit += _td(minutes=shift.grace_minutes)
                is_on_schedule = avg_secs <= (shift_limit.hour * 3600 + shift_limit.minute * 60)
            else:
                # No shift configured — treat as on schedule
                is_on_schedule = True

        # ── Streak calculation ────────────────────────────────────────────────
        # Present-family statuses (same set as monthly summary)
        PRESENT_STATUSES = {
            AttendanceStatus.PRESENT,
            AttendanceStatus.WFH,
            AttendanceStatus.REGULARISED,
            AttendanceStatus.OVERTIME,
            AttendanceStatus.PERMISSION,
            AttendanceStatus.LATE,
            AttendanceStatus.HALF_DAY_FIRST,
            AttendanceStatus.HALF_DAY_SECOND,
        }

        all_present_dates: set[date] = set(
            await self._repo.get_all_present_dates(employee_id)
        )

        def _compute_streaks(present_set: set[date]) -> tuple[int, int]:
            """Return (current_streak, personal_best_streak).

            A streak counts only working days (Mon–Fri).
            Weekends are skipped transparently (Fri→Mon is still consecutive).
            """
            if not present_set:
                return 0, 0

            # Current streak: walk backwards from today
            current = 0
            cursor = today
            while True:
                if cursor.weekday() >= 5:          # weekend — skip
                    cursor -= timedelta(days=1)
                    continue
                if cursor in present_set:
                    current += 1
                    cursor -= timedelta(days=1)
                else:
                    break

            # Personal best: scan all present dates sorted
            sorted_dates = sorted(present_set)
            best = 0
            run = 0
            prev: date | None = None

            for d in sorted_dates:
                if d.weekday() >= 5:               # skip weekends
                    continue
                if prev is None:
                    run = 1
                else:
                    # Gap check: allow a gap only if all skipped days are weekends
                    gap = (d - prev).days
                    skipped_weekdays = sum(
                        1 for i in range(1, gap)
                        if (prev + timedelta(days=i)).weekday() < 5
                    )
                    if skipped_weekdays == 0:       # continuous (weekends bridged)
                        run += 1
                    else:
                        run = 1
                best = max(best, run)
                prev = d

            return current, best

        current_streak, personal_best_streak = _compute_streaks(all_present_dates)

        return WeeklyStatsResponse(
            week_start=week_start,
            week_end=week_end,
            hours_logged=hours_logged,
            hours_logged_label=hours_logged_label,
            weekly_target_hours=weekly_target_hours,
            hours_progress_percent=progress,
            avg_clock_in_time=avg_clock_in_time,
            is_on_schedule=is_on_schedule,
            current_streak=current_streak,
            personal_best_streak=personal_best_streak,
        )
