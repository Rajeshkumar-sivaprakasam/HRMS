import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.structures.schemas import (
    SalaryComponentCreateRequest,
    SalaryComponentResponse,
    SalaryComponentUpdateRequest,
    SalaryStructureCreateRequest,
    SalaryStructureResponse,
    SalaryStructureUpdateRequest,
)
from app.modules.payroll.structures.service import StructuresService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/structures", tags=["Payroll - Structures"])


@router.post("/components", response_model=ApiResponse[SalaryComponentResponse], dependencies=[HROnly])
async def create_component(payload: SalaryComponentCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = StructuresService(db)
    comp = await svc.create_component(payload)
    return ApiResponse.created(SalaryComponentResponse.model_validate(comp), "Component created")


@router.get("/components", response_model=ApiResponse[list[SalaryComponentResponse]])
async def list_components(
    active_only: bool = True,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = StructuresService(db)
    items = await svc.list_components(active_only)
    return ApiResponse.ok([SalaryComponentResponse.model_validate(c) for c in items])


@router.put("/components/{comp_id}", response_model=ApiResponse[SalaryComponentResponse], dependencies=[HROnly])
async def update_component(
    comp_id: uuid.UUID,
    payload: SalaryComponentUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = StructuresService(db)
    comp = await svc.update_component(comp_id, payload)
    return ApiResponse.ok(SalaryComponentResponse.model_validate(comp), "Component updated")


@router.post("", response_model=ApiResponse[SalaryStructureResponse], dependencies=[HROnly])
async def create_structure(payload: SalaryStructureCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = StructuresService(db)
    struct = await svc.create_structure(payload)
    return ApiResponse.created(SalaryStructureResponse.model_validate(struct), "Structure created")


@router.get("", response_model=ApiResponse[list[SalaryStructureResponse]])
async def list_structures(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = StructuresService(db)
    items = await svc.list_structures()
    return ApiResponse.ok([SalaryStructureResponse.model_validate(s) for s in items])


@router.get("/{struct_id}", response_model=ApiResponse[SalaryStructureResponse])
async def get_structure(
    struct_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = StructuresService(db)
    struct = await svc.get_structure(struct_id)
    return ApiResponse.ok(SalaryStructureResponse.model_validate(struct))


@router.put("/{struct_id}", response_model=ApiResponse[SalaryStructureResponse], dependencies=[HROnly])
async def update_structure(
    struct_id: uuid.UUID,
    payload: SalaryStructureUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = StructuresService(db)
    struct = await svc.update_structure(struct_id, payload)
    return ApiResponse.ok(SalaryStructureResponse.model_validate(struct), "Structure updated")
