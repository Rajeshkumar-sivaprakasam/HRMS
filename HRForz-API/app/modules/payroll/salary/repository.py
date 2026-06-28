import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import EmployeeSalary


class SalaryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_current(self, employee_id: uuid.UUID) -> EmployeeSalary | None:
        stmt = select(EmployeeSalary).where(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.is_current.is_(True),
            EmployeeSalary.deleted_at.is_(None),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, sal_id: uuid.UUID) -> EmployeeSalary | None:
        stmt = select(EmployeeSalary).where(
            EmployeeSalary.id == sal_id, EmployeeSalary.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_for_employee(self, employee_id: uuid.UUID) -> list[EmployeeSalary]:
        stmt = (
            select(EmployeeSalary)
            .where(EmployeeSalary.employee_id == employee_id, EmployeeSalary.deleted_at.is_(None))
            .order_by(EmployeeSalary.effective_from.desc())
        )
        return list((await self._db.execute(stmt)).scalars().all())

    async def save(self, sal: EmployeeSalary) -> EmployeeSalary:
        self._db.add(sal)
        await self._db.flush()
        await self._db.refresh(sal)
        return sal
