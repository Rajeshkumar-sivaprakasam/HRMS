import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.employee import (
    AccountType,
    EmployeeStatus,
    EmploymentType,
    Gender,
    WorkLocationType,
)


class Employee(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "employees"

    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Employment
    status: Mapped[EmployeeStatus] = mapped_column(
        String(30), nullable=False, default=EmployeeStatus.ACTIVE
    )
    employment_type: Mapped[EmploymentType] = mapped_column(
        String(30), nullable=False, default=EmploymentType.FULL_TIME
    )
    work_location_type: Mapped[WorkLocationType] = mapped_column(
        String(30), nullable=False, default=WorkLocationType.OFFICE
    )
    date_of_joining: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_of_leaving: Mapped[date | None] = mapped_column(Date, nullable=True)
    probation_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notice_period_days: Mapped[int | None] = mapped_column(nullable=True)

    # Org
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    designation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("designations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    work_location_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("work_locations.id", ondelete="SET NULL"), nullable=True
    )
    reporting_manager_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Personal
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")

    # Bank
    bank_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    account_type: Mapped[AccountType | None] = mapped_column(String(20), nullable=True)

    # Statutory
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    aadhar_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # PF Details
    pf_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Enabled, Not Eligible, etc.
    pf_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pf_uan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Universal Account Number
    pf_join_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    pf_account_name: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # ESI Details
    esic_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    esi_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Eligible, Not Eligible

    # PT Details
    pt_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pt_registered_location: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Emergency contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_relation: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Current salary (denormalized for quick access)
    current_ctc: Mapped[float | None] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="employee", lazy="noload")  # noqa: F821
    department: Mapped["Department"] = relationship(  # noqa: F821
        "Department",
        primaryjoin="Employee.department_id == Department.id",
        foreign_keys="[Employee.department_id]",
        lazy="noload",
    )
    designation: Mapped["Designation"] = relationship("Designation", lazy="noload")  # noqa: F821
    work_location: Mapped["WorkLocation"] = relationship("WorkLocation", lazy="noload")  # noqa: F821
    reporting_manager: Mapped["Employee"] = relationship(
        "Employee", remote_side="Employee.id", lazy="noload"
    )
    documents: Mapped[list["EmployeeDocument"]] = relationship(  # noqa: F821
        "EmployeeDocument", foreign_keys="[EmployeeDocument.employee_id]", back_populates="employee", lazy="noload"
    )


class EmployeeDocument(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "employee_documents"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )

    employee: Mapped[Employee] = relationship(
        "Employee", foreign_keys=[employee_id], back_populates="documents", lazy="noload"
    )
