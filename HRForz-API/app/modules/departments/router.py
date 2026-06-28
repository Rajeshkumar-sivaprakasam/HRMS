from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.departments.schemas import (
    DepartmentCreateRequest,
    DepartmentResponse,
    DepartmentUpdateRequest,
)
from app.modules.departments.service import DepartmentService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("", response_model=ApiResponse[DepartmentResponse], dependencies=[HROnly])
async def create_department(
    payload: DepartmentCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = DepartmentService(db)
    dept = await service.create(payload)
    return ApiResponse.created(DepartmentResponse.model_validate(dept), "Department created")


@router.get("", response_model=ApiResponse[list[DepartmentResponse]])
async def list_departments(
    search: str | None = None,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = DepartmentService(db)
    depts = await service.list(search)
    return ApiResponse.ok([DepartmentResponse.model_validate(d) for d in depts])


@router.get("/{dept_id}", response_model=ApiResponse[DepartmentResponse])
async def get_department(
    dept_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = DepartmentService(db)
    dept = await service.get(dept_id)
    return ApiResponse.ok(DepartmentResponse.model_validate(dept))


@router.put("/{dept_id}", response_model=ApiResponse[DepartmentResponse], dependencies=[HROnly])
async def update_department(
    dept_id: uuid.UUID,
    payload: DepartmentUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = DepartmentService(db)
    dept = await service.update(dept_id, payload)
    return ApiResponse.ok(DepartmentResponse.model_validate(dept), "Department updated")


@router.delete("/{dept_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_department(
    dept_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = DepartmentService(db)
    await service.delete(dept_id)
    return ApiResponse.ok(None, "Department deleted")
