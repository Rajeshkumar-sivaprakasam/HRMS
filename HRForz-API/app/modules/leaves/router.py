from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.leaves.schemas import (
    LeaveActionRequest,
    LeaveBalanceResponse,
    LeaveCancelRequest,
    LeavePolicyResponse,
    LeavePolicyUpdateRequest,
    LeaveRequestCreate,
    LeaveRequestResponse,
)
from app.modules.leaves.service import LeaveService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly, ManagerOrHR
from app.shared.dependencies.db import get_db
from app.shared.enums.leave import LeaveType
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/leaves", tags=["Leaves"])


@router.post("", response_model=ApiResponse[LeaveRequestResponse])
async def apply_leave(
    payload: LeaveRequestCreate,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    req = await svc.apply(payload, current_user)
    return ApiResponse.created(LeaveRequestResponse.model_validate(req), "Leave applied")


@router.post("/list", response_model=PaginatedResponse[LeaveRequestResponse])
async def list_leaves(
    request: ListingRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    items, total = await svc.list(request, current_user)
    data = [LeaveRequestResponse.model_validate(r) for r in items]
    return PaginatedResponse.ok(data, total, request.page, request.size)


@router.patch("/{req_id}/action", response_model=ApiResponse[LeaveRequestResponse], dependencies=[ManagerOrHR])
async def action_leave(
    req_id: uuid.UUID,
    payload: LeaveActionRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    req = await svc.action(req_id, payload, current_user)
    return ApiResponse.ok(LeaveRequestResponse.model_validate(req), "Leave actioned")


@router.patch("/{req_id}/cancel", response_model=ApiResponse[LeaveRequestResponse])
async def cancel_leave(
    req_id: uuid.UUID,
    payload: LeaveCancelRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    req = await svc.cancel(req_id, payload, current_user)
    return ApiResponse.ok(LeaveRequestResponse.model_validate(req), "Leave cancelled")


@router.get("/balances/{employee_id}", response_model=ApiResponse[list[LeaveBalanceResponse]])
async def get_balances(
    employee_id: uuid.UUID,
    year: int = date.today().year,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    balances = await svc.get_balances(employee_id, year)
    return ApiResponse.ok([LeaveBalanceResponse.model_validate(b) for b in balances])


@router.get("/policies", response_model=ApiResponse[list[LeavePolicyResponse]])
async def list_policies(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = LeaveService(db)
    policies = await svc.list_policies()
    return ApiResponse.ok([LeavePolicyResponse.model_validate(p) for p in policies])


@router.put("/policies/{leave_type}", response_model=ApiResponse[LeavePolicyResponse], dependencies=[HROnly])
async def update_policy(
    leave_type: LeaveType,
    payload: LeavePolicyUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = LeaveService(db)
    policy = await svc.update_policy(leave_type, payload)
    return ApiResponse.ok(LeavePolicyResponse.model_validate(policy), "Policy updated")
