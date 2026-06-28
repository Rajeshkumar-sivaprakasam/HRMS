import json
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payroll import TDSDeclaration
from app.modules.payroll.tds.schemas import (
    TDSDeclarationCreateRequest,
    TDSDeclarationResponse,
    TDSDeclarationUpdateRequest,
)
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/tds", tags=["Payroll - TDS"])


@router.post("", response_model=ApiResponse[TDSDeclarationResponse])
async def create_declaration(
    payload: TDSDeclarationCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    decl = TDSDeclaration(
        employee_id=payload.employee_id,
        financial_year=payload.financial_year,
        tax_regime=payload.tax_regime,
        declared_amount=payload.declared_amount,
        declaration_data=json.dumps(payload.declaration_data) if payload.declaration_data else None,
    )
    db.add(decl)
    await db.flush()
    await db.refresh(decl)
    return ApiResponse.created(TDSDeclarationResponse.model_validate(decl), "Declaration submitted")


@router.get("/{employee_id}", response_model=ApiResponse[list[TDSDeclarationResponse]])
async def list_declarations(
    employee_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TDSDeclaration).where(
        TDSDeclaration.employee_id == employee_id, TDSDeclaration.deleted_at.is_(None)
    ).order_by(TDSDeclaration.financial_year.desc())
    items = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([TDSDeclarationResponse.model_validate(d) for d in items])


@router.put("/{decl_id}", response_model=ApiResponse[TDSDeclarationResponse], dependencies=[HROnly])
async def update_declaration(
    decl_id: uuid.UUID,
    payload: TDSDeclarationUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TDSDeclaration).where(TDSDeclaration.id == decl_id, TDSDeclaration.deleted_at.is_(None))
    decl = (await db.execute(stmt)).scalar_one_or_none()
    if not decl:
        from app.core.exceptions.base import NotFound
        raise NotFound("Declaration not found")
    for field, value in payload.model_dump(exclude_unset=True, exclude={"declaration_data"}).items():
        setattr(decl, field, value)
    if payload.declaration_data is not None:
        decl.declaration_data = json.dumps(payload.declaration_data)
    db.add(decl)
    await db.flush()
    await db.refresh(decl)
    return ApiResponse.ok(TDSDeclarationResponse.model_validate(decl), "Declaration updated")
