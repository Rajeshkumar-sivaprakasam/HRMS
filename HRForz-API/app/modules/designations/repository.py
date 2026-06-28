from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Designation


class DesignationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, desig_id: uuid.UUID) -> Designation | None:
        stmt = select(Designation).where(
            Designation.id == desig_id, Designation.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_all(self, conditions: Any) -> list[Designation]:
        stmt = select(Designation).where(conditions).order_by(Designation.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, desig: Designation) -> Designation:
        self._db.add(desig)
        await self._db.flush()
        await self._db.refresh(desig)
        return desig

    async def soft_delete(self, desig: Designation) -> None:
        from datetime import datetime
        desig.deleted_at = datetime.utcnow()
        self._db.add(desig)
        await self._db.flush()
