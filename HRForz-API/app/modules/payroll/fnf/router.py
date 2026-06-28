import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Conflict, NotFound
from app.models.payroll import FnFSettlement
from app.modules.payroll.fnf.schemas import FnFActionRequest, FnFInitiateRequest, FnFResponse
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.enums.payroll import FnFStatus
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/fnf", tags=["Payroll - FnF"])


@router.post("", response_model=ApiResponse[FnFResponse], dependencies=[HROnly])
async def initiate_fnf(
    payload: FnFInitiateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    existing_stmt = select(FnFSettlement).where(
        FnFSettlement.employee_id == payload.employee_id,
        FnFSettlement.deleted_at.is_(None),
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise Conflict("FnF already initiated for this employee")

    net = (
        payload.leave_encashment_amount
        + payload.gratuity_amount
        + payload.other_earnings
        - payload.notice_recovery_amount
        - payload.other_deductions
    )
    settlement = FnFSettlement(
        employee_id=payload.employee_id,
        last_working_day=payload.last_working_day,
        status=FnFStatus.DRAFT,
        notice_period_days=payload.notice_period_days,
        notice_shortfall_days=payload.notice_shortfall_days,
        notice_recovery_amount=payload.notice_recovery_amount,
        leave_encashment_days=payload.leave_encashment_days,
        leave_encashment_amount=payload.leave_encashment_amount,
        gratuity_amount=payload.gratuity_amount,
        other_deductions=payload.other_deductions,
        other_earnings=payload.other_earnings,
        net_payable=round(net, 2),
        processed_by=current_user.employee_id,
        remarks=payload.remarks,
    )
    db.add(settlement)
    await db.flush()
    await db.refresh(settlement)
    return ApiResponse.created(FnFResponse.model_validate(settlement), "FnF initiated")


@router.get("/{employee_id}", response_model=ApiResponse[FnFResponse])
async def get_fnf(
    employee_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FnFSettlement).where(
        FnFSettlement.employee_id == employee_id, FnFSettlement.deleted_at.is_(None)
    )
    s = (await db.execute(stmt)).scalar_one_or_none()
    if not s:
        raise NotFound("FnF settlement not found")
    return ApiResponse.ok(FnFResponse.model_validate(s))


@router.patch("/{settlement_id}/action", response_model=ApiResponse[FnFResponse], dependencies=[HROnly])
async def action_fnf(
    settlement_id: uuid.UUID,
    payload: FnFActionRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FnFSettlement).where(FnFSettlement.id == settlement_id, FnFSettlement.deleted_at.is_(None))
    s = (await db.execute(stmt)).scalar_one_or_none()
    if not s:
        raise NotFound("FnF settlement not found")
    s.status = payload.status
    if payload.settlement_date:
        s.settlement_date = payload.settlement_date
    if payload.remarks:
        s.remarks = payload.remarks
    db.add(s)
    await db.flush()
    await db.refresh(s)
    return ApiResponse.ok(FnFResponse.model_validate(s), "FnF updated")
