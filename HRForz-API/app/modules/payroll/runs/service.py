from __future__ import annotations

import calendar
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    ESI_EMPLOYEE_RATE,
    ESI_GROSS_CEILING,
    PF_EMPLOYEE_RATE,
    PF_MAX_MONTHLY,
    PF_WAGE_CEILING,
)
from app.core.exceptions.base import BusinessRuleViolation, Conflict, NotFound
from app.models.employee import Employee
from app.models.payroll import EmployeeSalary, PayrollAdjustment, PayrollRun, Payslip
from app.modules.payroll.runs.repository import RunsRepository
from app.modules.payroll.runs.schemas import (
    PayrollAdjustmentCreateRequest,
    PayrollRunInitiateRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.payroll import AdjustmentType, PayrollRunStatus
from app.shared.utils.filter_builder import FilterBuilder

_now = lambda: datetime.now(timezone.utc)  # noqa: E731


class RunsService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = RunsRepository(db)
        self._db = db

    async def initiate(self, payload: PayrollRunInitiateRequest) -> PayrollRun:
        existing = await self._repo.get_by_month_year(payload.month, payload.year)
        if existing:
            raise Conflict(f"Payroll run for {payload.month}/{payload.year} already exists")

        run = PayrollRun(
            month=payload.month,
            year=payload.year,
            status=PayrollRunStatus.NOT_RUN,
            remarks=payload.remarks,
        )
        return await self._repo.save(run)

    async def process(self, run_id: uuid.UUID, actor: CurrentUser) -> PayrollRun:
        run = await self._get_or_404(run_id)
        if run.status != PayrollRunStatus.NOT_RUN:
            raise BusinessRuleViolation("Only DRAFT runs can be processed")

        employees_stmt = select(Employee).where(
            Employee.deleted_at.is_(None),
            Employee.status == "active",
        )
        employees = list((await self._db.execute(employees_stmt)).scalars().all())

        working_days = self._working_days(run.month, run.year)
        adjustments = {
            adj.employee_id: adj
            for adj in await self._repo.get_adjustments(run.month, run.year)
        }

        payslips = []
        total_gross = total_ded = total_net = 0.0

        for emp in employees:
            sal_stmt = select(EmployeeSalary).where(
                EmployeeSalary.employee_id == emp.id,
                EmployeeSalary.is_current.is_(True),
                EmployeeSalary.deleted_at.is_(None),
            )
            sal = (await self._db.execute(sal_stmt)).scalar_one_or_none()
            if not sal:
                continue

            monthly_basic = float(sal.basic)
            monthly_gross = round(float(sal.ctc) / 12, 2)

            pf_wage = min(monthly_basic, float(PF_WAGE_CEILING))
            pf_emp = min(round(pf_wage * float(PF_EMPLOYEE_RATE), 2), float(PF_MAX_MONTHLY))
            pf_er = pf_emp

            esi_emp = round(monthly_gross * float(ESI_EMPLOYEE_RATE), 2) if monthly_gross <= float(ESI_GROSS_CEILING) else 0
            esi_er = round(monthly_gross * 0.0325, 2) if monthly_gross <= float(ESI_GROSS_CEILING) else 0

            adj = adjustments.get(emp.id)
            adj_earning = float(adj.amount) if adj and adj.adjustment_type == AdjustmentType.EARNING else 0
            adj_deduction = float(adj.amount) if adj and adj.adjustment_type == AdjustmentType.DEDUCTION else 0

            gross = monthly_gross + adj_earning
            deductions = pf_emp + esi_emp + adj_deduction
            net = round(gross - deductions, 2)

            total_gross += gross
            total_ded += deductions
            total_net += net

            payslips.append(Payslip(
                payroll_run_id=run.id,
                employee_id=emp.id,
                month=run.month,
                year=run.year,
                working_days=working_days,
                paid_days=float(working_days),
                lop_days=0,
                gross_salary=round(gross, 2),
                total_deductions=round(deductions, 2),
                net_salary=net,
                pf_employee=pf_emp,
                pf_employer=pf_er,
                esi_employee=esi_emp,
                esi_employer=esi_er,
            ))

        for slip in payslips:
            self._db.add(slip)

        run.status = PayrollRunStatus.PROCESSED
        run.total_employees = len(payslips)
        run.total_gross = round(total_gross, 2)
        run.total_deductions = round(total_ded, 2)
        run.total_net = round(total_net, 2)
        run.processed_by = actor.employee_id
        run.processed_at = _now()
        await self._db.flush()
        return await self._repo.save(run)

    async def approve(self, run_id: uuid.UUID, actor: CurrentUser) -> PayrollRun:
        run = await self._get_or_404(run_id)
        if run.status != PayrollRunStatus.PROCESSED:
            raise BusinessRuleViolation("Only PROCESSED runs can be approved")
        run.status = PayrollRunStatus.APPROVED
        run.approved_by = actor.employee_id
        run.approved_at = _now()
        return await self._repo.save(run)

    async def lock(self, run_id: uuid.UUID) -> PayrollRun:
        run = await self._get_or_404(run_id)
        if run.status != PayrollRunStatus.APPROVED:
            raise BusinessRuleViolation("Only APPROVED runs can be locked")
        run.status = PayrollRunStatus.LOCKED
        run.locked_at = _now()
        return await self._repo.save(run)

    async def list(self) -> list[PayrollRun]:
        conditions = FilterBuilder(PayrollRun).soft_delete().build()
        return await self._repo.list(conditions)

    async def get(self, run_id: uuid.UUID) -> PayrollRun:
        return await self._get_or_404(run_id)

    async def create_adjustment(self, payload: PayrollAdjustmentCreateRequest, actor: CurrentUser) -> PayrollAdjustment:
        adj = PayrollAdjustment(
            employee_id=payload.employee_id,
            month=payload.month,
            year=payload.year,
            adjustment_type=payload.adjustment_type,
            amount=payload.amount,
            reason=payload.reason,
            created_by=actor.employee_id,
        )
        return await self._repo.save_adjustment(adj)

    async def _get_or_404(self, run_id: uuid.UUID) -> PayrollRun:
        run = await self._repo.get_by_id(run_id)
        if not run:
            raise NotFound("Payroll run not found")
        return run

    @staticmethod
    def _working_days(month: int, year: int) -> int:
        _, days_in_month = calendar.monthrange(year, month)
        return sum(
            1 for d in range(1, days_in_month + 1)
            if calendar.weekday(year, month, d) < 5
        )
