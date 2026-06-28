from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import Payslip, PayrollRun
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/reports", tags=["Payroll - Reports"])


@router.get("/summary", response_model=ApiResponse[list[dict]], dependencies=[HROnly])
async def monthly_summary(
    year: int,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            PayrollRun.month,
            PayrollRun.year,
            PayrollRun.total_employees,
            PayrollRun.total_gross,
            PayrollRun.total_deductions,
            PayrollRun.total_net,
            PayrollRun.status,
        )
        .where(PayrollRun.year == year, PayrollRun.deleted_at.is_(None))
        .order_by(PayrollRun.month)
    )
    rows = (await db.execute(stmt)).all()
    result = [
        {
            "month": r.month,
            "year": r.year,
            "total_employees": r.total_employees,
            "total_gross": float(r.total_gross),
            "total_deductions": float(r.total_deductions),
            "total_net": float(r.total_net),
            "status": r.status,
        }
        for r in rows
    ]
    return ApiResponse.ok(result)


@router.get("/cost-sheet/{run_id}", response_model=ApiResponse[list[dict]], dependencies=[HROnly])
async def cost_sheet(
    run_id: str,
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    stmt = (
        select(Payslip)
        .where(Payslip.payroll_run_id == _uuid.UUID(run_id))
        .order_by(Payslip.employee_id)
    )
    slips = list((await db.execute(stmt)).scalars().all())
    result = [
        {
            "employee_id": str(s.employee_id),
            "gross": float(s.gross_salary),
            "deductions": float(s.total_deductions),
            "net": float(s.net_salary),
            "pf_employee": float(s.pf_employee),
            "pf_employer": float(s.pf_employer),
            "esi_employee": float(s.esi_employee),
            "esi_employer": float(s.esi_employer),
            "tds": float(s.tds),
        }
        for s in slips
    ]
    return ApiResponse.ok(result)
