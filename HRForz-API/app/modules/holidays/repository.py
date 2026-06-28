from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.holiday import Holiday


class HolidayRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, holiday_id: uuid.UUID) -> Holiday | None:
        stmt = (
            select(Holiday)
            .options(
                selectinload(Holiday.holiday_type),
                selectinload(Holiday.work_location)
            )
            .where(Holiday.id == holiday_id, Holiday.deleted_at.is_(None))
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_all(self, conditions: Any) -> list[Holiday]:
        stmt = (
            select(Holiday)
            .options(
                selectinload(Holiday.holiday_type),
                selectinload(Holiday.work_location)
            )
            .where(conditions)
            .order_by(Holiday.holiday_date)
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, holiday: Holiday) -> Holiday:
        self._db.add(holiday)
        await self._db.flush()
        await self._db.refresh(holiday)
        return holiday

    async def soft_delete(self, holiday: Holiday) -> None:
        from datetime import datetime
        holiday.deleted_at = datetime.utcnow()
        self._db.add(holiday)
        await self._db.flush()
