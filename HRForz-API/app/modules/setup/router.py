from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.leave import LeaveBalance, LeavePolicy
from app.models.lookup import Country
from app.models.permission import PermissionPolicy
from app.shared.dependencies.auth import HROnly
from app.shared.dependencies.db import get_db
from app.shared.enums.leave import LeaveType
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/setup", tags=["Setup"])


@router.post("/seed-leave-policies", response_model=ApiResponse[None], dependencies=[HROnly])
async def seed_leave_policies(db: AsyncSession = Depends(get_db)):
    defaults = [
        {"leave_type": LeaveType.CL, "annual_quota": 12, "carry_forward_limit": 5, "is_paid": True},
        {"leave_type": LeaveType.SL, "annual_quota": 6, "carry_forward_limit": 0, "is_paid": True},
        {"leave_type": LeaveType.LOP, "annual_quota": 0, "carry_forward_limit": 0, "is_paid": False},
        {"leave_type": LeaveType.WFH, "annual_quota": 24, "carry_forward_limit": 0, "is_paid": True},
    ]
    for d in defaults:
        existing_stmt = select(LeavePolicy).where(
            LeavePolicy.leave_type == d["leave_type"], LeavePolicy.deleted_at.is_(None)
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()
        if not existing:
            policy = LeavePolicy(**d, requires_approval=True, min_days_notice=1)
            db.add(policy)
    await db.flush()
    return ApiResponse.ok(None, "Leave policies seeded")


@router.post("/seed-permission-policy", response_model=ApiResponse[None], dependencies=[HROnly])
async def seed_permission_policy(db: AsyncSession = Depends(get_db)):
    existing_stmt = select(PermissionPolicy).where(PermissionPolicy.is_active.is_(True))
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if not existing:
        from app.shared.enums.permission import ExcessAction
        policy = PermissionPolicy(
            max_hours_per_day=2,
            max_hours_per_month=8,
            excess_action=ExcessAction.LOP,
        )
        db.add(policy)
        await db.flush()
    return ApiResponse.ok(None, "Permission policy seeded")


@router.post("/initialize-leave-balances/{year}", response_model=ApiResponse[None], dependencies=[HROnly])
async def initialize_leave_balances(year: int, db: AsyncSession = Depends(get_db)):
    from app.models.employee import Employee
    from sqlalchemy import func

    emp_stmt = select(Employee).where(Employee.deleted_at.is_(None), Employee.status == "active")
    employees = list((await db.execute(emp_stmt)).scalars().all())

    policies_stmt = select(LeavePolicy).where(LeavePolicy.deleted_at.is_(None), LeavePolicy.is_active.is_(True))
    policies = list((await db.execute(policies_stmt)).scalars().all())

    for emp in employees:
        for policy in policies:
            existing_stmt = select(LeaveBalance).where(
                LeaveBalance.employee_id == emp.id,
                LeaveBalance.leave_type == policy.leave_type,
                LeaveBalance.year == year,
            )
            existing = (await db.execute(existing_stmt)).scalar_one_or_none()
            if not existing:
                balance = LeaveBalance(
                    employee_id=emp.id,
                    leave_type=policy.leave_type,
                    year=year,
                    entitled=policy.annual_quota,
                )
                db.add(balance)
    await db.flush()
    return ApiResponse.ok(None, f"Leave balances initialized for {year}")


@router.post("/seed-countries", response_model=ApiResponse[None], dependencies=[HROnly])
async def seed_countries(db: AsyncSession = Depends(get_db)):
    countries_data = [
        {"name": "India", "code": "IN", "dial_code": "+91"},
        {"name": "United States", "code": "US", "dial_code": "+1"},
        {"name": "United Kingdom", "code": "GB", "dial_code": "+44"},
        {"name": "Canada", "code": "CA", "dial_code": "+1"},
        {"name": "Australia", "code": "AU", "dial_code": "+61"},
        {"name": "Germany", "code": "DE", "dial_code": "+49"},
        {"name": "France", "code": "FR", "dial_code": "+33"},
        {"name": "Japan", "code": "JP", "dial_code": "+81"},
        {"name": "Singapore", "code": "SG", "dial_code": "+65"},
        {"name": "United Arab Emirates", "code": "AE", "dial_code": "+971"},
    ]
    for data in countries_data:
        existing_stmt = select(Country).where(
            Country.code == data["code"], Country.deleted_at.is_(None)
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()
        if not existing:
            country = Country(**data, is_active=True)
            db.add(country)
    await db.flush()
    return ApiResponse.ok(None, "Countries seeded successfully")
