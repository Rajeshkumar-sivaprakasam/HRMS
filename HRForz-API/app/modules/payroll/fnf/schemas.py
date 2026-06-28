import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import FnFStatus


class FnFInitiateRequest(BaseModel):
    employee_id: uuid.UUID
    last_working_day: date
    notice_period_days: int = 0
    notice_shortfall_days: int = 0
    notice_recovery_amount: float = 0
    leave_encashment_days: float = 0
    leave_encashment_amount: float = 0
    gratuity_amount: float = 0
    other_deductions: float = 0
    other_earnings: float = 0
    remarks: str | None = None


class FnFActionRequest(BaseModel):
    status: FnFStatus
    settlement_date: date | None = None
    remarks: str | None = None


class FnFResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    last_working_day: date
    status: FnFStatus
    notice_period_days: int
    notice_shortfall_days: int
    notice_recovery_amount: float
    leave_encashment_days: float
    leave_encashment_amount: float
    gratuity_amount: float
    other_deductions: float
    other_earnings: float
    net_payable: float
    settlement_date: date | None
    remarks: str | None
