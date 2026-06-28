from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.modules.audit.schemas import AuditLogResponse
from app.shared.dependencies.auth import HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.listing import ListingRequest
from app.shared.schemas.response import PaginatedResponse
from app.shared.utils.filter_builder import FilterBuilder, apply_sort

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.post("/list", response_model=PaginatedResponse[AuditLogResponse], dependencies=[HROnly])
async def list_audit_logs(
    request: ListingRequest,
    db: AsyncSession = Depends(get_db),
):
    f = request.filter or {}
    action = getattr(f, "action", None) if hasattr(f, "action") else None
    resource_type = getattr(f, "resource_type", None) if hasattr(f, "resource_type") else None
    from_date = getattr(f, "from_date", None) if hasattr(f, "from_date") else None
    to_date = getattr(f, "to_date", None) if hasattr(f, "to_date") else None
    sort_by = getattr(f, "sort_by", "created_at") if hasattr(f, "sort_by") else "created_at"
    sort_order = getattr(f, "sort_order", "desc") if hasattr(f, "sort_order") else "desc"

    conditions = (
        FilterBuilder(AuditLog)
        .eq("action", action)
        .eq("resource_type", resource_type)
        .date_range("created_at", from_date, to_date)
        .build()
    )

    count_stmt = select(func.count()).select_from(AuditLog).where(conditions)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(AuditLog).where(conditions)
    stmt = apply_sort(stmt, AuditLog, sort_by, sort_order, ["created_at", "action", "resource_type"])
    if request.pagination_flag:
        stmt = stmt.offset(request.offset).limit(request.limit)

    rows = list((await db.execute(stmt)).scalars().all())
    return PaginatedResponse.ok(
        [AuditLogResponse.model_validate(r) for r in rows], total, request.page, request.size
    )
