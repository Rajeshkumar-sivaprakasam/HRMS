import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.leave import LeaveDurationType, LeaveStatus, LeaveType


class LeavePolicy(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leave_policies"

    leave_type: Mapped[LeaveType] = mapped_column(String(10), nullable=False, unique=True)
    annual_quota: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False)
    carry_forward_limit: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    max_consecutive_days: Mapped[int | None] = mapped_column(nullable=True)
    is_paid: Mapped[bool] = mapped_column(nullable=False, default=True)
    requires_approval: Mapped[bool] = mapped_column(nullable=False, default=True)
    min_days_notice: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class LeaveBalance(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "leave_balances"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    entitled: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    taken: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    carried_forward: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    encashed: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    lop_days: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)

    @property
    def available(self) -> float:
        return float(self.entitled) + float(self.carried_forward) - float(self.taken)

    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821


class LeaveRequest(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leave_requests"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(String(10), nullable=False)
    duration_type: Mapped[LeaveDurationType] = mapped_column(String(20), nullable=False)
    from_date: Mapped[date] = mapped_column(Date, nullable=False)
    to_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_count: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(
        String(20), nullable=False, default=LeaveStatus.PENDING
    )
    applied_on: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )
    approver: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[approved_by], lazy="noload"
    )
