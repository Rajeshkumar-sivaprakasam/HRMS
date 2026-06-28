from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance import (
    AttendanceRecord,
    AttendanceRegularisation,
    EmployeeShiftAssignment,
    ShiftSchedule,
)
from app.models.department import Department, Designation
from app.models.employee import Employee
from app.models.holiday import Holiday
from app.shared.utils.filter_builder import apply_sort


class AttendanceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_record(self, employee_id: uuid.UUID, attendance_date: date) -> AttendanceRecord | None:
        stmt = select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.attendance_date == attendance_date,
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_record_by_id(self, record_id: uuid.UUID) -> AttendanceRecord | None:
        stmt = select(AttendanceRecord).where(AttendanceRecord.id == record_id)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_records(
        self,
        conditions: Any,
        sort_by: str,
        sort_order: str,
        offset: int,
        limit: int,
        paginate: bool,
    ) -> tuple[list[AttendanceRecord], int]:
        from sqlalchemy import func

        count_stmt = select(func.count()).select_from(AttendanceRecord).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()

        stmt = (
            select(AttendanceRecord)
            .where(conditions)
            .options(
                selectinload(AttendanceRecord.employee).selectinload(Employee.department),
                selectinload(AttendanceRecord.employee).selectinload(Employee.designation),
            )
        )
        allowed = ["attendance_date", "created_at", "status"]
        stmt = apply_sort(stmt, AttendanceRecord, sort_by, sort_order, allowed)
        if paginate:
            stmt = stmt.offset(offset).limit(limit)
        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows), total

    async def list_records_for_export(
        self,
        conditions: Any,
        sort_by: str,
        sort_order: str,
    ) -> list[AttendanceRecord]:
        """Full result set (no pagination) used by the CSV export endpoint."""
        stmt = (
            select(AttendanceRecord)
            .where(conditions)
            .options(
                selectinload(AttendanceRecord.employee).selectinload(Employee.department),
                selectinload(AttendanceRecord.employee).selectinload(Employee.designation),
            )
        )
        allowed = ["attendance_date", "created_at", "status"]
        stmt = apply_sort(stmt, AttendanceRecord, sort_by, sort_order, allowed)
        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows)

    async def save_record(self, record: AttendanceRecord) -> AttendanceRecord:
        self._db.add(record)
        await self._db.flush()
        await self._db.refresh(record)
        return record

    async def get_regularisation(self, reg_id: uuid.UUID) -> AttendanceRegularisation | None:
        stmt = select(AttendanceRegularisation).where(
            AttendanceRegularisation.id == reg_id,
            AttendanceRegularisation.deleted_at.is_(None),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_regularisations(self, conditions: Any) -> list[AttendanceRegularisation]:
        stmt = select(AttendanceRegularisation).where(conditions).order_by(
            AttendanceRegularisation.created_at.desc()
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_regularisation(self, reg: AttendanceRegularisation) -> AttendanceRegularisation:
        self._db.add(reg)
        await self._db.flush()
        await self._db.refresh(reg)
        return reg

    async def get_default_shift(self) -> ShiftSchedule | None:
        stmt = select(ShiftSchedule).where(
            ShiftSchedule.is_default.is_(True), ShiftSchedule.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_shifts(self) -> list[ShiftSchedule]:
        stmt = select(ShiftSchedule).where(ShiftSchedule.deleted_at.is_(None)).order_by(ShiftSchedule.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_shift(self, shift: ShiftSchedule) -> ShiftSchedule:
        self._db.add(shift)
        await self._db.flush()
        await self._db.refresh(shift)
        return shift

    async def get_monthly_records(
        self, employee_id: uuid.UUID, from_date: date, to_date: date
    ) -> list[AttendanceRecord]:
        """Return all attendance records for *employee_id* within [from_date, to_date]."""
        stmt = (
            select(AttendanceRecord)
            .where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.attendance_date >= from_date,
                AttendanceRecord.attendance_date <= to_date,
            )
            .order_by(AttendanceRecord.attendance_date)
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def get_public_holidays_for_month(self, from_date: date, to_date: date) -> list[date]:
        """Return non-optional public holiday dates that fall within [from_date, to_date]."""
        stmt = select(Holiday.holiday_date).where(
            Holiday.holiday_date >= from_date,
            Holiday.holiday_date <= to_date,
            Holiday.is_optional.is_(False),
            Holiday.deleted_at.is_(None),
        )
        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows)

    async def get_all_present_dates(self, employee_id: uuid.UUID) -> list[date]:
        """Return every date the employee has a 'present-family' attendance record, sorted ASC.

        Used to compute the all-time personal-best streak.
        """
        PRESENT_STATUSES = (
            "P", "WFH", "R", "OT", "PE", "LT",   # full-present statuses
            "HD_FH", "HD_SH",                       # half-days count as present for streak
        )
        stmt = (
            select(AttendanceRecord.attendance_date)
            .where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.status.in_(PRESENT_STATUSES),
            )
            .order_by(AttendanceRecord.attendance_date)
        )
        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows)
