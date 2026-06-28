from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department


class DepartmentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, dept_id: uuid.UUID) -> Department | None:
        stmt = select(Department).where(
            Department.id == dept_id, Department.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_name(self, name: str) -> Department | None:
        stmt = select(Department).where(
            Department.name == name, Department.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_all(self, conditions: Any) -> list[Department]:
        stmt = select(Department).where(conditions).order_by(Department.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, dept: Department) -> Department:
        self._db.add(dept)
        await self._db.flush()
        await self._db.refresh(dept)
        return dept

    async def soft_delete(self, dept: Department) -> None:
        from datetime import datetime
        dept.deleted_at = datetime.utcnow()
        self._db.add(dept)
        await self._db.flush()
