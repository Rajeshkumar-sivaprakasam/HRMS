import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.helpdesk import TicketPriority, TicketStatus


class HelpdeskCategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class TicketCreateRequest(BaseModel):
    category_id: uuid.UUID | None = None
    subject: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketUpdateRequest(BaseModel):
    status: TicketStatus | None = None
    assigned_to: uuid.UUID | None = None
    priority: TicketPriority | None = None


class TicketCommentRequest(BaseModel):
    comment: str = Field(min_length=1)
    is_internal: bool = False


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ticket_number: str
    employee_id: uuid.UUID
    category_id: uuid.UUID | None
    subject: str
    description: str
    priority: TicketPriority
    status: TicketStatus
    assigned_to: uuid.UUID | None
    resolved_at: datetime | None
    closed_at: datetime | None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
