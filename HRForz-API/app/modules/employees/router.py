from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage.s3 import S3StorageClient
from app.modules.employees.schemas import (
    BankDetailsRequest,
    EmployeeCreateRequest,
    EmployeeListItem,
    EmployeeResponse,
    EmployeeStatusUpdateRequest,
    EmployeeUpdateRequest,
    StatutoryDetailsRequest,
)
from app.modules.employees.service import EmployeeService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly, get_current_user
from app.shared.dependencies.db import get_db
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/employees", tags=["Employees"])

Db = Annotated[AsyncSession, Depends(get_db)]
Auth = Annotated[CurrentUser, Depends(get_current_user)]


@router.post("", response_model=ApiResponse[EmployeeResponse], dependencies=[HROnly])
async def create_employee(payload: EmployeeCreateRequest, db: Db):
    service = EmployeeService(db)
    emp = await service.create(payload)
    return ApiResponse.created(EmployeeResponse.model_validate(emp), "Employee created")


@router.post("/list", response_model=PaginatedResponse[EmployeeListItem], dependencies=[AuthRequired])
async def list_employees(request: ListingRequest, db: Db):
    service = EmployeeService(db)
    items, total = await service.list(request)
    data = [EmployeeListItem.model_validate(e) for e in items]
    return PaginatedResponse.ok(data, total, request.page, request.size)


@router.get("/me", response_model=ApiResponse[EmployeeResponse], dependencies=[AuthRequired])
async def get_current_user_profile(current_user: Auth, db: Db):
    service = EmployeeService(db)
    emp = await service.get(current_user.employee_id)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp))


@router.get("/{employee_id}", response_model=ApiResponse[EmployeeResponse], dependencies=[AuthRequired])
async def get_employee(employee_id: uuid.UUID, db: Db):
    service = EmployeeService(db)
    emp = await service.get(employee_id)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp))


@router.put("/{employee_id}", response_model=ApiResponse[EmployeeResponse], dependencies=[AuthRequired])
async def update_employee(employee_id: uuid.UUID, payload: EmployeeUpdateRequest, db: Db):
    service = EmployeeService(db)
    emp = await service.update(employee_id, payload)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp), "Employee updated")


@router.put("/{employee_id}/bank-details", response_model=ApiResponse[EmployeeResponse], dependencies=[AuthRequired])
async def update_bank_details(employee_id: uuid.UUID, payload: BankDetailsRequest, db: Db):
    service = EmployeeService(db)
    emp = await service.update_bank_details(employee_id, payload)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp), "Bank details updated")


@router.put("/{employee_id}/statutory", response_model=ApiResponse[EmployeeResponse], dependencies=[HROnly])
async def update_statutory(employee_id: uuid.UUID, payload: StatutoryDetailsRequest, db: Db):
    service = EmployeeService(db)
    emp = await service.update_statutory(employee_id, payload)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp), "Statutory details updated")


@router.patch("/{employee_id}/status", response_model=ApiResponse[EmployeeResponse], dependencies=[HROnly])
async def update_status(employee_id: uuid.UUID, payload: EmployeeStatusUpdateRequest, db: Db):
    service = EmployeeService(db)
    emp = await service.update_status(employee_id, payload)
    return ApiResponse.ok(EmployeeResponse.model_validate(emp), "Status updated")


@router.delete("/{employee_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_employee(employee_id: uuid.UUID, db: Db):
    service = EmployeeService(db)
    await service.soft_delete(employee_id)
    return ApiResponse.ok(None, "Employee deleted")


@router.get("/{employee_id}/documents", response_model=ApiResponse[list], dependencies=[AuthRequired])
async def get_documents(employee_id: uuid.UUID, db: Db):
    service = EmployeeService(db)
    docs = await service.get_documents(employee_id)
    return ApiResponse.ok(docs)


@router.post("/{employee_id}/documents", response_model=ApiResponse[dict])
async def upload_document(
    employee_id: uuid.UUID,
    document_type: str,
    document_name: str,
    file: UploadFile,
    current_user: Auth,
    db: Db,
):
    storage = S3StorageClient()
    key = storage.build_key("employee-docs", file.filename or "document")
    content = await file.read()
    await storage.upload(content, key, file.content_type or "application/octet-stream")
    url = await storage.get_presigned_url(key)

    service = EmployeeService(db)
    doc = await service.upload_document(
        employee_id, document_type, document_name, key, url, current_user
    )
    return ApiResponse.created({"id": str(doc.id), "url": url}, "Document uploaded")


@router.delete("/{employee_id}/documents/{doc_id}", response_model=ApiResponse[None], dependencies=[AuthRequired])
async def delete_document(employee_id: uuid.UUID, doc_id: uuid.UUID, db: Db):
    service = EmployeeService(db)
    await service.delete_document(employee_id, doc_id)
    return ApiResponse.ok(None, "Document deleted")
