import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.shared.enums.permission import ExcessAction, PermissionStatus, PermissionType


class PermissionCreateRequest(BaseModel):
    permission_date: date
    permission_type: PermissionType
    from_time: time
    to_time: time
    reason: str = Field(min_length=5)

    @model_validator(mode="after")
    def validate_times(self) -> "PermissionCreateRequest":
        if self.to_time <= self.from_time:
            raise ValueError("to_time must be after from_time")
        return self


class PermissionActionRequest(BaseModel):
    status: PermissionStatus
    rejection_reason: str | None = None


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    permission_date: date
    permission_type: PermissionType
    from_time: time
    to_time: time
    duration_hours: float
    reason: str
    status: PermissionStatus
    approved_by: uuid.UUID | None
    approved_at: datetime | None
    rejection_reason: str | None


class PermissionPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    max_hours_per_day: float
    max_hours_per_month: float
    excess_action: ExcessAction
    is_active: bool


class PermissionPolicyUpdateRequest(BaseModel):
    max_hours_per_day: float | None = None
    max_hours_per_month: float | None = None
    excess_action: ExcessAction | None = None
