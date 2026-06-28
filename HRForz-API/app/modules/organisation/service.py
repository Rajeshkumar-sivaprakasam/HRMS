from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.organisation import Organisation
from app.modules.organisation.schemas import OrganisationUpdateRequest


class OrganisationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def _get_or_create(self) -> Organisation:
        stmt = select(Organisation).limit(1)
        org = (await self._db.execute(stmt)).scalar_one_or_none()
        if not org:
            org = Organisation(name="My Organisation", country="India")
            self._db.add(org)
            await self._db.flush()
            await self._db.refresh(org)
        return org

    async def get(self) -> Organisation:
        return await self._get_or_create()

    async def update(self, payload: OrganisationUpdateRequest) -> Organisation:
        org = await self._get_or_create()
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(org, field, value)
        self._db.add(org)
        await self._db.flush()
        await self._db.refresh(org)
        return org

    async def upload_logo(self, key: str, url: str) -> Organisation:
        org = await self._get_or_create()
        org.logo_key = key
        org.logo_url = url
        self._db.add(org)
        await self._db.flush()
        await self._db.refresh(org)
        return org
