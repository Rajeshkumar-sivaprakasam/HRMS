import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.helpdesk import TicketPriority, TicketStatus


class HelpdeskCategory(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "helpdesk_categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    tickets: Mapped[list["HelpdeskTicket"]] = relationship(
        "HelpdeskTicket", back_populates="category", lazy="noload"
    )


class HelpdeskTicket(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "helpdesk_tickets"

    ticket_number: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("helpdesk_categories.id", ondelete="SET NULL"), nullable=True
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(
        String(20), nullable=False, default=TicketPriority.MEDIUM
    )
    status: Mapped[TicketStatus] = mapped_column(
        String(20), nullable=False, default=TicketStatus.OPEN
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )
    category: Mapped[HelpdeskCategory] = relationship(
        "HelpdeskCategory", back_populates="tickets", lazy="noload"
    )
    comments: Mapped[list["HelpdeskComment"]] = relationship(
        "HelpdeskComment", back_populates="ticket", lazy="noload"
    )


class HelpdeskComment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "helpdesk_comments"

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("helpdesk_tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(nullable=False, default=False)

    ticket: Mapped[HelpdeskTicket] = relationship(
        "HelpdeskTicket", back_populates="comments", lazy="noload"
    )
    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821
