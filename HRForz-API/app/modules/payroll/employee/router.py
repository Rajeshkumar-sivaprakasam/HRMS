from __future__ import annotations

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends

from app.models.employee import Employee
from app.models.payroll import (
    EmployeeSalary,
    Payslip,
    SalaryComponent,
    SalaryRevision,
    SalaryStructureComponent,
)
from app.modules.payroll.employee.schemas import (
    CTCSummaryResponse,
    PFDetailsResponse,
    SalaryBreakupComponentResponse,
    SalaryBreakupResponse,
    SalaryRevisionItemResponse,
)
from app.shared.dependencies.auth import AuthRequired, CurrentUser
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/employee", tags=["Payroll - Employee Finance"])


@router.get("/ctc-summary", response_model=ApiResponse[CTCSummaryResponse])
async def ctc_summary(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(EmployeeSalary)
        .where(EmployeeSalary.employee_id == current_user.employee_id, EmployeeSalary.is_current.is_(True))
        .order_by(EmployeeSalary.effective_from.desc())
        .limit(1)
    )
    salary = (await db.execute(stmt)).scalar_one_or_none()
    if not salary:
        return ApiResponse.ok(
            CTCSummaryResponse(ctc=0, fixed=0, variable=0, benefits=0, effective_from=None),
            "No salary data found"
        )

    return ApiResponse.ok(
        CTCSummaryResponse(
            ctc=salary.ctc,
            fixed=salary.basic + salary.hra,
            variable=salary.ctc - (salary.basic + salary.hra) * 0.5,
            benefits=salary.ctc - salary.basic - salary.hra,
            effective_from=salary.effective_from,
        )
    )


@router.get("/salary-breakup/{month}/{year}", response_model=ApiResponse[SalaryBreakupResponse])
async def salary_breakup(
    month: int,
    year: int,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Payslip)
        .where(
            Payslip.employee_id == current_user.employee_id,
            Payslip.month == month,
            Payslip.year == year,
        )
    )
    payslip = (await db.execute(stmt)).scalar_one_or_none()
    if not payslip:
        return ApiResponse.ok(
            SalaryBreakupResponse(earnings=[], deductions=[], gross_earnings=0, total_deductions=0, net_pay=0),
            "No payslip found"
        )

    import json
    try:
        breakdown = json.loads(payslip.component_breakdown) if payslip.component_breakdown else {}
    except:
        breakdown = {}

    earnings = [
        SalaryBreakupComponentResponse(
            component_name=k,
            monthly_value=v.get("monthly", 0),
            annual_value=v.get("annual", 0),
        )
        for k, v in breakdown.get("earnings", {}).items()
    ]

    deductions = [
        SalaryBreakupComponentResponse(
            component_name=k,
            monthly_value=v.get("monthly", 0),
            annual_value=v.get("annual", 0),
        )
        for k, v in breakdown.get("deductions", {}).items()
    ]

    return ApiResponse.ok(
        SalaryBreakupResponse(
            earnings=earnings,
            deductions=deductions,
            gross_earnings=payslip.gross_salary,
            total_deductions=payslip.total_deductions,
            net_pay=payslip.net_salary,
        )
    )


@router.get("/salary-revisions", response_model=ApiResponse[list[SalaryRevisionItemResponse]])
async def salary_revisions(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SalaryRevision)
        .where(SalaryRevision.employee_id == current_user.employee_id, SalaryRevision.deleted_at.is_(None))
        .order_by(SalaryRevision.effective_from.desc())
    )
    revisions = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([SalaryRevisionItemResponse.model_validate(r) for r in revisions])


@router.get("/pf-details", response_model=ApiResponse[PFDetailsResponse])
async def pf_details(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    stmt = select(Employee).where(Employee.id == current_user.employee_id)
    employee = (await db.execute(stmt)).scalar_one_or_none()
    if not employee:
        return ApiResponse.ok(PFDetailsResponse(), "Employee not found")

    return ApiResponse.ok(PFDetailsResponse.model_validate(employee))
