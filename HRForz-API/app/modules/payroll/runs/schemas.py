import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import PayrollRunStatus


class PayrollRunInitiateRequest(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2020)
    remarks: str | None = None


class PayrollRunActionRequest(BaseModel):
    remarks: str | None = None


class PayrollAdjustmentCreateRequest(BaseModel):
    employee_id: uuid.UUID
    month: int = Field(ge=1, le=12)
    year: int
    adjustment_type: str
    amount: float
    reason: str = Field(min_length=3)


class PayrollRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    month: int
    year: int
    status: PayrollRunStatus
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net: float
    processed_by: uuid.UUID | None
    processed_at: datetime | None
    approved_by: uuid.UUID | None
    approved_at: datetime | None
    locked_at: datetime | None
    remarks: str | None
