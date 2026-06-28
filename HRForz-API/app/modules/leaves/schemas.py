import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.shared.enums.leave import LeaveDurationType, LeaveStatus, LeaveType


class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    duration_type: LeaveDurationType = LeaveDurationType.FULL_DAY
    from_date: date
    to_date: date
    reason: str = Field(min_length=5)

    @model_validator(mode="after")
    def validate_dates(self) -> "LeaveRequestCreate":
        if self.to_date < self.from_date:
            raise ValueError("to_date must be >= from_date")
        return self


class LeaveActionRequest(BaseModel):
    status: LeaveStatus
    rejection_reason: str | None = None


class LeaveCancelRequest(BaseModel):
    reason: str = Field(min_length=3)


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type: LeaveType
    duration_type: LeaveDurationType
    from_date: date
    to_date: date
    days_count: float
    reason: str
    status: LeaveStatus
    applied_on: datetime
    approved_by: uuid.UUID | None
    approved_at: datetime | None
    rejection_reason: str | None


class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_type: LeaveType
    year: int
    entitled: float
    taken: float
    carried_forward: float
    available: float
    lop_days: float


class LeavePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    leave_type: LeaveType
    annual_quota: float
    carry_forward_limit: float
    max_consecutive_days: int | None
    is_paid: bool
    requires_approval: bool
    min_days_notice: int
    is_active: bool


class LeavePolicyUpdateRequest(BaseModel):
    annual_quota: float | None = None
    carry_forward_limit: float | None = None
    max_consecutive_days: int | None = None
    is_paid: bool | None = None
    requires_approval: bool | None = None
    min_days_notice: int | None = None
    is_active: bool | None = None
