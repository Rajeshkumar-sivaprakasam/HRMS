from typing import Any, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schemas.listing import ListingRequest
from app.shared.utils.filter_builder import apply_sort

ModelT = TypeVar("ModelT")


async def execute_listing(
    db: AsyncSession,
    model: type,
    request: ListingRequest,
    conditions: Any,
    allowed_sort_fields: list[str],
    load_options: list | None = None,
) -> dict:
    count_stmt = select(func.count()).select_from(model).where(conditions)
    total: int = (await db.execute(count_stmt)).scalar_one()

    stmt = select(model).where(conditions)
    if load_options:
        for opt in load_options:
            stmt = stmt.options(opt)

    sort_by = request.filter.sort_by if request.filter else "created_at"
    sort_order = request.filter.sort_order if request.filter else "desc"
    stmt = apply_sort(stmt, model, sort_by, sort_order, allowed_sort_fields)

    if request.pagination_flag:
        stmt = stmt.offset(request.offset).limit(request.limit)

    rows = (await db.execute(stmt)).scalars().all()
    return {"items": rows, "total": total}
