from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission import PermissionPolicy, PermissionRequest
from app.shared.utils.filter_builder import apply_sort


class PermissionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, req_id: uuid.UUID) -> PermissionRequest | None:
        stmt = select(PermissionRequest).where(
            PermissionRequest.id == req_id, PermissionRequest.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list(self, conditions: Any, sort_by: str, sort_order: str, offset: int, limit: int, paginate: bool) -> tuple[list[PermissionRequest], int]:
        count_stmt = select(func.count()).select_from(PermissionRequest).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()
        stmt = select(PermissionRequest).where(conditions)
        allowed = ["permission_date", "created_at", "status", "duration_hours"]
        stmt = apply_sort(stmt, PermissionRequest, sort_by, sort_order, allowed)
        if paginate:
            stmt = stmt.offset(offset).limit(limit)
        return list((await self._db.execute(stmt)).scalars().all()), total

    async def get_monthly_hours(self, employee_id: uuid.UUID, year: int, month: int) -> float:
        stmt = select(func.sum(PermissionRequest.duration_hours)).where(
            PermissionRequest.employee_id == employee_id,
            PermissionRequest.status == "approved",
            extract("year", PermissionRequest.permission_date) == year,
            extract("month", PermissionRequest.permission_date) == month,
            PermissionRequest.deleted_at.is_(None),
        )
        result = (await self._db.execute(stmt)).scalar_one_or_none()
        return float(result or 0)

    async def save(self, req: PermissionRequest) -> PermissionRequest:
        self._db.add(req)
        await self._db.flush()
        await self._db.refresh(req)
        return req

    async def get_policy(self) -> PermissionPolicy | None:
        stmt = select(PermissionPolicy).where(PermissionPolicy.is_active.is_(True)).limit(1)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def save_policy(self, policy: PermissionPolicy) -> PermissionPolicy:
        self._db.add(policy)
        await self._db.flush()
        await self._db.refresh(policy)
        return policy
