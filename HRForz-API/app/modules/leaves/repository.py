from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.leave import LeaveBalance, LeavePolicy, LeaveRequest
from app.shared.enums.leave import LeaveType
from app.shared.utils.filter_builder import apply_sort


class LeaveRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_request_by_id(self, req_id: uuid.UUID) -> LeaveRequest | None:
        stmt = select(LeaveRequest).where(
            LeaveRequest.id == req_id, LeaveRequest.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_requests(self, conditions: Any, sort_by: str, sort_order: str, offset: int, limit: int, paginate: bool) -> tuple[list[LeaveRequest], int]:
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(LeaveRequest).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()
        stmt = select(LeaveRequest).where(conditions)
        allowed = ["from_date", "to_date", "applied_on", "created_at", "status"]
        stmt = apply_sort(stmt, LeaveRequest, sort_by, sort_order, allowed)
        if paginate:
            stmt = stmt.offset(offset).limit(limit)
        return list((await self._db.execute(stmt)).scalars().all()), total

    async def save_request(self, req: LeaveRequest) -> LeaveRequest:
        self._db.add(req)
        await self._db.flush()
        await self._db.refresh(req)
        return req

    async def get_balance(self, employee_id: uuid.UUID, leave_type: LeaveType, year: int) -> LeaveBalance | None:
        stmt = select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type == leave_type,
            LeaveBalance.year == year,
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_balances_for_employee(self, employee_id: uuid.UUID, year: int) -> list[LeaveBalance]:
        stmt = select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.year == year,
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_balance(self, balance: LeaveBalance) -> LeaveBalance:
        self._db.add(balance)
        await self._db.flush()
        await self._db.refresh(balance)
        return balance

    async def get_policy(self, leave_type: LeaveType) -> LeavePolicy | None:
        stmt = select(LeavePolicy).where(
            LeavePolicy.leave_type == leave_type, LeavePolicy.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_policies(self) -> list[LeavePolicy]:
        stmt = select(LeavePolicy).where(LeavePolicy.deleted_at.is_(None))
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_policy(self, policy: LeavePolicy) -> LeavePolicy:
        self._db.add(policy)
        await self._db.flush()
        await self._db.refresh(policy)
        return policy
