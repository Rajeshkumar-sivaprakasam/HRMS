import uuid
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound
from app.models.announcement import Announcement
from app.modules.announcements.schemas import (
    AnnouncementCreateRequest,
    AnnouncementResponse,
    AnnouncementUpdateRequest,
)
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.post("", response_model=ApiResponse[AnnouncementResponse], dependencies=[HROnly])
async def create_announcement(
    payload: AnnouncementCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    ann = Announcement(
        title=payload.title,
        content=payload.content,
        target_audience=payload.target_audience,
        target_department_id=payload.target_department_id,
        expires_at=payload.expires_at,
        is_pinned=payload.is_pinned,
        is_published=True,
        published_by=current_user.employee_id,
        published_at=today,
    )
    db.add(ann)
    await db.flush()
    await db.refresh(ann)
    return ApiResponse.created(AnnouncementResponse.model_validate(ann), "Announcement created")


@router.get("", response_model=ApiResponse[list[AnnouncementResponse]])
async def list_announcements(
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    stmt = (
        select(Announcement)
        .where(
            Announcement.deleted_at.is_(None),
            Announcement.is_published.is_(True),
            (Announcement.expires_at.is_(None)) | (Announcement.expires_at >= today),
        )
        .order_by(Announcement.is_pinned.desc(), Announcement.published_at.desc())
    )
    items = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([AnnouncementResponse.model_validate(a) for a in items])


@router.put("/{ann_id}", response_model=ApiResponse[AnnouncementResponse], dependencies=[HROnly])
async def update_announcement(
    ann_id: uuid.UUID,
    payload: AnnouncementUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Announcement).where(Announcement.id == ann_id, Announcement.deleted_at.is_(None))
    ann = (await db.execute(stmt)).scalar_one_or_none()
    if not ann:
        raise NotFound("Announcement not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ann, field, value)
    db.add(ann)
    await db.flush()
    await db.refresh(ann)
    return ApiResponse.ok(AnnouncementResponse.model_validate(ann), "Announcement updated")


@router.delete("/{ann_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_announcement(ann_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Announcement).where(Announcement.id == ann_id, Announcement.deleted_at.is_(None))
    ann = (await db.execute(stmt)).scalar_one_or_none()
    if not ann:
        raise NotFound("Announcement not found")
    from datetime import datetime
    ann.deleted_at = datetime.utcnow()
    db.add(ann)
    await db.flush()
    return ApiResponse.ok(None, "Announcement deleted")
