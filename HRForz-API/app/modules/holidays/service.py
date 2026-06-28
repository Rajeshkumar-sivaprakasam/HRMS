from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.holiday import Holiday
from app.modules.holidays.repository import HolidayRepository
from app.modules.holidays.schemas import HolidayCreateRequest, HolidayUpdateRequest
from app.shared.utils.filter_builder import FilterBuilder


class HolidayService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = HolidayRepository(db)

    async def create(self, payload: HolidayCreateRequest) -> Holiday:
        holiday = Holiday(
            **payload.model_dump(exclude_unset=False),
            year=payload.holiday_date.year,
        )
        return await self._repo.save(holiday)

    async def get(self, holiday_id: uuid.UUID) -> Holiday:
        h = await self._repo.get_by_id(holiday_id)
        if not h:
            raise NotFound("Holiday not found")
        return h

    async def list(self, year: int | None = None, work_location_id: uuid.UUID | None = None) -> list[Holiday]:
        conditions = (
            FilterBuilder(Holiday)
            .soft_delete()
            .eq("year", year)
            .eq("work_location_id", work_location_id)
            .build()
        )
        return await self._repo.list_all(conditions)

    async def update(self, holiday_id: uuid.UUID, payload: HolidayUpdateRequest) -> Holiday:
        holiday = await self.get(holiday_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(holiday, field, value)
        if payload.holiday_date:
            holiday.year = payload.holiday_date.year
        return await self._repo.save(holiday)

    async def delete(self, holiday_id: uuid.UUID) -> None:
        holiday = await self.get(holiday_id)
        await self._repo.soft_delete(holiday)
