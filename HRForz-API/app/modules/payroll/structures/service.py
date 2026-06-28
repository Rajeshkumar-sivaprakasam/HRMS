import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Conflict, NotFound
from app.models.payroll import SalaryComponent, SalaryStructure, SalaryStructureComponent
from app.modules.payroll.structures.repository import StructuresRepository
from app.modules.payroll.structures.schemas import (
    SalaryComponentCreateRequest,
    SalaryComponentUpdateRequest,
    SalaryStructureCreateRequest,
    SalaryStructureUpdateRequest,
)
from app.shared.utils.filter_builder import FilterBuilder


class StructuresService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = StructuresRepository(db)

    async def create_component(self, payload: SalaryComponentCreateRequest) -> SalaryComponent:
        if await self._repo.get_component_by_code(payload.code):
            raise Conflict("Component code already exists")
        comp = SalaryComponent(**payload.model_dump())
        return await self._repo.save_component(comp)

    async def list_components(self, active_only: bool = True) -> list[SalaryComponent]:
        fb = FilterBuilder(SalaryComponent).soft_delete()
        if active_only:
            fb.eq("is_active", True)
        return await self._repo.list_components(fb.build())

    async def get_component(self, comp_id: uuid.UUID) -> SalaryComponent:
        comp = await self._repo.get_component_by_id(comp_id)
        if not comp:
            raise NotFound("Salary component not found")
        return comp

    async def update_component(self, comp_id: uuid.UUID, payload: SalaryComponentUpdateRequest) -> SalaryComponent:
        comp = await self.get_component(comp_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(comp, field, value)
        return await self._repo.save_component(comp)

    async def create_structure(self, payload: SalaryStructureCreateRequest) -> SalaryStructure:
        struct = SalaryStructure(name=payload.name, description=payload.description)
        await self._repo.save_structure(struct)
        items = [
            SalaryStructureComponent(
                structure_id=struct.id,
                component_id=c.component_id,
                calc_type_override=c.calc_type_override,
                value_override=c.value_override,
                display_order=c.display_order,
            )
            for c in payload.components
        ]
        await self._repo.replace_structure_components(struct.id, items)
        return struct

    async def list_structures(self) -> list[SalaryStructure]:
        conditions = FilterBuilder(SalaryStructure).soft_delete().build()
        return await self._repo.list_structures(conditions)

    async def get_structure(self, struct_id: uuid.UUID) -> SalaryStructure:
        s = await self._repo.get_structure_by_id(struct_id)
        if not s:
            raise NotFound("Salary structure not found")
        return s

    async def update_structure(self, struct_id: uuid.UUID, payload: SalaryStructureUpdateRequest) -> SalaryStructure:
        struct = await self.get_structure(struct_id)
        for field, value in payload.model_dump(exclude_unset=True, exclude={"components"}).items():
            setattr(struct, field, value)
        await self._repo.save_structure(struct)
        if payload.components is not None:
            items = [
                SalaryStructureComponent(
                    structure_id=struct.id,
                    component_id=c.component_id,
                    calc_type_override=c.calc_type_override,
                    value_override=c.value_override,
                    display_order=c.display_order,
                )
                for c in payload.components
            ]
            await self._repo.replace_structure_components(struct.id, items)
        return struct
