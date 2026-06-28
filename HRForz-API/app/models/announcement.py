import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Announcement(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "announcements"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(
        String(30), nullable=False, default="all"
    )
    target_department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    published_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    expires_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False)
    is_pinned: Mapped[bool] = mapped_column(nullable=False, default=False)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    publisher: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821
