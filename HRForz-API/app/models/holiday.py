from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.department import WorkLocation
    from app.models.lookup import HolidayType


class Holiday(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "holidays"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    holiday_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    holiday_type_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("holiday_types.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    year: Mapped[int] = mapped_column(nullable=False, index=True)
    is_optional: Mapped[bool] = mapped_column(nullable=False, default=False)
    work_location_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("work_locations.id", ondelete="SET NULL"), nullable=True
    )

    holiday_type: Mapped["HolidayType"] = relationship("HolidayType", lazy="noload")  # noqa: F821
    work_location: Mapped["WorkLocation | None"] = relationship(  # noqa: F821
        "WorkLocation", lazy="noload"
    )

    @property
    def work_location_name(self) -> str | None:
        return self.work_location.name if self.work_location else None

    @property
    def holiday_type_name(self) -> str | None:
        return self.holiday_type.name if self.holiday_type else None
