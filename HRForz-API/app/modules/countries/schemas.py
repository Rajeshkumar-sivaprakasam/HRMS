import uuid

from pydantic import BaseModel, ConfigDict, Field


class CountryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str | None = Field(None, max_length=10)
    dial_code: str | None = Field(None, max_length=10)
    description: str | None = None


class CountryUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    code: str | None = Field(None, max_length=10)
    dial_code: str | None = Field(None, max_length=10)
    description: str | None = None
    is_active: bool | None = None


class CountryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str | None
    dial_code: str | None
    description: str | None
    is_active: bool
