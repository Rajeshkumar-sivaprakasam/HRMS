import uuid

from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(None, max_length=30)
    description: str | None = None
    head_employee_id: uuid.UUID | None = None


class DepartmentUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    code: str | None = Field(None, max_length=30)
    description: str | None = None
    head_employee_id: uuid.UUID | None = None
    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str | None
    description: str | None
    head_employee_id: uuid.UUID | None
    is_active: bool
