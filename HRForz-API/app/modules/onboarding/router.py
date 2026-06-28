from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.onboarding.schemas import (
    ActivateRequest,
    ChecklistResponse,
    CompensationStepRequest,
    DocumentListResponse,
    DocumentResponse,
    DocumentStatusUpdate,
    EmploymentStepRequest,
    LeaveOrgStepRequest,
    OnboardingListItem,
    OnboardingResponse,
    PersonalStepRequest,
)
from app.modules.onboarding.service import OnboardingService
from app.shared.dependencies.auth import CurrentUser, HROnly, get_current_user
from app.shared.dependencies.db import get_db
from app.shared.enums.onboarding import DocumentCategory
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import ApiResponse, PaginatedResponse

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

Db = Annotated[AsyncSession, Depends(get_db)]
Auth = Annotated[CurrentUser, Depends(get_current_user)]


@router.post("", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def create_onboarding(current_user: Auth, db: Db):
    svc = OnboardingService(db)
    obj = await svc.create(current_user)
    return ApiResponse.created(OnboardingResponse.model_validate(obj), "Onboarding draft created")


@router.get("/{onboarding_id}", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def get_onboarding(onboarding_id: uuid.UUID, db: Db):
    svc = OnboardingService(db)
    obj = await svc.get(onboarding_id)
    return ApiResponse.ok(OnboardingResponse.model_validate(obj))


@router.post("/list", response_model=PaginatedResponse[OnboardingListItem], dependencies=[HROnly])
async def list_onboardings(request: ListingRequest, db: Db):
    svc = OnboardingService(db)
    items, total = await svc.list(request)
    data = [OnboardingListItem.from_orm_with_relations(i) for i in items]
    return PaginatedResponse.ok(data, total, request.page, request.size)


@router.delete("/{onboarding_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def cancel_onboarding(onboarding_id: uuid.UUID, db: Db):
    svc = OnboardingService(db)
    await svc.cancel(onboarding_id)
    return ApiResponse.ok(None, "Onboarding cancelled")


# ── Step endpoints ────────────────────────────────────────────────────────────

@router.put("/{onboarding_id}/personal", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def save_personal(onboarding_id: uuid.UUID, payload: PersonalStepRequest, db: Db):
    svc = OnboardingService(db)
    obj = await svc.save_personal(onboarding_id, payload)
    return ApiResponse.ok(OnboardingResponse.model_validate(obj), "Personal info saved")


@router.put("/{onboarding_id}/employment", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def save_employment(onboarding_id: uuid.UUID, payload: EmploymentStepRequest, db: Db):
    svc = OnboardingService(db)
    obj = await svc.save_employment(onboarding_id, payload)
    return ApiResponse.ok(OnboardingResponse.model_validate(obj), "Employment details saved")


@router.put("/{onboarding_id}/compensation", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def save_compensation(onboarding_id: uuid.UUID, payload: CompensationStepRequest, db: Db):
    svc = OnboardingService(db)
    obj = await svc.save_compensation(onboarding_id, payload)
    return ApiResponse.ok(OnboardingResponse.model_validate(obj), "Compensation details saved")


@router.put("/{onboarding_id}/leave-org", response_model=ApiResponse[OnboardingResponse], dependencies=[HROnly])
async def save_leave_org(onboarding_id: uuid.UUID, payload: LeaveOrgStepRequest, db: Db):
    svc = OnboardingService(db)
    obj = await svc.save_leave_org(onboarding_id, payload)
    return ApiResponse.ok(OnboardingResponse.model_validate(obj), "Leave & org details saved")


# ── Photo ─────────────────────────────────────────────────────────────────────

@router.post("/{onboarding_id}/photo", response_model=ApiResponse[dict], dependencies=[HROnly])
async def upload_photo(onboarding_id: uuid.UUID, file: UploadFile, db: Db):
    svc = OnboardingService(db)
    obj = await svc.upload_photo(onboarding_id, file)
    return ApiResponse.ok({"profile_picture_url": obj.profile_picture_url}, "Photo uploaded")


# ── Documents ─────────────────────────────────────────────────────────────────

@router.get("/{onboarding_id}/documents", response_model=ApiResponse[DocumentListResponse], dependencies=[HROnly])
async def list_documents(onboarding_id: uuid.UUID, db: Db):
    svc = OnboardingService(db)
    result = await svc.list_documents(onboarding_id)
    return ApiResponse.ok(result)


@router.post("/{onboarding_id}/documents", response_model=ApiResponse[DocumentResponse], dependencies=[HROnly])
async def upload_document(
    onboarding_id: uuid.UUID,
    category: DocumentCategory,
    file: UploadFile,
    current_user: Auth,
    db: Db,
):
    svc = OnboardingService(db)
    doc = await svc.upload_document(onboarding_id, category, file, current_user)
    return ApiResponse.created(DocumentResponse.model_validate(doc), "Document uploaded")


@router.delete("/{onboarding_id}/documents/{doc_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_document(onboarding_id: uuid.UUID, doc_id: uuid.UUID, db: Db):
    svc = OnboardingService(db)
    await svc.delete_document(onboarding_id, doc_id)
    return ApiResponse.ok(None, "Document deleted")


@router.patch("/{onboarding_id}/documents/{doc_id}/verify", response_model=ApiResponse[DocumentResponse], dependencies=[HROnly])
async def verify_document(onboarding_id: uuid.UUID, doc_id: uuid.UUID, current_user: Auth, db: Db):
    svc = OnboardingService(db)
    doc = await svc.verify_document(onboarding_id, doc_id, current_user)
    return ApiResponse.ok(DocumentResponse.model_validate(doc), "Document verified")


@router.patch("/{onboarding_id}/documents/{doc_id}/reject", response_model=ApiResponse[DocumentResponse], dependencies=[HROnly])
async def reject_document(
    onboarding_id: uuid.UUID, doc_id: uuid.UUID, payload: DocumentStatusUpdate, current_user: Auth, db: Db
):
    svc = OnboardingService(db)
    doc = await svc.reject_document(onboarding_id, doc_id, payload.rejection_reason, current_user)
    return ApiResponse.ok(DocumentResponse.model_validate(doc), "Document rejected")


# ── Checklist & Activation ────────────────────────────────────────────────────

@router.get("/{onboarding_id}/checklist", response_model=ApiResponse[ChecklistResponse], dependencies=[HROnly])
async def get_checklist(onboarding_id: uuid.UUID, db: Db):
    svc = OnboardingService(db)
    result = await svc.get_checklist(onboarding_id)
    return ApiResponse.ok(result)


@router.post("/{onboarding_id}/activate", response_model=ApiResponse[dict], dependencies=[HROnly])
async def activate_employee(
    onboarding_id: uuid.UUID, payload: ActivateRequest, current_user: Auth, db: Db
):
    svc = OnboardingService(db)
    employee = await svc.activate(onboarding_id, payload, current_user)
    return ApiResponse.ok(
        {"employee_id": str(employee.id), "employee_code": employee.employee_code},
        "Employee activated successfully",
    )
