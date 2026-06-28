import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.shared.enums.payroll import (
    ComponentCategory,
    SalaryCalcType,
    SalaryComponentType,
)


class SalaryComponentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str = Field(min_length=1, max_length=30)
    component_type: SalaryComponentType
    category: ComponentCategory
    calc_type: SalaryCalcType
    value: float = 0
    is_taxable: bool = False
    is_pf_applicable: bool = False
    is_esi_applicable: bool = False
    display_order: int = 0


class SalaryComponentUpdateRequest(BaseModel):
    name: str | None = None
    calc_type: SalaryCalcType | None = None
    value: float | None = None
    is_taxable: bool | None = None
    is_pf_applicable: bool | None = None
    is_esi_applicable: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None


class SalaryComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str
    component_type: SalaryComponentType
    category: ComponentCategory
    calc_type: SalaryCalcType
    value: float
    is_taxable: bool
    is_pf_applicable: bool
    is_esi_applicable: bool
    is_active: bool
    display_order: int


class StructureComponentItem(BaseModel):
    component_id: uuid.UUID
    calc_type_override: SalaryCalcType | None = None
    value_override: float | None = None
    display_order: int = 0


class SalaryStructureCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    components: list[StructureComponentItem] = []


class SalaryStructureUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    components: list[StructureComponentItem] | None = None


class SalaryStructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool
