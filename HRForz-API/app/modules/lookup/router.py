from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.lookup.schemas import (
    AccountTypeRequest,
    AccountTypeResponse,
    LeavePlanRequest,
    LeavePlanResponse,
    LeavePlanDropdownItem,
)
from app.modules.lookup.service import LookupService
from app.shared.dependencies.auth import AuthRequired, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

Db = Annotated[AsyncSession, Depends(get_db)]

# Dropdown routers
dropdown_router = APIRouter(prefix="/dropdowns", tags=["Dropdowns"])

# CRUD routers
account_type_router = APIRouter(prefix="/account-types", tags=["Account Types"])
leave_plan_router = APIRouter(prefix="/leave-plans", tags=["Leave Plans"])


# Account Type Dropdowns
@dropdown_router.get("/account-types", response_model=ApiResponse[list[AccountTypeResponse]])
async def get_account_types_dropdown(db: Db):
    service = LookupService(db)
    types = await service.list_account_types(active_only=True)
    return ApiResponse.ok([AccountTypeResponse.model_validate(t) for t in types])


# Leave Plan Dropdowns
@dropdown_router.get("/leave-plans", response_model=ApiResponse[list[LeavePlanDropdownItem]])
async def get_leave_plans_dropdown(db: Db):
    service = LookupService(db)
    plans = await service.list_leave_plans(active_only=True)
    return ApiResponse.ok([LeavePlanDropdownItem.model_validate(p) for p in plans])


# Account Type CRUD
@account_type_router.post("", response_model=ApiResponse[AccountTypeResponse], dependencies=[HROnly])
async def create_account_type(payload: AccountTypeRequest, db: Db):
    service = LookupService(db)
    account_type = await service.create_account_type(payload)
    return ApiResponse.created(AccountTypeResponse.model_validate(account_type), "Account type created")


@account_type_router.get("/{account_type_id}", response_model=ApiResponse[AccountTypeResponse], dependencies=[AuthRequired])
async def get_account_type(account_type_id: uuid.UUID, db: Db):
    service = LookupService(db)
    account_type = await service.get_account_type(account_type_id)
    return ApiResponse.ok(AccountTypeResponse.model_validate(account_type))


@account_type_router.get("", response_model=ApiResponse[list[AccountTypeResponse]], dependencies=[AuthRequired])
async def list_account_types(db: Db):
    service = LookupService(db)
    account_types = await service.list_account_types(active_only=False)
    return ApiResponse.ok([AccountTypeResponse.model_validate(t) for t in account_types])


@account_type_router.put("/{account_type_id}", response_model=ApiResponse[AccountTypeResponse], dependencies=[HROnly])
async def update_account_type(account_type_id: uuid.UUID, payload: AccountTypeRequest, db: Db):
    service = LookupService(db)
    account_type = await service.update_account_type(account_type_id, payload)
    return ApiResponse.ok(AccountTypeResponse.model_validate(account_type), "Account type updated")


@account_type_router.delete("/{account_type_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_account_type(account_type_id: uuid.UUID, db: Db):
    service = LookupService(db)
    await service.delete_account_type(account_type_id)
    return ApiResponse.ok(None, "Account type deleted")


# Leave Plan CRUD
@leave_plan_router.post("", response_model=ApiResponse[LeavePlanResponse], dependencies=[HROnly])
async def create_leave_plan(payload: LeavePlanRequest, db: Db):
    service = LookupService(db)
    leave_plan = await service.create_leave_plan(payload)
    return ApiResponse.created(LeavePlanResponse.model_validate(leave_plan), "Leave plan created")


@leave_plan_router.get("/{leave_plan_id}", response_model=ApiResponse[LeavePlanResponse], dependencies=[AuthRequired])
async def get_leave_plan(leave_plan_id: uuid.UUID, db: Db):
    service = LookupService(db)
    leave_plan = await service.get_leave_plan(leave_plan_id)
    return ApiResponse.ok(LeavePlanResponse.model_validate(leave_plan))


@leave_plan_router.get("", response_model=ApiResponse[list[LeavePlanResponse]], dependencies=[AuthRequired])
async def list_leave_plans(db: Db):
    service = LookupService(db)
    leave_plans = await service.list_leave_plans(active_only=False)
    return ApiResponse.ok([LeavePlanResponse.model_validate(p) for p in leave_plans])


@leave_plan_router.put("/{leave_plan_id}", response_model=ApiResponse[LeavePlanResponse], dependencies=[HROnly])
async def update_leave_plan(leave_plan_id: uuid.UUID, payload: LeavePlanRequest, db: Db):
    service = LookupService(db)
    leave_plan = await service.update_leave_plan(leave_plan_id, payload)
    return ApiResponse.ok(LeavePlanResponse.model_validate(leave_plan), "Leave plan updated")


@leave_plan_router.delete("/{leave_plan_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_leave_plan(leave_plan_id: uuid.UUID, db: Db):
    service = LookupService(db)
    await service.delete_leave_plan(leave_plan_id)
    return ApiResponse.ok(None, "Leave plan deleted")
