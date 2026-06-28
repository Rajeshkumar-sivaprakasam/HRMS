from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.designations.schemas import (
    DesignationCreateRequest,
    DesignationResponse,
    DesignationUpdateRequest,
)
from app.modules.designations.service import DesignationService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/designations", tags=["Designations"])


@router.post("", response_model=ApiResponse[DesignationResponse], dependencies=[HROnly])
async def create_designation(payload: DesignationCreateRequest, db: AsyncSession = Depends(get_db)):
    service = DesignationService(db)
    desig = await service.create(payload)
    return ApiResponse.created(DesignationResponse.model_validate(desig), "Designation created")


@router.get("", response_model=ApiResponse[list[DesignationResponse]])
async def list_designations(
    department_id: uuid.UUID | None = None,
    search: str | None = None,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = DesignationService(db)
    items = await service.list(department_id, search)
    return ApiResponse.ok([DesignationResponse.model_validate(d) for d in items])


@router.get("/{desig_id}", response_model=ApiResponse[DesignationResponse])
async def get_designation(
    desig_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = DesignationService(db)
    desig = await service.get(desig_id)
    return ApiResponse.ok(DesignationResponse.model_validate(desig))


@router.put("/{desig_id}", response_model=ApiResponse[DesignationResponse], dependencies=[HROnly])
async def update_designation(
    desig_id: uuid.UUID,
    payload: DesignationUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = DesignationService(db)
    desig = await service.update(desig_id, payload)
    return ApiResponse.ok(DesignationResponse.model_validate(desig), "Designation updated")


@router.delete("/{desig_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_designation(desig_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = DesignationService(db)
    await service.delete(desig_id)
    return ApiResponse.ok(None, "Designation deleted")
