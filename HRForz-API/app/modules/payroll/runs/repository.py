from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import PayrollAdjustment, PayrollRun, Payslip


class RunsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, run_id: uuid.UUID) -> PayrollRun | None:
        stmt = select(PayrollRun).where(
            PayrollRun.id == run_id, PayrollRun.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_month_year(self, month: int, year: int) -> PayrollRun | None:
        stmt = select(PayrollRun).where(
            PayrollRun.month == month,
            PayrollRun.year == year,
            PayrollRun.deleted_at.is_(None),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list(self, conditions: Any) -> list[PayrollRun]:
        stmt = select(PayrollRun).where(conditions).order_by(
            PayrollRun.year.desc(), PayrollRun.month.desc()
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, run: PayrollRun) -> PayrollRun:
        self._db.add(run)
        await self._db.flush()
        await self._db.refresh(run)
        return run

    async def get_adjustments(self, month: int, year: int) -> list[PayrollAdjustment]:
        stmt = select(PayrollAdjustment).where(
            PayrollAdjustment.month == month,
            PayrollAdjustment.year == year,
            PayrollAdjustment.deleted_at.is_(None),
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_adjustment(self, adj: PayrollAdjustment) -> PayrollAdjustment:
        self._db.add(adj)
        await self._db.flush()
        await self._db.refresh(adj)
        return adj
