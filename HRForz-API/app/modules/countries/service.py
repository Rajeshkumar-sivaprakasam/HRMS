import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.lookup import Country
from app.modules.countries.schemas import CountryCreateRequest, CountryUpdateRequest


class CountryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, payload: CountryCreateRequest) -> Country:
        country = Country(**payload.model_dump())
        self.db.add(country)
        await self.db.flush()
        return country

    async def list(self, search: str | None = None) -> list[Country]:
        query = select(Country).where(Country.deleted_at.is_(None), Country.is_active.is_(True))
        if search:
            search = f"%{search}%"
            query = query.where(Country.name.ilike(search) | Country.code.ilike(search))
        query = query.order_by(Country.name)
        return list((await self.db.execute(query)).scalars().all())

    async def get(self, country_id: uuid.UUID) -> Country:
        country = (await self.db.execute(
            select(Country).where(Country.id == country_id, Country.deleted_at.is_(None))
        )).scalar_one_or_none()
        if not country:
            raise NotFound("Country not found")
        return country

    async def update(self, country_id: uuid.UUID, payload: CountryUpdateRequest) -> Country:
        country = await self.get(country_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(country, key, value)
        await self.db.flush()
        return country

    async def delete(self, country_id: uuid.UUID) -> None:
        country = await self.get(country_id)
        country.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
