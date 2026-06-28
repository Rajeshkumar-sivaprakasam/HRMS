from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.permissions.schemas import (
    PermissionActionRequest,
    PermissionCreateRequest,
    PermissionPolicyResponse,
    PermissionPolicyUpdateRequest,
    PermissionResponse,
)
from app.modules.permissions.service import PermissionService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly, ManagerOrHR
from app.shared.dependencies.db import get_db
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/permissions", tags=["Permissions"])


@router.post("", response_model=ApiResponse[PermissionResponse])
async def create_permission(
    payload: PermissionCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = PermissionService(db)
    req = await svc.create(payload, current_user)
    return ApiResponse.created(PermissionResponse.model_validate(req), "Permission request submitted")


@router.post("/list", response_model=PaginatedResponse[PermissionResponse])
async def list_permissions(
    request: ListingRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = PermissionService(db)
    items, total = await svc.list(request, current_user)
    return PaginatedResponse.ok(
        [PermissionResponse.model_validate(r) for r in items], total, request.page, request.size
    )


@router.patch("/{req_id}/action", response_model=ApiResponse[PermissionResponse], dependencies=[ManagerOrHR])
async def action_permission(
    req_id: uuid.UUID,
    payload: PermissionActionRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = PermissionService(db)
    req = await svc.action(req_id, payload, current_user)
    return ApiResponse.ok(PermissionResponse.model_validate(req), "Permission actioned")


@router.get("/policy", response_model=ApiResponse[PermissionPolicyResponse])
async def get_policy(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = PermissionService(db)
    policy = await svc.get_policy()
    return ApiResponse.ok(PermissionPolicyResponse.model_validate(policy) if policy else None)


@router.put("/policy", response_model=ApiResponse[PermissionPolicyResponse], dependencies=[HROnly])
async def update_policy(payload: PermissionPolicyUpdateRequest, db: AsyncSession = Depends(get_db)):
    svc = PermissionService(db)
    policy = await svc.update_policy(payload)
    return ApiResponse.ok(PermissionPolicyResponse.model_validate(policy), "Policy updated")
