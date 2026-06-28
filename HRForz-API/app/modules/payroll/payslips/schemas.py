import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class PayslipListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    month: int
    year: int
    working_days: int
    gross_salary: float
    total_deductions: float
    net_salary: float
    is_published: bool
    pdf_url: str | None = None

    @computed_field
    @property
    def pay_period(self) -> str:
        return datetime(self.year, self.month, 1).strftime("%B %Y")

    @computed_field
    @property
    def status(self) -> str:
        return "Paid" if self.is_published else "Pending"

    @computed_field
    @property
    def gross(self) -> float:
        return self.gross_salary

    @computed_field
    @property
    def deductions(self) -> float:
        return self.total_deductions

    @computed_field
    @property
    def net_pay(self) -> float:
        return self.net_salary


class PayslipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    payroll_run_id: uuid.UUID
    employee_id: uuid.UUID
    month: int
    year: int
    working_days: int
    paid_days: float
    lop_days: float
    gross_salary: float
    total_deductions: float
    net_salary: float
    pf_employee: float
    pf_employer: float
    esi_employee: float
    esi_employer: float
    tds: float
    pdf_url: str | None
    is_published: bool
