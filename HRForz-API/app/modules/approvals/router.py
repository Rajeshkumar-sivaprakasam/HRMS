from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.leave import LeaveRequest
from app.models.attendance import AttendanceRegularisation
from app.models.employee import Employee
from app.shared.dependencies.auth import HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

Db = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("/pending", response_model=ApiResponse[list], dependencies=[HROnly])
async def pending_approvals(db: Db):
    """Get list of all pending approvals (leaves and regularisations)"""

    # Get pending leave requests
    leave_stmt = select(LeaveRequest).where(
        LeaveRequest.status == "pending",
        LeaveRequest.deleted_at.is_(None)
    ).options(
        joinedload(LeaveRequest.employee)
    ).order_by(LeaveRequest.applied_on.desc())

    leave_requests = (await db.execute(leave_stmt)).unique().scalars().all()

    # Get pending regularisations
    reg_stmt = select(AttendanceRegularisation).where(
        AttendanceRegularisation.status == "pending",
        AttendanceRegularisation.deleted_at.is_(None)
    ).options(
        joinedload(AttendanceRegularisation.employee)
    ).order_by(AttendanceRegularisation.created_at.desc())

    regularisations = (await db.execute(reg_stmt)).unique().scalars().all()

    # Format leave requests
    leave_data = []
    for leave in leave_requests:
        emp = leave.employee
        leave_data.append({
            "id": str(leave.id),
            "employee_id": str(emp.id),
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "request_type": "Leave",
            "leave_type": leave.leave_type,
            "duration": f"{leave.days_count} days",
            "date_range": f"{leave.from_date.isoformat()} to {leave.to_date.isoformat()}",
            "reason": leave.reason[:50] + "..." if len(leave.reason) > 50 else leave.reason,
            "applied_date": leave.applied_on.isoformat(),
            "avatar_url": emp.profile_picture_url,
        })

    # Format regularisations
    reg_data = []
    for reg in regularisations:
        emp = reg.employee
        reg_data.append({
            "id": str(reg.id),
            "employee_id": str(emp.id),
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "request_type": "Regularisation",
            "duration": "1 day",
            "date_range": reg.attendance_record.attendance_date.isoformat() if reg.attendance_record else "N/A",
            "reason": reg.reason[:50] + "..." if len(reg.reason) > 50 else reg.reason,
            "applied_date": reg.created_at.isoformat(),
            "avatar_url": emp.profile_picture_url,
        })

    # Combine and sort by date
    all_approvals = leave_data + reg_data
    all_approvals.sort(key=lambda x: x["applied_date"], reverse=True)

    return ApiResponse.ok(all_approvals)
