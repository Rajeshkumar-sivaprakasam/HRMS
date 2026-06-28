from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import (
    BusinessRuleViolation,
    InsufficientLeaveBalance,
    NotFound,
)
from app.models.leave import LeaveBalance, LeaveRequest
from app.modules.leaves.repository import LeaveRepository
from app.modules.leaves.schemas import (
    LeaveActionRequest,
    LeaveCancelRequest,
    LeavePolicyUpdateRequest,
    LeaveRequestCreate,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.leave import LeaveStatus, LeaveType
from app.shared.schemas.listing import ListingRequest
from app.shared.utils.filter_builder import FilterBuilder


def _calc_working_days(from_date: date, to_date: date, duration_type: str) -> float:
    from datetime import timedelta
    delta = (to_date - from_date).days + 1
    if duration_type in ("FIRST_HALF", "SECOND_HALF"):
        return 0.5
    return float(delta)


class LeaveService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = LeaveRepository(db)

    async def apply(self, payload: LeaveRequestCreate, current_user: CurrentUser) -> LeaveRequest:
        year = payload.from_date.year
        days = _calc_working_days(payload.from_date, payload.to_date, payload.duration_type.value)

        if payload.leave_type != LeaveType.LOP:
            balance = await self._repo.get_balance(current_user.employee_id, payload.leave_type, year)
            if not balance or balance.available < days:
                raise InsufficientLeaveBalance()

        req = LeaveRequest(
            employee_id=current_user.employee_id,
            leave_type=payload.leave_type,
            duration_type=payload.duration_type,
            from_date=payload.from_date,
            to_date=payload.to_date,
            days_count=days,
            reason=payload.reason,
            status=LeaveStatus.PENDING,
            applied_on=datetime.utcnow(),
        )
        return await self._repo.save_request(req)

    async def action(self, req_id: uuid.UUID, payload: LeaveActionRequest, actor: CurrentUser) -> LeaveRequest:
        req = await self._repo.get_request_by_id(req_id)
        if not req:
            raise NotFound("Leave request not found")
        if req.status != LeaveStatus.PENDING:
            raise BusinessRuleViolation("Leave request already actioned")

        req.status = payload.status
        req.approved_by = actor.employee_id
        req.approved_at = datetime.utcnow()
        req.rejection_reason = payload.rejection_reason

        if payload.status == LeaveStatus.APPROVED and req.leave_type != LeaveType.LOP:
            balance = await self._repo.get_balance(req.employee_id, req.leave_type, req.from_date.year)
            if balance:
                balance.taken = float(balance.taken) + float(req.days_count)
                await self._repo.save_balance(balance)

        return await self._repo.save_request(req)

    async def cancel(self, req_id: uuid.UUID, payload: LeaveCancelRequest, current_user: CurrentUser) -> LeaveRequest:
        req = await self._repo.get_request_by_id(req_id)
        if not req:
            raise NotFound("Leave request not found")
        if req.employee_id != current_user.employee_id:
            raise BusinessRuleViolation("Cannot cancel another employee's leave")
        if req.status not in (LeaveStatus.PENDING, LeaveStatus.APPROVED):
            raise BusinessRuleViolation("Cannot cancel this leave request")

        was_approved = req.status == LeaveStatus.APPROVED
        req.status = LeaveStatus.CANCELLED
        req.cancelled_reason = payload.reason

        if was_approved and req.leave_type != LeaveType.LOP:
            balance = await self._repo.get_balance(req.employee_id, req.leave_type, req.from_date.year)
            if balance:
                balance.taken = max(0, float(balance.taken) - float(req.days_count))
                await self._repo.save_balance(balance)

        return await self._repo.save_request(req)

    async def list(self, request: ListingRequest, current_user: CurrentUser) -> tuple[list[LeaveRequest], int]:
        f = request.filter or {}
        emp_id = None if current_user.is_hr_or_above() else current_user.employee_id
        status = getattr(f, "status", None) if hasattr(f, "status") else None
        leave_type = getattr(f, "leave_type", None) if hasattr(f, "leave_type") else None
        from_date = getattr(f, "from_date", None) if hasattr(f, "from_date") else None
        to_date = getattr(f, "to_date", None) if hasattr(f, "to_date") else None
        sort_by = getattr(f, "sort_by", "applied_on") if hasattr(f, "sort_by") else "applied_on"
        sort_order = getattr(f, "sort_order", "desc") if hasattr(f, "sort_order") else "desc"

        conditions = (
            FilterBuilder(LeaveRequest)
            .soft_delete()
            .eq("employee_id", emp_id)
            .eq("status", status)
            .eq("leave_type", leave_type)
            .date_range("from_date", from_date, to_date)
            .build()
        )
        return await self._repo.list_requests(conditions, sort_by, sort_order, request.offset, request.limit, request.paginationFlag)

    async def get_balances(self, employee_id: uuid.UUID, year: int) -> list[LeaveBalance]:
        return await self._repo.get_balances_for_employee(employee_id, year)

    async def list_policies(self):
        return await self._repo.list_policies()

    async def update_policy(self, leave_type: LeaveType, payload: LeavePolicyUpdateRequest):
        policy = await self._repo.get_policy(leave_type)
        if not policy:
            raise NotFound("Leave policy not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(policy, field, value)
        return await self._repo.save_policy(policy)
