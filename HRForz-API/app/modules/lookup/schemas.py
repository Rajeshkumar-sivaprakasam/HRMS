import uuid
from pydantic import BaseModel, ConfigDict, Field


class AccountTypeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str | None = Field(None, max_length=30)
    description: str | None = None
    is_active: bool = True


class AccountTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str | None
    description: str | None
    is_active: bool


class LeavePlanRequest(BaseModel):
    country: str = Field(min_length=1, max_length=100)
    leave_types: dict[str, int] = Field(description="Leave types with allocated days. E.g., {'CL': 12, 'SL': 12, 'PL': 20}")
    description: str | None = None
    is_active: bool = True


class LeavePlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    country: str
    leave_types: dict[str, int]
    description: str | None
    is_active: bool


class LeavePlanDropdownItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    country: str
    leave_types: dict[str, int]
