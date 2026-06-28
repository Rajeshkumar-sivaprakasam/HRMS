from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.countries.schemas import (
    CountryCreateRequest,
    CountryResponse,
    CountryUpdateRequest,
)
from app.modules.countries.service import CountryService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/countries", tags=["Countries"])


@router.post("", response_model=ApiResponse[CountryResponse], dependencies=[HROnly])
async def create_country(
    payload: CountryCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CountryService(db)
    country = await service.create(payload)
    return ApiResponse.created(CountryResponse.model_validate(country), "Country created")


@router.get("", response_model=ApiResponse[list[CountryResponse]])
async def list_countries(
    search: str | None = None,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = CountryService(db)
    countries = await service.list(search)
    return ApiResponse.ok([CountryResponse.model_validate(c) for c in countries])


@router.get("/{country_id}", response_model=ApiResponse[CountryResponse])
async def get_country(
    country_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = CountryService(db)
    country = await service.get(country_id)
    return ApiResponse.ok(CountryResponse.model_validate(country))


@router.put("/{country_id}", response_model=ApiResponse[CountryResponse], dependencies=[HROnly])
async def update_country(
    country_id: uuid.UUID,
    payload: CountryUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = CountryService(db)
    country = await service.update(country_id, payload)
    return ApiResponse.ok(CountryResponse.model_validate(country), "Country updated")


@router.delete("/{country_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_country(
    country_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = CountryService(db)
    await service.delete(country_id)
    return ApiResponse.ok(None, "Country deleted")
