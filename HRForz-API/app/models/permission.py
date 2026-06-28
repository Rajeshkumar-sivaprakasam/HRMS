import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.permission import ExcessAction, PermissionStatus, PermissionType


class PermissionPolicy(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "permission_policies"

    max_hours_per_day: Mapped[float] = mapped_column(nullable=False, default=2.0)
    max_hours_per_month: Mapped[float] = mapped_column(nullable=False, default=8.0)
    excess_action: Mapped[ExcessAction] = mapped_column(
        String(20), nullable=False, default=ExcessAction.LOP
    )
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class PermissionRequest(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "permission_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission_date: Mapped[date] = mapped_column(Date, nullable=False)
    permission_type: Mapped[PermissionType] = mapped_column(String(20), nullable=False)
    from_time: Mapped[time] = mapped_column(Time, nullable=False)
    to_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_hours: Mapped[float] = mapped_column(nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[PermissionStatus] = mapped_column(
        String(20), nullable=False, default=PermissionStatus.PENDING
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )
    approver: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[approved_by], lazy="noload"
    )
