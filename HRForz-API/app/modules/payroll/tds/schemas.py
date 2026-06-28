import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import TaxRegime


class TDSDeclarationCreateRequest(BaseModel):
    employee_id: uuid.UUID
    financial_year: str = Field(pattern=r"^\d{4}-\d{2}$")
    tax_regime: TaxRegime = TaxRegime.NEW
    declared_amount: float = 0
    declaration_data: dict | None = None


class TDSDeclarationUpdateRequest(BaseModel):
    tax_regime: TaxRegime | None = None
    declared_amount: float | None = None
    approved_amount: float | None = None
    status: str | None = None
    declaration_data: dict | None = None


class TDSDeclarationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    financial_year: str
    tax_regime: TaxRegime
    declared_amount: float
    approved_amount: float
    status: str
