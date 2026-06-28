from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import WorkLocation


class WorkLocationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, loc_id: uuid.UUID) -> WorkLocation | None:
        stmt = select(WorkLocation).where(
            WorkLocation.id == loc_id, WorkLocation.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_all(self, conditions: Any) -> list[WorkLocation]:
        stmt = select(WorkLocation).where(conditions).order_by(WorkLocation.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, loc: WorkLocation) -> WorkLocation:
        self._db.add(loc)
        await self._db.flush()
        await self._db.refresh(loc)
        return loc

    async def soft_delete(self, loc: WorkLocation) -> None:
        from datetime import datetime
        loc.deleted_at = datetime.utcnow()
        self._db.add(loc)
        await self._db.flush()
