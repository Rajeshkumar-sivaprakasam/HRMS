from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.employee import Employee, EmployeeDocument
from app.shared.utils.filter_builder import apply_sort


class EmployeeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, employee_id: uuid.UUID) -> Employee | None:
        stmt = select(Employee).where(
            Employee.id == employee_id, Employee.deleted_at.is_(None)
        ).options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.work_location),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_email(self, email: str) -> Employee | None:
        stmt = select(Employee).where(
            Employee.email == email, Employee.deleted_at.is_(None)
        ).options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.work_location),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_by_code(self, code: str) -> Employee | None:
        stmt = select(Employee).where(
            Employee.employee_code == code, Employee.deleted_at.is_(None)
        ).options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.work_location),
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_next_employee_code(self) -> str:
        stmt = select(func.count()).select_from(Employee)
        count = (await self._db.execute(stmt)).scalar_one()
        return f"EMP{str(count + 1).zfill(4)}"

    async def list(
        self,
        conditions: Any,
        sort_by: str,
        sort_order: str,
        offset: int,
        limit: int,
        paginate: bool,
    ) -> tuple[list[Employee], int]:
        allowed = [
            "first_name", "last_name", "email", "employee_code",
            "date_of_joining", "created_at", "status",
        ]
        count_stmt = select(func.count()).select_from(Employee).where(conditions)
        total = (await self._db.execute(count_stmt)).scalar_one()

        stmt = (
            select(Employee)
            .options(
                joinedload(Employee.department),
                joinedload(Employee.designation),
                joinedload(Employee.work_location),
            )
            .where(conditions)
        )
        stmt = apply_sort(stmt, Employee, sort_by, sort_order, allowed)
        if paginate:
            stmt = stmt.offset(offset).limit(limit)

        rows = (await self._db.execute(stmt)).scalars().all()
        return list(rows), total

    async def save(self, employee: Employee) -> Employee:
        self._db.add(employee)
        await self._db.flush()
        await self._db.refresh(employee)
        return employee

    async def soft_delete(self, employee: Employee) -> None:
        employee.deleted_at = datetime.now(timezone.utc)
        self._db.add(employee)
        await self._db.flush()

    async def get_documents(self, employee_id: uuid.UUID) -> list[EmployeeDocument]:
        stmt = select(EmployeeDocument).where(EmployeeDocument.employee_id == employee_id)
        return list((await self._db.execute(stmt)).scalars().all())

    async def add_document(self, doc: EmployeeDocument) -> EmployeeDocument:
        self._db.add(doc)
        await self._db.flush()
        await self._db.refresh(doc)
        return doc

    async def get_document(self, doc_id: uuid.UUID) -> EmployeeDocument | None:
        stmt = select(EmployeeDocument).where(EmployeeDocument.id == doc_id)
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def delete_document(self, doc: EmployeeDocument) -> None:
        await self._db.delete(doc)
        await self._db.flush()
