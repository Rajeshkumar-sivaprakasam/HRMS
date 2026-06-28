import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import BASIC_RATIO, HRA_RATIO_OF_BASIC
from app.core.exceptions.base import NotFound
from app.models.payroll import EmployeeSalary
from app.modules.payroll.salary.repository import SalaryRepository
from app.modules.payroll.salary.schemas import (
    EmployeeSalaryCreateRequest,
    EmployeeSalaryUpdateRequest,
)


def _compute_components(ctc: float) -> tuple[float, float]:
    basic = round(ctc * BASIC_RATIO / 12, 2)
    hra = round(basic * HRA_RATIO_OF_BASIC, 2)
    return basic, hra


class SalaryService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = SalaryRepository(db)

    async def assign(self, payload: EmployeeSalaryCreateRequest) -> EmployeeSalary:
        existing = await self._repo.get_current(payload.employee_id)
        if existing:
            existing.is_current = False
            existing.effective_to = payload.effective_from
            await self._repo.save(existing)

        basic, hra = _compute_components(payload.ctc)
        sal = EmployeeSalary(
            employee_id=payload.employee_id,
            structure_id=payload.structure_id,
            ctc=payload.ctc,
            basic=basic,
            hra=hra,
            effective_from=payload.effective_from,
            payment_mode=payload.payment_mode,
            tax_regime=payload.tax_regime,
            is_current=True,
        )
        saved = await self._repo.save(sal)

        # Update denormalized ctc on employee
        from sqlalchemy import update as sa_update
        from app.models.employee import Employee
        from sqlalchemy.ext.asyncio import AsyncSession
        await self._repo._db.execute(
            sa_update(Employee)
            .where(Employee.id == payload.employee_id)
            .values(current_ctc=payload.ctc)
        )
        return saved

    async def get_current(self, employee_id: uuid.UUID) -> EmployeeSalary:
        sal = await self._repo.get_current(employee_id)
        if not sal:
            raise NotFound("No active salary found for employee")
        return sal

    async def list_history(self, employee_id: uuid.UUID) -> list[EmployeeSalary]:
        return await self._repo.list_for_employee(employee_id)

    async def update(self, sal_id: uuid.UUID, payload: EmployeeSalaryUpdateRequest) -> EmployeeSalary:
        sal = await self._repo.get_by_id(sal_id)
        if not sal:
            raise NotFound("Salary record not found")
        for field, value in payload.model_dump(exclude_unset=True, exclude={"ctc"}).items():
            setattr(sal, field, value)
        if payload.ctc is not None:
            sal.ctc = payload.ctc
            sal.basic, sal.hra = _compute_components(payload.ctc)
        return await self._repo.save(sal)
