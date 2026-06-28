import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.salary.schemas import (
    EmployeeSalaryCreateRequest,
    EmployeeSalaryResponse,
    EmployeeSalaryUpdateRequest,
)
from app.modules.payroll.salary.service import SalaryService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/salary", tags=["Payroll - Salary"])


@router.post("", response_model=ApiResponse[EmployeeSalaryResponse], dependencies=[HROnly])
async def assign_salary(payload: EmployeeSalaryCreateRequest, db: AsyncSession = Depends(get_db)):
    svc = SalaryService(db)
    sal = await svc.assign(payload)
    return ApiResponse.created(EmployeeSalaryResponse.model_validate(sal), "Salary assigned")


@router.get("/{employee_id}/current", response_model=ApiResponse[EmployeeSalaryResponse])
async def get_current_salary(
    employee_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = SalaryService(db)
    sal = await svc.get_current(employee_id)
    return ApiResponse.ok(EmployeeSalaryResponse.model_validate(sal))


@router.get("/{employee_id}/history", response_model=ApiResponse[list[EmployeeSalaryResponse]])
async def salary_history(
    employee_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = SalaryService(db)
    items = await svc.list_history(employee_id)
    return ApiResponse.ok([EmployeeSalaryResponse.model_validate(s) for s in items])


@router.put("/{sal_id}", response_model=ApiResponse[EmployeeSalaryResponse], dependencies=[HROnly])
async def update_salary(
    sal_id: uuid.UUID,
    payload: EmployeeSalaryUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = SalaryService(db)
    sal = await svc.update(sal_id, payload)
    return ApiResponse.ok(EmployeeSalaryResponse.model_validate(sal), "Salary updated")
