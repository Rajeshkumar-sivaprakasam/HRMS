from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Nationality(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "nationalities"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(10), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class BloodGroup(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "blood_groups"

    name: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(10), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class Relationship(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "relationships"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class MaritalStatus(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "marital_statuses"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class HolidayType(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "holiday_types"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class AccountType(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "account_types"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class Country(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "countries"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    code: Mapped[str | None] = mapped_column(String(10), nullable=True, unique=True, index=True)
    dial_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class LeavePlan(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leave_plans"

    country: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    leave_types: Mapped[dict] = mapped_column(sa.JSON, nullable=False, default={})
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
