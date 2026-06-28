import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import PaymentMode, TaxRegime


class EmployeeSalaryCreateRequest(BaseModel):
    employee_id: uuid.UUID
    structure_id: uuid.UUID | None = None
    ctc: float = Field(gt=0)
    effective_from: date
    payment_mode: PaymentMode = PaymentMode.BANK_TRANSFER
    tax_regime: TaxRegime = TaxRegime.NEW


class EmployeeSalaryUpdateRequest(BaseModel):
    structure_id: uuid.UUID | None = None
    ctc: float | None = Field(None, gt=0)
    effective_from: date | None = None
    payment_mode: PaymentMode | None = None
    tax_regime: TaxRegime | None = None


class EmployeeSalaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    structure_id: uuid.UUID | None
    ctc: float
    basic: float
    hra: float
    effective_from: date
    effective_to: date | None
    payment_mode: PaymentMode
    tax_regime: TaxRegime
    is_current: bool
