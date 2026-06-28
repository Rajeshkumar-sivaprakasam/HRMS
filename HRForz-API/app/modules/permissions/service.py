from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import BusinessRuleViolation, NotFound, PermissionLimitExceeded
from app.models.permission import PermissionRequest
from app.modules.permissions.repository import PermissionRepository
from app.modules.permissions.schemas import (
    PermissionActionRequest,
    PermissionCreateRequest,
    PermissionPolicyUpdateRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.permission import PermissionStatus
from app.shared.schemas.listing import ListingRequest
from app.shared.utils.filter_builder import FilterBuilder


class PermissionService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = PermissionRepository(db)

    async def create(self, payload: PermissionCreateRequest, current_user: CurrentUser) -> PermissionRequest:
        from datetime import timedelta
        dt_from = datetime.combine(payload.permission_date, payload.from_time)
        dt_to = datetime.combine(payload.permission_date, payload.to_time)
        duration = (dt_to - dt_from).total_seconds() / 3600

        policy = await self._repo.get_policy()
        if policy:
            if duration > policy.max_hours_per_day:
                raise PermissionLimitExceeded(f"Exceeds daily limit of {policy.max_hours_per_day} hours")
            monthly = await self._repo.get_monthly_hours(
                current_user.employee_id,
                payload.permission_date.year,
                payload.permission_date.month,
            )
            if monthly + duration > policy.max_hours_per_month:
                raise PermissionLimitExceeded(f"Exceeds monthly limit of {policy.max_hours_per_month} hours")

        req = PermissionRequest(
            employee_id=current_user.employee_id,
            permission_date=payload.permission_date,
            permission_type=payload.permission_type,
            from_time=payload.from_time,
            to_time=payload.to_time,
            duration_hours=round(duration, 2),
            reason=payload.reason,
            status=PermissionStatus.PENDING,
        )
        return await self._repo.save(req)

    async def list(self, request: ListingRequest, current_user: CurrentUser) -> tuple[list[PermissionRequest], int]:
        f = request.filter or {}
        emp_id = None if current_user.is_manager_or_above() else current_user.employee_id
        status = getattr(f, "status", None) if hasattr(f, "status") else None
        from_date = getattr(f, "from_date", None) if hasattr(f, "from_date") else None
        to_date = getattr(f, "to_date", None) if hasattr(f, "to_date") else None
        sort_by = getattr(f, "sort_by", "permission_date") if hasattr(f, "sort_by") else "permission_date"
        sort_order = getattr(f, "sort_order", "desc") if hasattr(f, "sort_order") else "desc"

        conditions = (
            FilterBuilder(PermissionRequest)
            .soft_delete()
            .eq("employee_id", emp_id)
            .eq("status", status)
            .date_range("permission_date", from_date, to_date)
            .build()
        )
        return await self._repo.list(conditions, sort_by, sort_order, request.offset, request.limit, request.paginationFlag)

    async def action(self, req_id: uuid.UUID, payload: PermissionActionRequest, actor: CurrentUser) -> PermissionRequest:
        req = await self._repo.get_by_id(req_id)
        if not req:
            raise NotFound("Permission request not found")
        if req.status != PermissionStatus.PENDING:
            raise BusinessRuleViolation("Permission already actioned")

        req.status = payload.status
        req.approved_by = actor.employee_id
        req.approved_at = datetime.utcnow()
        req.rejection_reason = payload.rejection_reason
        return await self._repo.save(req)

    async def get_policy(self):
        return await self._repo.get_policy()

    async def update_policy(self, payload: PermissionPolicyUpdateRequest):
        policy = await self._repo.get_policy()
        if not policy:
            raise NotFound("Permission policy not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(policy, field, value)
        return await self._repo.save_policy(policy)
