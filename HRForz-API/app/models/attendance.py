import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.attendance import (
    AttendanceStatus,
    ClockMethod,
    RegularisationStatus,
)


class AttendanceRecord(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "attendance_records"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[AttendanceStatus] = mapped_column(
        String(10), nullable=False, default=AttendanceStatus.ABSENT
    )
    clock_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    clock_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    clock_in_method: Mapped[ClockMethod | None] = mapped_column(String(20), nullable=True)
    clock_out_method: Mapped[ClockMethod | None] = mapped_column(String(20), nullable=True)
    work_hours: Mapped[float | None] = mapped_column(nullable=True)
    is_late: Mapped[bool] = mapped_column(nullable=False, default=False)
    is_early_out: Mapped[bool] = mapped_column(nullable=False, default=False)
    overtime_hours: Mapped[float | None] = mapped_column(nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821

    @property
    def employee_name(self) -> str | None:
        if self.employee:
            return f"{self.employee.first_name} {self.employee.last_name}"
        return None

    regularisation: Mapped["AttendanceRegularisation | None"] = relationship(  # noqa: F821
        "AttendanceRegularisation",
        back_populates="attendance_record",
        lazy="noload",
        uselist=False,
    )


class AttendanceRegularisation(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "attendance_regularisations"

    attendance_record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requested_clock_in: Mapped[time | None] = mapped_column(Time, nullable=True)
    requested_clock_out: Mapped[time | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[RegularisationStatus] = mapped_column(
        String(20), nullable=False, default=RegularisationStatus.PENDING
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    attendance_record: Mapped[AttendanceRecord] = relationship(
        "AttendanceRecord", back_populates="regularisation", lazy="noload"
    )
    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )


class ShiftSchedule(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "shift_schedules"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    grace_minutes: Mapped[int] = mapped_column(nullable=False, default=15)
    is_default: Mapped[bool] = mapped_column(nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class EmployeeShiftAssignment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "employee_shift_assignments"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shift_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shift_schedules.id", ondelete="CASCADE"), nullable=False
    )
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
