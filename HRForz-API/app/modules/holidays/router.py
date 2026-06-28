from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.holidays.schemas import (
    HolidayCreateRequest,
    HolidayResponse,
    HolidayUpdateRequest,
)
from app.modules.holidays.service import HolidayService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/holidays", tags=["Holidays"])


@router.post("", response_model=ApiResponse[HolidayResponse], dependencies=[HROnly])
async def create_holiday(payload: HolidayCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = HolidayService(db)
    h = await svc.create(payload)
    return ApiResponse.created(HolidayResponse.model_validate(h), "Holiday created")


@router.get("", response_model=ApiResponse[list[HolidayResponse]])
async def list_holidays(
    year: int | None = None,
    work_location_id: uuid.UUID | None = None,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HolidayService(db)
    items = await svc.list(year, work_location_id)
    return ApiResponse.ok([HolidayResponse.model_validate(h) for h in items])


@router.get("/{holiday_id}", response_model=ApiResponse[HolidayResponse])
async def get_holiday(
    holiday_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = HolidayService(db)
    h = await svc.get(holiday_id)
    return ApiResponse.ok(HolidayResponse.model_validate(h))


@router.put("/{holiday_id}", response_model=ApiResponse[HolidayResponse], dependencies=[HROnly])
async def update_holiday(
    holiday_id: uuid.UUID,
    payload: HolidayUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = HolidayService(db)
    h = await svc.update(holiday_id, payload)
    return ApiResponse.ok(HolidayResponse.model_validate(h), "Holiday updated")


@router.delete("/{holiday_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_holiday(holiday_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    svc = HolidayService(db)
    await svc.delete(holiday_id)
    return ApiResponse.ok(None, "Holiday deleted")
