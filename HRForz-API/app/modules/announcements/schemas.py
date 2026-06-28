import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class AnnouncementCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=10)
    target_audience: str = "all"
    target_department_id: uuid.UUID | None = None
    expires_at: date | None = None
    is_pinned: bool = False


class AnnouncementUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    content: str | None = None
    target_audience: str | None = None
    target_department_id: uuid.UUID | None = None
    expires_at: date | None = None
    is_pinned: bool | None = None
    is_published: bool | None = None


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    target_audience: str
    target_department_id: uuid.UUID | None
    published_by: uuid.UUID | None
    published_at: date | None
    expires_at: date | None
    is_published: bool
    is_pinned: bool
    attachment_url: str | None
