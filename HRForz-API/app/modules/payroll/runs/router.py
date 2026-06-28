import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payroll.runs.schemas import (
    PayrollAdjustmentCreateRequest,
    PayrollRunInitiateRequest,
    PayrollRunResponse,
)
from app.modules.payroll.runs.service import RunsService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/runs", tags=["Payroll - Runs"])


@router.post("", response_model=ApiResponse[PayrollRunResponse], dependencies=[HROnly])
async def initiate_run(
    payload: PayrollRunInitiateRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    run = await svc.initiate(payload)
    return ApiResponse.created(PayrollRunResponse.model_validate(run), "Payroll run initiated")


@router.post("/{run_id}/process", response_model=ApiResponse[PayrollRunResponse], dependencies=[HROnly])
async def process_run(
    run_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    run = await svc.process(run_id, current_user)
    return ApiResponse.ok(PayrollRunResponse.model_validate(run), "Payroll processed")


@router.post("/{run_id}/approve", response_model=ApiResponse[PayrollRunResponse], dependencies=[HROnly])
async def approve_run(
    run_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    run = await svc.approve(run_id, current_user)
    return ApiResponse.ok(PayrollRunResponse.model_validate(run), "Payroll approved")


@router.post("/{run_id}/lock", response_model=ApiResponse[PayrollRunResponse], dependencies=[HROnly])
async def lock_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    run = await svc.lock(run_id)
    return ApiResponse.ok(PayrollRunResponse.model_validate(run), "Payroll locked")


@router.get("", response_model=ApiResponse[list[PayrollRunResponse]], dependencies=[HROnly])
async def list_runs(db: AsyncSession = Depends(get_db)):
    svc = RunsService(db)
    runs = await svc.list()
    return ApiResponse.ok([PayrollRunResponse.model_validate(r) for r in runs])


@router.get("/{run_id}", response_model=ApiResponse[PayrollRunResponse], dependencies=[HROnly])
async def get_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    run = await svc.get(run_id)
    return ApiResponse.ok(PayrollRunResponse.model_validate(run))


@router.post("/adjustments", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_adjustment(
    payload: PayrollAdjustmentCreateRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    svc = RunsService(db)
    adj = await svc.create_adjustment(payload, current_user)
    return ApiResponse.created({"id": str(adj.id)}, "Adjustment created")
