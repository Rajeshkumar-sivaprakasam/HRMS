import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import TimestampMixin, UUIDMixin
from app.shared.enums.employee import AccountType, EmploymentType, Gender
from app.shared.enums.onboarding import DocumentCategory, DocumentStatus, OnboardingStatus


class EmployeeOnboarding(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "employee_onboardings"

    auto_employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[OnboardingStatus] = mapped_column(String(20), nullable=False, default=OnboardingStatus.DRAFT)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # ── Step 1: Personal ────────────────────────────────────────────────────
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    personal_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    current_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    permanent_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_relation: Mapped[str | None] = mapped_column(String(50), nullable=True)
    profile_picture_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Step 2: Employment ──────────────────────────────────────────────────
    job_title: Mapped[str | None] = mapped_column(String(150), nullable=True)
    job_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sub_department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade_band: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    work_location_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("work_locations.id", ondelete="SET NULL"), nullable=True
    )
    employment_type: Mapped[EmploymentType | None] = mapped_column(String(30), nullable=True)
    date_of_joining: Mapped[date | None] = mapped_column(Date, nullable=True)
    shift_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("shift_schedules.id", ondelete="SET NULL"), nullable=True
    )
    probation_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notice_period_days: Mapped[int | None] = mapped_column(nullable=True)
    reporting_manager_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    buddy_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )

    # ── Step 3: CTC & Bank ──────────────────────────────────────────────────
    annual_ctc: Mapped[float | None] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=True)
    ctc_effective_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary_structure_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("salary_structures.id", ondelete="SET NULL"), nullable=True
    )
    ctc_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bank_branch: Mapped[str | None] = mapped_column(String(150), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    account_type: Mapped[AccountType | None] = mapped_column(String(20), nullable=True)

    # ── Step 4: Leave & Org ─────────────────────────────────────────────────
    leave_plan: Mapped[str | None] = mapped_column(String(100), nullable=True)
    holiday_calendar: Mapped[str | None] = mapped_column(String(100), nullable=True)
    leave_allocations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cost_centre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_unit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    legal_entity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    workspace_team: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Activation meta ─────────────────────────────────────────────────────
    work_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    activated_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────────
    documents: Mapped[list["OnboardingDocument"]] = relationship(
        "OnboardingDocument", back_populates="onboarding", lazy="noload", cascade="all, delete-orphan"
    )
    department: Mapped["Department"] = relationship(  # noqa: F821
        "Department", foreign_keys=[department_id], lazy="noload"
    )
    work_location: Mapped["WorkLocation"] = relationship(  # noqa: F821
        "WorkLocation", foreign_keys=[work_location_id], lazy="noload"
    )
    reporting_manager: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[reporting_manager_id], lazy="noload"
    )


class OnboardingDocument(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "onboarding_documents"

    onboarding_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employee_onboardings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[DocumentCategory] = mapped_column(String(50), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[DocumentStatus] = mapped_column(String(20), nullable=False, default=DocumentStatus.UPLOADED)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    onboarding: Mapped[EmployeeOnboarding] = relationship(
        "EmployeeOnboarding", back_populates="documents", lazy="noload"
    )
