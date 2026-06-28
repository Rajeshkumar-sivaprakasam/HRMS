from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.payroll import EmployeeSalary, SalaryRevision
from app.modules.payroll.revisions.schemas import SalaryRevisionCreateRequest
from app.shared.dependencies.auth import CurrentUser


class RevisionsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, payload: SalaryRevisionCreateRequest, actor: CurrentUser) -> SalaryRevision:
        # Get current CTC
        sal_stmt = select(EmployeeSalary).where(
            EmployeeSalary.employee_id == payload.employee_id,
            EmployeeSalary.is_current.is_(True),
            EmployeeSalary.deleted_at.is_(None),
        )
        sal = (await self._db.execute(sal_stmt)).scalar_one_or_none()
        old_ctc = float(sal.ctc) if sal else 0.0

        hike = round(((payload.new_ctc - old_ctc) / old_ctc * 100), 2) if old_ctc else None

        revision = SalaryRevision(
            employee_id=payload.employee_id,
            revision_type=payload.revision_type,
            old_ctc=old_ctc,
            new_ctc=payload.new_ctc,
            hike_percentage=hike,
            effective_from=payload.effective_from,
            reason=payload.reason,
            approved_by=actor.employee_id,
        )
        self._db.add(revision)
        await self._db.flush()
        await self._db.refresh(revision)

        # Also create/update salary record
        from app.modules.payroll.salary.service import SalaryService
        from app.modules.payroll.salary.schemas import EmployeeSalaryCreateRequest
        from app.shared.enums.payroll import PaymentMode, TaxRegime
        sal_payload = EmployeeSalaryCreateRequest(
            employee_id=payload.employee_id,
            ctc=payload.new_ctc,
            effective_from=payload.effective_from,
        )
        sal_svc = SalaryService(self._db)
        await sal_svc.assign(sal_payload)

        return revision

    async def list(self, employee_id: uuid.UUID) -> list[SalaryRevision]:
        stmt = (
            select(SalaryRevision)
            .where(SalaryRevision.employee_id == employee_id, SalaryRevision.deleted_at.is_(None))
            .order_by(SalaryRevision.effective_from.desc())
        )
        return list((await self._db.execute(stmt)).scalars().all())
