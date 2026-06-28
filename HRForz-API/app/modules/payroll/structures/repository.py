import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import SalaryComponent, SalaryStructure, SalaryStructureComponent


class StructuresRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # --- components ---
    async def get_component_by_id(self, comp_id: uuid.UUID) -> SalaryComponent | None:
        stmt = select(SalaryComponent).where(
            SalaryComponent.id == comp_id, SalaryComponent.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_component_by_code(self, code: str) -> SalaryComponent | None:
        stmt = select(SalaryComponent).where(
            SalaryComponent.code == code, SalaryComponent.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_components(self, conditions: Any) -> list[SalaryComponent]:
        stmt = select(SalaryComponent).where(conditions).order_by(SalaryComponent.display_order)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_component(self, comp: SalaryComponent) -> SalaryComponent:
        self._db.add(comp)
        await self._db.flush()
        await self._db.refresh(comp)
        return comp

    # --- structures ---
    async def get_structure_by_id(self, struct_id: uuid.UUID) -> SalaryStructure | None:
        stmt = select(SalaryStructure).where(
            SalaryStructure.id == struct_id, SalaryStructure.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_structures(self, conditions: Any) -> list[SalaryStructure]:
        stmt = select(SalaryStructure).where(conditions).order_by(SalaryStructure.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_structure(self, struct: SalaryStructure) -> SalaryStructure:
        self._db.add(struct)
        await self._db.flush()
        await self._db.refresh(struct)
        return struct

    async def replace_structure_components(
        self, struct_id: uuid.UUID, items: list[SalaryStructureComponent]
    ) -> None:
        await self._db.execute(
            delete(SalaryStructureComponent).where(
                SalaryStructureComponent.structure_id == struct_id
            )
        )
        for item in items:
            self._db.add(item)
        await self._db.flush()

    async def get_structure_components(self, struct_id: uuid.UUID) -> list[SalaryStructureComponent]:
        stmt = select(SalaryStructureComponent).where(
            SalaryStructureComponent.structure_id == struct_id
        ).order_by(SalaryStructureComponent.display_order)
        return list((await self._db.execute(stmt)).scalars().all())
