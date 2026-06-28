import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import SalaryRevisionType


class SalaryRevisionCreateRequest(BaseModel):
    employee_id: uuid.UUID
    revision_type: SalaryRevisionType
    new_ctc: float = Field(gt=0)
    effective_from: date
    reason: str | None = None


class SalaryRevisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    revision_type: SalaryRevisionType
    old_ctc: float
    new_ctc: float
    hike_percentage: float | None
    effective_from: date
    reason: str | None
    approved_by: uuid.UUID | None
    letter_url: str | None
