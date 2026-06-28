from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.department import WorkLocation
from app.modules.work_locations.repository import WorkLocationRepository
from app.modules.work_locations.schemas import WorkLocationCreateRequest, WorkLocationUpdateRequest
from app.shared.utils.filter_builder import FilterBuilder


class WorkLocationService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = WorkLocationRepository(db)

    async def create(self, payload: WorkLocationCreateRequest) -> WorkLocation:
        loc = WorkLocation(**payload.model_dump(exclude_unset=False))
        return await self._repo.save(loc)

    async def get(self, loc_id: uuid.UUID) -> WorkLocation:
        loc = await self._repo.get_by_id(loc_id)
        if not loc:
            raise NotFound("Work location not found")
        return loc

    async def list(self, search: str | None = None) -> list[WorkLocation]:
        conditions = FilterBuilder(WorkLocation).soft_delete().like("name", search).build()
        return await self._repo.list_all(conditions)

    async def update(self, loc_id: uuid.UUID, payload: WorkLocationUpdateRequest) -> WorkLocation:
        loc = await self.get(loc_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(loc, field, value)
        return await self._repo.save(loc)

    async def delete(self, loc_id: uuid.UUID) -> None:
        loc = await self.get(loc_id)
        await self._repo.soft_delete(loc)
