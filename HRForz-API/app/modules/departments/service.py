from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Conflict, NotFound
from app.models.department import Department
from app.modules.departments.repository import DepartmentRepository
from app.modules.departments.schemas import DepartmentCreateRequest, DepartmentUpdateRequest
from app.shared.utils.filter_builder import FilterBuilder


class DepartmentService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = DepartmentRepository(db)

    async def create(self, payload: DepartmentCreateRequest) -> Department:
        if await self._repo.get_by_name(payload.name):
            raise Conflict("Department with this name already exists")
        dept = Department(**payload.model_dump(exclude_unset=False))
        return await self._repo.save(dept)

    async def get(self, dept_id: uuid.UUID) -> Department:
        dept = await self._repo.get_by_id(dept_id)
        if not dept:
            raise NotFound("Department not found")
        return dept

    async def list(self, search: str | None = None) -> list[Department]:
        conditions = (
            FilterBuilder(Department)
            .soft_delete()
            .like("name", search)
            .build()
        )
        return await self._repo.list_all(conditions)

    async def update(self, dept_id: uuid.UUID, payload: DepartmentUpdateRequest) -> Department:
        dept = await self.get(dept_id)
        if payload.name and payload.name != dept.name:
            if await self._repo.get_by_name(payload.name):
                raise Conflict("Department name already in use")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(dept, field, value)
        return await self._repo.save(dept)

    async def delete(self, dept_id: uuid.UUID) -> None:
        dept = await self.get(dept_id)
        await self._repo.soft_delete(dept)
