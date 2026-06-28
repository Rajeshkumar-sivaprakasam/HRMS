import uuid

from pydantic import BaseModel, ConfigDict, Field


class WorkLocationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(None, max_length=30)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "India"


class WorkLocationUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    code: str | None = Field(None, max_length=30)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    is_active: bool | None = None


class WorkLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    is_active: bool
