from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.department import Designation
from app.modules.designations.repository import DesignationRepository
from app.modules.designations.schemas import DesignationCreateRequest, DesignationUpdateRequest
from app.shared.utils.filter_builder import FilterBuilder


class DesignationService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = DesignationRepository(db)

    async def create(self, payload: DesignationCreateRequest) -> Designation:
        desig = Designation(**payload.model_dump(exclude_unset=False))
        return await self._repo.save(desig)

    async def get(self, desig_id: uuid.UUID) -> Designation:
        desig = await self._repo.get_by_id(desig_id)
        if not desig:
            raise NotFound("Designation not found")
        return desig

    async def list(self, department_id: uuid.UUID | None = None, search: str | None = None) -> list[Designation]:
        conditions = (
            FilterBuilder(Designation)
            .soft_delete()
            .eq("department_id", department_id)
            .like("name", search)
            .build()
        )
        return await self._repo.list_all(conditions)

    async def update(self, desig_id: uuid.UUID, payload: DesignationUpdateRequest) -> Designation:
        desig = await self.get(desig_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(desig, field, value)
        return await self._repo.save(desig)

    async def delete(self, desig_id: uuid.UUID) -> None:
        desig = await self.get(desig_id)
        await self._repo.soft_delete(desig)
