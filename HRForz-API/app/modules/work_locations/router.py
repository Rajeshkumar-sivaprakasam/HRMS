from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.work_locations.schemas import (
    WorkLocationCreateRequest,
    WorkLocationResponse,
    WorkLocationUpdateRequest,
)
from app.modules.work_locations.service import WorkLocationService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/work-locations", tags=["Work Locations"])


@router.post("", response_model=ApiResponse[WorkLocationResponse], dependencies=[HROnly])
async def create(payload: WorkLocationCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = WorkLocationService(db)
    loc = await svc.create(payload)
    return ApiResponse.created(WorkLocationResponse.model_validate(loc), "Work location created")


@router.get("", response_model=ApiResponse[list[WorkLocationResponse]])
async def list_locations(
    search: str | None = None,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = WorkLocationService(db)
    items = await svc.list(search)
    return ApiResponse.ok([WorkLocationResponse.model_validate(l) for l in items])


@router.get("/{loc_id}", response_model=ApiResponse[WorkLocationResponse])
async def get_location(
    loc_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = WorkLocationService(db)
    loc = await svc.get(loc_id)
    return ApiResponse.ok(WorkLocationResponse.model_validate(loc))


@router.put("/{loc_id}", response_model=ApiResponse[WorkLocationResponse], dependencies=[HROnly])
async def update_location(
    loc_id: uuid.UUID,
    payload: WorkLocationUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = WorkLocationService(db)
    loc = await svc.update(loc_id, payload)
    return ApiResponse.ok(WorkLocationResponse.model_validate(loc), "Work location updated")


@router.delete("/{loc_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_location(loc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    svc = WorkLocationService(db)
    await svc.delete(loc_id)
    return ApiResponse.ok(None, "Work location deleted")
