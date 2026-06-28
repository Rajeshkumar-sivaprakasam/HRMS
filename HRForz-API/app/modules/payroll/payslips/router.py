import uuid
import httpx

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions.base import NotFound
from app.models.employee import Employee
from app.models.payroll import Payslip
from app.modules.payroll.payslips.pdf_service import PayslipPDFService
from app.modules.payroll.payslips.schemas import PayslipListResponse, PayslipResponse
from app.modules.organisation.service import OrganisationService
from app.shared.dependencies.auth import AuthRequired, CurrentUser, HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/payroll/payslips", tags=["Payroll - Payslips"])


@router.get("/my", response_model=ApiResponse[list[PayslipListResponse]])
async def my_payslips(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Payslip)
        .where(Payslip.employee_id == current_user.employee_id, Payslip.is_published.is_(True))
        .order_by(Payslip.year.desc(), Payslip.month.desc())
    )
    slips = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([PayslipListResponse.model_validate(s) for s in slips])


@router.get("/latest", response_model=ApiResponse[PayslipResponse])
async def latest_payslip(current_user: CurrentUser = AuthRequired, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Payslip)
        .where(Payslip.employee_id == current_user.employee_id, Payslip.is_published.is_(True))
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .limit(1)
    )
    slip = (await db.execute(stmt)).scalar_one_or_none()
    if not slip:
        raise NotFound("Payslip not found")
    return ApiResponse.ok(PayslipResponse.model_validate(slip))


@router.post("/run/{run_id}/publish", response_model=ApiResponse[None], dependencies=[HROnly])
async def publish_payslips(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import update as sa_update
    await db.execute(
        sa_update(Payslip)
        .where(Payslip.payroll_run_id == run_id)
        .values(is_published=True)
    )
    return ApiResponse.ok(None, "Payslips published")


@router.get("/run/{run_id}", response_model=ApiResponse[list[PayslipResponse]], dependencies=[HROnly])
async def list_run_payslips(
    run_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payslip).where(Payslip.payroll_run_id == run_id)
    slips = list((await db.execute(stmt)).scalars().all())
    return ApiResponse.ok([PayslipResponse.model_validate(s) for s in slips])


@router.get("/{payslip_id}", response_model=ApiResponse[PayslipResponse])
async def get_payslip(
    payslip_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payslip).where(Payslip.id == payslip_id)
    slip = (await db.execute(stmt)).scalar_one_or_none()
    if not slip:
        from app.core.exceptions.base import NotFound
        raise NotFound("Payslip not found")
    if not current_user.is_hr_or_above() and slip.employee_id != current_user.employee_id:
        from app.core.exceptions.base import Forbidden
        raise Forbidden()
    return ApiResponse.ok(PayslipResponse.model_validate(slip))


@router.post("/{payslip_id}/generate-pdf", response_model=ApiResponse[PayslipResponse], dependencies=[HROnly])
async def generate_payslip_pdf(
    payslip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payslip).where(Payslip.id == payslip_id).options(selectinload(Payslip.employee))
    slip = (await db.execute(stmt)).scalar_one_or_none()
    if not slip:
        raise NotFound("Payslip not found")

    emp_stmt = select(Employee).where(Employee.id == slip.employee_id).options(
        selectinload(Employee.department),
        selectinload(Employee.designation)
    )
    emp = (await db.execute(emp_stmt)).scalar_one_or_none()
    if not emp:
        raise NotFound("Employee not found")

    # Fetch organisation data
    org_svc = OrganisationService(db)
    org = await org_svc.get()

    # Generate PDF and upload to S3
    try:
        pdf_url = await PayslipPDFService.generate_and_upload(slip, emp, org)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to generate payslip PDF: {str(e)}", exc_info=True)
        raise

    # Update payslip with pdf_url
    slip.pdf_url = pdf_url
    db.add(slip)
    await db.flush()
    await db.refresh(slip)

    return ApiResponse.ok(PayslipResponse.model_validate(slip), "PDF generated successfully")


@router.get("/{payslip_id}/download")
async def download_payslip(
    payslip_id: uuid.UUID,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payslip).where(Payslip.id == payslip_id)
    slip = (await db.execute(stmt)).scalar_one_or_none()
    if not slip:
        raise NotFound("Payslip not found")
    if not current_user.is_hr_or_above() and slip.employee_id != current_user.employee_id:
        from app.core.exceptions.base import Forbidden
        raise Forbidden()
    if not slip.pdf_url:
        raise NotFound("PDF not available for this payslip")

    # Fetch PDF from S3 on backend (avoids CORS issues)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(slip.pdf_url, timeout=30.0)
            response.raise_for_status()

            return StreamingResponse(
                iter([response.content]),
                media_type="text/html; charset=utf-8",
                headers={
                    "Content-Disposition": f"inline; filename=payslip_{slip.year}_{slip.month:02d}.html",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                }
            )
    except httpx.HTTPError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to fetch PDF from S3: {str(e)}")
        raise NotFound("Failed to download payslip")
