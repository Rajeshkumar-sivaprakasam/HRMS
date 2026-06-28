from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department, Designation, WorkLocation
from app.models.employee import Employee
from app.models.helpdesk import HelpdeskCategory
from app.models.lookup import BloodGroup, Country, HolidayType, MaritalStatus, Nationality, Relationship
from app.models.payroll import SalaryStructure
from app.shared.dependencies.auth import AuthRequired, CurrentUser
from app.shared.dependencies.db import get_db
from app.shared.enums.employee import EmployeeStatus, EmploymentType, Gender, WorkLocationType
from app.shared.enums.leave import LeaveType
from app.shared.enums.payroll import PaymentMode, SalaryRevisionType, TaxRegime
from app.shared.enums.permission import PermissionType
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/dropdowns", tags=["Dropdowns"])

Db = Depends(get_db)


def _enum_options(enum_cls) -> list[dict]:
    return [{"id": e.value, "code": e.value, "label": e.value.replace("_", " ").title()} for e in enum_cls]


async def _fetch_all(db: AsyncSession, model, name_col, code_col=None) -> list[dict]:
    cols = [model.id, name_col] + ([code_col] if code_col is not None else [])
    rows = (await db.execute(
        select(*cols)
        .where(model.deleted_at.is_(None), model.is_active.is_(True))
        .order_by(name_col)
    )).all()
    return [{"id": str(r.id), "code": r.code if code_col is not None else None, "label": r.name} for r in rows]


# ── DB-backed dropdowns (no pagination) ───────────────────────────────────────

@router.get("/departments", response_model=ApiResponse[list[dict]])
async def departments_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, Department, Department.name, Department.code))


@router.get("/designations", response_model=ApiResponse[list[dict]])
async def designations_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, Designation, Designation.name, Designation.code))


@router.get("/work-locations", response_model=ApiResponse[list[dict]])
async def work_locations_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, WorkLocation, WorkLocation.name, WorkLocation.code))


@router.get("/salary-structures", response_model=ApiResponse[list[dict]])
async def salary_structures_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, SalaryStructure, SalaryStructure.name))


@router.get("/helpdesk-categories", response_model=ApiResponse[list[dict]])
async def helpdesk_categories_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, HelpdeskCategory, HelpdeskCategory.name))


@router.get("/countries", response_model=ApiResponse[list[dict]])
async def countries_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, Country, Country.name, Country.code))


@router.get("/nationalities", response_model=ApiResponse[list[dict]])
async def nationalities_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, Nationality, Nationality.name, Nationality.code))


@router.get("/blood-groups", response_model=ApiResponse[list[dict]])
async def blood_groups_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, BloodGroup, BloodGroup.name, BloodGroup.code))


@router.get("/relationships", response_model=ApiResponse[list[dict]])
async def relationships_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, Relationship, Relationship.name, Relationship.code))


@router.get("/marital-statuses", response_model=ApiResponse[list[dict]])
async def marital_statuses_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, MaritalStatus, MaritalStatus.name, MaritalStatus.code))


@router.get("/holiday-types", response_model=ApiResponse[list[dict]])
async def holiday_types_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    return ApiResponse.ok(await _fetch_all(db, HolidayType, HolidayType.name, HolidayType.code))


@router.get("/managers", response_model=ApiResponse[list[dict]])
async def managers_dropdown(_: CurrentUser = AuthRequired, db: AsyncSession = Db):
    rows = (await db.execute(
        select(Employee.id, Employee.employee_code, Employee.first_name, Employee.last_name)
        .where(Employee.deleted_at.is_(None), Employee.status == EmployeeStatus.ACTIVE)
        .order_by(Employee.first_name)
    )).all()
    return ApiResponse.ok([
        {"id": str(r.id), "code": r.employee_code, "label": f"{r.first_name} {r.last_name}"}
        for r in rows
    ])


# ── Enum-based dropdowns (fixed values) ───────────────────────────────────────

@router.get("/leave-types", response_model=ApiResponse[list[dict]])
async def leave_types(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(LeaveType))


@router.get("/gender", response_model=ApiResponse[list[dict]])
async def gender_options(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(Gender))


@router.get("/employment-types", response_model=ApiResponse[list[dict]])
async def employment_types(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(EmploymentType))


@router.get("/employee-statuses", response_model=ApiResponse[list[dict]])
async def employee_statuses(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(EmployeeStatus))


@router.get("/work-location-types", response_model=ApiResponse[list[dict]])
async def work_location_types(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(WorkLocationType))


@router.get("/permission-types", response_model=ApiResponse[list[dict]])
async def permission_types(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(PermissionType))


@router.get("/tax-regimes", response_model=ApiResponse[list[dict]])
async def tax_regimes(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(TaxRegime))


@router.get("/payment-modes", response_model=ApiResponse[list[dict]])
async def payment_modes(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(PaymentMode))


@router.get("/revision-types", response_model=ApiResponse[list[dict]])
async def revision_types(_: CurrentUser = AuthRequired):
    return ApiResponse.ok(_enum_options(SalaryRevisionType))
