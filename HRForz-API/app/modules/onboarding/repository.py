from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.onboarding import EmployeeOnboarding, OnboardingDocument
from app.shared.enums.onboarding import DocumentCategory, OnboardingStatus


class OnboardingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, onboarding_id: uuid.UUID) -> EmployeeOnboarding | None:
        stmt = (
            select(EmployeeOnboarding)
            .where(EmployeeOnboarding.id == onboarding_id)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_next_code(self) -> str:
        from app.config import settings
        stmt = select(func.count()).select_from(EmployeeOnboarding)
        count = (await self._db.execute(stmt)).scalar_one()
        prefix = settings.EMPLOYEE_CODE_PREFIX
        pad = settings.EMPLOYEE_CODE_PADDING
        return f"{prefix}{str(count + 1).zfill(pad)}"

    async def list(
        self,
        conditions: Any,
        offset: int,
        limit: int,
        paginate: bool,
    ) -> tuple[list[EmployeeOnboarding], int]:
        count_stmt = select(func.count()).select_from(EmployeeOnboarding).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()

        stmt = (
            select(EmployeeOnboarding)
            .options(joinedload(EmployeeOnboarding.department))
            .where(conditions)
            .order_by(EmployeeOnboarding.created_at.desc())
        )
        if paginate:
            stmt = stmt.offset(offset).limit(limit)

        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows), total

    async def save(self, obj: EmployeeOnboarding) -> EmployeeOnboarding:
        self._db.add(obj)
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def delete(self, obj: EmployeeOnboarding) -> None:
        await self._db.delete(obj)
        await self._db.flush()

    # ── Document operations ──────────────────────────────────────────────────

    async def get_documents(self, onboarding_id: uuid.UUID) -> list[OnboardingDocument]:
        stmt = (
            select(OnboardingDocument)
            .where(OnboardingDocument.onboarding_id == onboarding_id)
            .order_by(OnboardingDocument.created_at.asc())
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def get_document(self, doc_id: uuid.UUID) -> OnboardingDocument | None:
        stmt = select(OnboardingDocument).where(OnboardingDocument.id == doc_id)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_document_by_category(
        self, onboarding_id: uuid.UUID, category: DocumentCategory
    ) -> OnboardingDocument | None:
        stmt = select(OnboardingDocument).where(
            OnboardingDocument.onboarding_id == onboarding_id,
            OnboardingDocument.category == category,
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def save_document(self, doc: OnboardingDocument) -> OnboardingDocument:
        self._db.add(doc)
        await self._db.flush()
        await self._db.refresh(doc)
        return doc

    async def delete_document(self, doc: OnboardingDocument) -> None:
        await self._db.delete(doc)
        await self._db.flush()

    async def count_documents_by_status(self, onboarding_id: uuid.UUID) -> dict[str, int]:
        stmt = (
            select(OnboardingDocument.status, func.count())
            .where(OnboardingDocument.onboarding_id == onboarding_id)
            .group_by(OnboardingDocument.status)
        )
        rows = (await self._db.execute(stmt)).all()
        counts = {"uploaded": 0, "pending": 0, "verified": 0, "rejected": 0}
        for status, count in rows:
            counts[status] = count
        return counts
