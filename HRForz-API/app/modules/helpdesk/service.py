import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Forbidden, NotFound
from app.models.helpdesk import HelpdeskCategory, HelpdeskComment, HelpdeskTicket
from app.modules.helpdesk.schemas import (
    HelpdeskCategoryCreateRequest,
    TicketCommentRequest,
    TicketCreateRequest,
    TicketUpdateRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.helpdesk import TicketStatus
from app.shared.schemas.listing import ListingRequest
from app.shared.utils.filter_builder import FilterBuilder


class HelpdeskService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_category(self, payload: HelpdeskCategoryCreateRequest) -> HelpdeskCategory:
        cat = HelpdeskCategory(name=payload.name, description=payload.description)
        self._db.add(cat)
        await self._db.flush()
        await self._db.refresh(cat)
        return cat

    async def list_categories(self) -> list[HelpdeskCategory]:
        stmt = select(HelpdeskCategory).where(
            HelpdeskCategory.deleted_at.is_(None), HelpdeskCategory.is_active.is_(True)
        ).order_by(HelpdeskCategory.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def create_ticket(self, payload: TicketCreateRequest, current_user: CurrentUser) -> HelpdeskTicket:
        count_stmt = select(func.count()).select_from(HelpdeskTicket)
        count = (await self._db.execute(count_stmt)).scalar_one()
        ticket_number = f"TKT{str(count + 1).zfill(5)}"

        ticket = HelpdeskTicket(
            ticket_number=ticket_number,
            employee_id=current_user.employee_id,
            category_id=payload.category_id,
            subject=payload.subject,
            description=payload.description,
            priority=payload.priority,
            status=TicketStatus.OPEN,
        )
        self._db.add(ticket)
        await self._db.flush()
        await self._db.refresh(ticket)
        return ticket

    async def list_tickets(self, request: ListingRequest, current_user: CurrentUser) -> tuple[list[HelpdeskTicket], int]:
        from sqlalchemy import func as sa_func
        f = request.filter or {}
        emp_id = None if current_user.is_hr_or_above() else current_user.employee_id
        status = getattr(f, "status", None) if hasattr(f, "status") else None
        sort_by = getattr(f, "sort_by", "created_at") if hasattr(f, "sort_by") else "created_at"
        sort_order = getattr(f, "sort_order", "desc") if hasattr(f, "sort_order") else "desc"

        from app.shared.utils.filter_builder import apply_sort
        conditions = (
            FilterBuilder(HelpdeskTicket)
            .soft_delete()
            .eq("employee_id", emp_id)
            .eq("status", status)
            .build()
        )
        count_stmt = select(sa_func.count()).select_from(HelpdeskTicket).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()
        stmt = select(HelpdeskTicket).where(conditions)
        stmt = apply_sort(stmt, HelpdeskTicket, sort_by, sort_order, ["created_at", "status", "priority"])
        if request.paginationFlag:
            stmt = stmt.offset(request.offset).limit(request.limit)
        rows = list((await self._db.execute(stmt)).scalars().all())
        return rows, total

    async def update_ticket(self, ticket_id: uuid.UUID, payload: TicketUpdateRequest, actor: CurrentUser) -> HelpdeskTicket:
        ticket = await self._get_or_404(ticket_id)
        if not actor.is_hr_or_above() and ticket.employee_id != actor.employee_id:
            raise Forbidden()
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(ticket, field, value)
        if payload.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        elif payload.status == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
        self._db.add(ticket)
        await self._db.flush()
        await self._db.refresh(ticket)
        return ticket

    async def add_comment(self, ticket_id: uuid.UUID, payload: TicketCommentRequest, actor: CurrentUser) -> HelpdeskComment:
        ticket = await self._get_or_404(ticket_id)
        comment = HelpdeskComment(
            ticket_id=ticket_id,
            employee_id=actor.employee_id,
            comment=payload.comment,
            is_internal=payload.is_internal,
        )
        self._db.add(comment)
        await self._db.flush()
        await self._db.refresh(comment)
        return comment

    async def _get_or_404(self, ticket_id: uuid.UUID) -> HelpdeskTicket:
        stmt = select(HelpdeskTicket).where(
            HelpdeskTicket.id == ticket_id, HelpdeskTicket.deleted_at.is_(None)
        )
        ticket = (await self._db.execute(stmt)).scalar_one_or_none()
        if not ticket:
            raise NotFound("Ticket not found")
        return ticket
