import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db.base import Base
from app.core.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.shared.enums.payroll import (
    AdjustmentType,
    ComponentCategory,
    FnFStatus,
    PaymentMode,
    PayrollRunStatus,
    SalaryCalcType,
    SalaryComponentType,
    SalaryRevisionType,
    TaxRegime,
)


class SalaryComponent(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "salary_components"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    component_type: Mapped[SalaryComponentType] = mapped_column(String(20), nullable=False)
    category: Mapped[ComponentCategory] = mapped_column(String(30), nullable=False)
    calc_type: Mapped[SalaryCalcType] = mapped_column(String(20), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    is_taxable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_pf_applicable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_esi_applicable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class SalaryStructure(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "salary_structures"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    components: Mapped[list["SalaryStructureComponent"]] = relationship(
        "SalaryStructureComponent", back_populates="structure", lazy="noload"
    )


class SalaryStructureComponent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "salary_structure_components"

    structure_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    component_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("salary_components.id", ondelete="CASCADE"), nullable=False
    )
    calc_type_override: Mapped[SalaryCalcType | None] = mapped_column(String(20), nullable=True)
    value_override: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    structure: Mapped[SalaryStructure] = relationship(
        "SalaryStructure", back_populates="components", lazy="noload"
    )
    component: Mapped[SalaryComponent] = relationship("SalaryComponent", lazy="noload")


class EmployeeSalary(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "employee_salaries"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    structure_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("salary_structures.id", ondelete="SET NULL"), nullable=True
    )
    ctc: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    basic: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    hra: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_mode: Mapped[PaymentMode] = mapped_column(
        String(20), nullable=False, default=PaymentMode.BANK_TRANSFER
    )
    tax_regime: Mapped[TaxRegime] = mapped_column(
        String(10), nullable=False, default=TaxRegime.NEW
    )
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821


class PayrollRun(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "payroll_runs"

    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PayrollRunStatus] = mapped_column(
        String(20), nullable=False, default=PayrollRunStatus.NOT_RUN
    )
    total_employees: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_gross: Mapped[float] = mapped_column(Numeric(14, 2, asdecimal=False), nullable=False, default=0)
    total_deductions: Mapped[float] = mapped_column(Numeric(14, 2, asdecimal=False), nullable=False, default=0)
    total_net: Mapped[float] = mapped_column(Numeric(14, 2, asdecimal=False), nullable=False, default=0)
    processed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    payslips: Mapped[list["Payslip"]] = relationship(
        "Payslip", back_populates="payroll_run", lazy="noload"
    )


class Payslip(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payslips"

    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    working_days: Mapped[int] = mapped_column(Integer, nullable=False)
    paid_days: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False)
    lop_days: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    gross_salary: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    total_deductions: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    net_salary: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    pf_employee: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    pf_employer: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    esi_employee: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    esi_employer: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    tds: Mapped[float] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=False, default=0)
    pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    component_breakdown: Mapped[str | None] = mapped_column(Text, nullable=True)

    payroll_run: Mapped[PayrollRun] = relationship(
        "PayrollRun", back_populates="payslips", lazy="noload"
    )
    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821


class SalaryRevision(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "salary_revisions"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    revision_type: Mapped[SalaryRevisionType] = mapped_column(String(20), nullable=False)
    old_ctc: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    new_ctc: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    hike_percentage: Mapped[float | None] = mapped_column(Numeric(6, 2, asdecimal=False), nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    letter_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )


class TDSDeclaration(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "tds_declarations"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False)
    tax_regime: Mapped[TaxRegime] = mapped_column(
        String(10), nullable=False, default=TaxRegime.NEW
    )
    declared_amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    approved_amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    declaration_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", lazy="noload")  # noqa: F821


class FnFSettlement(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "fnf_settlements"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True, unique=True
    )
    last_working_day: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[FnFStatus] = mapped_column(
        String(20), nullable=False, default=FnFStatus.DRAFT
    )
    notice_period_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notice_shortfall_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notice_recovery_amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    leave_encashment_days: Mapped[float] = mapped_column(Numeric(5, 1, asdecimal=False), nullable=False, default=0)
    leave_encashment_amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    gratuity_amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    other_deductions: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    other_earnings: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    net_payable: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False, default=0)
    processed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    settlement_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )


class PayrollAdjustment(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "payroll_adjustments"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    adjustment_type: Mapped[AdjustmentType] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    is_applied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )

    employee: Mapped["Employee"] = relationship(  # noqa: F821
        "Employee", foreign_keys=[employee_id], lazy="noload"
    )
