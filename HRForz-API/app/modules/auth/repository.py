from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.user import User
from app.models.employee import Employee


class AuthRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(
            User.email == email, User.deleted_at.is_(None)
        ).options(
            joinedload(User.employee).joinedload(Employee.work_location)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_activation_token(self, token: str) -> User | None:
        stmt = select(User).where(
            User.activation_token == token, User.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_reset_token(self, token: str) -> User | None:
        stmt = select(User).where(
            User.password_reset_token == token, User.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def save(self, user: User) -> User:
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)
        return user
