import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.helpdesk import HelpdeskTicket
from app.modules.helpdesk.schemas import (
    CategoryResponse,
    HelpdeskCategoryCreateRequest,
    TicketCommentRequest,
    TicketCreateRequest,
    TicketResponse,
    TicketUpdateRequest,
)
from app.modules.helpdesk.service import HelpdeskService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import ApiResponse, PaginatedResponse

Db = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/helpdesk", tags=["Helpdesk"])


@router.post("/categories", response_model=ApiResponse[CategoryResponse], dependencies=[HROnly])
async def create_category(payload: HelpdeskCategoryCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = HelpdeskService(db)
    cat = await svc.create_category(payload)
    return ApiResponse.created(CategoryResponse.model_validate(cat), "Category created")


@router.get("/categories", response_model=ApiResponse[list[CategoryResponse]])
async def list_categories(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = HelpdeskService(db)
    cats = await svc.list_categories()
    return ApiResponse.ok([CategoryResponse.model_validate(c) for c in cats])


@router.post("", response_model=ApiResponse[TicketResponse])
async def create_ticket(
    payload: TicketCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HelpdeskService(db)
    ticket = await svc.create_ticket(payload, current_user)
    return ApiResponse.created(TicketResponse.model_validate(ticket), "Ticket created")


@router.post("/list", response_model=PaginatedResponse[TicketResponse])
async def list_tickets(
    request: ListingRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HelpdeskService(db)
    items, total = await svc.list_tickets(request, current_user)
    return PaginatedResponse.ok(
        [TicketResponse.model_validate(t) for t in items], total, request.page, request.size
    )


@router.patch("/{ticket_id}", response_model=ApiResponse[TicketResponse])
async def update_ticket(
    ticket_id: uuid.UUID,
    payload: TicketUpdateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HelpdeskService(db)
    ticket = await svc.update_ticket(ticket_id, payload, current_user)
    return ApiResponse.ok(TicketResponse.model_validate(ticket), "Ticket updated")


@router.post("/{ticket_id}/comments", response_model=ApiResponse[dict])
async def add_comment(
    ticket_id: uuid.UUID,
    payload: TicketCommentRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HelpdeskService(db)
    comment = await svc.add_comment(ticket_id, payload, current_user)
    return ApiResponse.created({"id": str(comment.id)}, "Comment added")


@router.get("/tickets/open", response_model=ApiResponse[list], dependencies=[HROnly])
async def get_open_tickets(db: Db, limit: int = Query(10, ge=1, le=50)):
    """Get open helpdesk tickets"""
    stmt = select(HelpdeskTicket).where(
        HelpdeskTicket.status == "open",
        HelpdeskTicket.deleted_at.is_(None)
    ).options(
        joinedload(HelpdeskTicket.employee)
    ).order_by(desc(HelpdeskTicket.created_at)).limit(limit)

    tickets = (await db.execute(stmt)).unique().scalars().all()

    data = []
    for ticket in tickets:
        requester = ticket.employee
        data.append({
            "ticket_id": str(ticket.id),
            "ticket_number": ticket.ticket_number,
            "title": ticket.subject,
            "priority": ticket.priority,
            "requester_name": f"{requester.first_name} {requester.last_name}" if requester else "Unknown",
            "status": ticket.status,
            "created_date": ticket.created_at.isoformat(),
            "description": ticket.description[:100] + "..." if len(ticket.description) > 100 else ticket.description,
        })

    return ApiResponse.ok(data)
