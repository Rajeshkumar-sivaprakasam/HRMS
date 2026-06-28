import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.revisions.schemas import SalaryRevisionCreateRequest, SalaryRevisionResponse
from app.modules.payroll.revisions.service import RevisionsService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/revisions", tags=["Payroll - Revisions"])


@router.post("", response_model=ApiResponse[SalaryRevisionResponse], dependencies=[HROnly])
async def create_revision(
    payload: SalaryRevisionCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = RevisionsService(db)
    rev = await svc.create(payload, current_user)
    return ApiResponse.created(SalaryRevisionResponse.model_validate(rev), "Revision created")


@router.get("/{employee_id}", response_model=ApiResponse[list[SalaryRevisionResponse]])
async def list_revisions(
    employee_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = RevisionsService(db)
    revs = await svc.list(employee_id)
    return ApiResponse.ok([SalaryRevisionResponse.model_validate(r) for r in revs])
