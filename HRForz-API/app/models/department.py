import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Department(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    head_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    designations: Mapped[list["Designation"]] = relationship(  # noqa: F821
        "Designation", back_populates="department", lazy="noload"
    )


class Designation(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "designations"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[int | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    department: Mapped[Department] = relationship(
        "Department", back_populates="designations", lazy="noload"
    )


class WorkLocation(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "work_locations"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
