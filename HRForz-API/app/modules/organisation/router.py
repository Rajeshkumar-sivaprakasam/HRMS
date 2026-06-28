from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage.s3 import S3StorageClient
from app.modules.organisation.schemas import OrganisationResponse, OrganisationUpdateRequest
from app.modules.organisation.service import OrganisationService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/organisation", tags=["Organisation"])


@router.get("", response_model=ApiResponse[OrganisationResponse])
async def get_organisation(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    svc = OrganisationService(db)
    org = await svc.get()
    return ApiResponse.ok(OrganisationResponse.model_validate(org))


@router.put("", response_model=ApiResponse[OrganisationResponse], dependencies=[HROnly])
async def update_organisation(
    payload: OrganisationUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = OrganisationService(db)
    org = await svc.update(payload)
    return ApiResponse.ok(OrganisationResponse.model_validate(org), "Organisation updated")


@router.post("/logo", response_model=ApiResponse[OrganisationResponse], dependencies=[HROnly])
async def upload_logo(file: UploadFile, db: AsyncSession = Depends(get_db)):
    storage = S3StorageClient()
    key = storage.build_key("org-logos", file.filename or "logo")
    content = await file.read()
    await storage.upload(content, key, file.content_type or "image/png")
    url = await storage.get_presigned_url(key)
    svc = OrganisationService(db)
    org = await svc.upload_logo(key, url)
    return ApiResponse.ok(OrganisationResponse.model_validate(org), "Logo uploaded")
