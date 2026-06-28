import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class CTCSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ctc: float
    fixed: float
    variable: float
    benefits: float
    effective_from: date


class SalaryBreakupComponentResponse(BaseModel):
    component_name: str
    monthly_value: float
    annual_value: float


class SalaryBreakupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    earnings: list[SalaryBreakupComponentResponse]
    deductions: list[SalaryBreakupComponentResponse]
    gross_earnings: float
    total_deductions: float
    net_pay: float


class SalaryRevisionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    revision_type: str
    old_ctc: float
    new_ctc: float
    hike_percentage: float | None
    effective_from: date
    reason: str | None


class PFDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pf_status: str | None
    pf_number: str | None
    pf_uan_number: str | None
    pf_join_date: date | None
    pf_account_name: str | None
    esi_status: str | None
    esic_number: str | None
    pt_state: str | None
    pt_registered_location: str | None
