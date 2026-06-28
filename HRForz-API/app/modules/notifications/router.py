import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.shared.dependencies.auth import AuthRequired, CurrentUser
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ApiResponse[list[dict]])
async def list_notifications(
    unread_only: bool = False,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(
        Notification.recipient_id == current_user.employee_id
    ).order_by(Notification.created_at.desc()).limit(50)

    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))

    items = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([
        {
            "id": str(n.id),
            "type": n.notification_type,
            "title": n.title,
            "body": n.body,
            "is_read": n.is_read,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in items
    ])


@router.patch("/{notif_id}/read", response_model=ApiResponse[None])
async def mark_read(
    notif_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        sa_update(Notification)
        .where(
            Notification.id == notif_id,
            Notification.recipient_id == current_user.employee_id,
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    return ApiResponse.ok(None, "Marked as read")


@router.patch("/mark-all-read", response_model=ApiResponse[None])
async def mark_all_read(
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        sa_update(Notification)
        .where(
            Notification.recipient_id == current_user.employee_id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    return ApiResponse.ok(None, "All notifications marked as read")
