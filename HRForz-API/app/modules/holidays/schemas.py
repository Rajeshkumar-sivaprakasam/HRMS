import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, computed_field


class HolidayCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    holiday_date: date
    holiday_type_id: uuid.UUID
    description: str | None = None
    is_optional: bool = False
    work_location_id: uuid.UUID | None = None


class HolidayUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    holiday_date: date | None = None
    holiday_type_id: uuid.UUID | None = None
    description: str | None = None
    is_optional: bool | None = None
    work_location_id: uuid.UUID | None = None


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    holiday_date: date
    holiday_type_id: uuid.UUID
    description: str | None
    year: int
    is_optional: bool
    work_location_id: uuid.UUID | None
    work_location_name: str | None = None
    holiday_type_name: str | None = None
