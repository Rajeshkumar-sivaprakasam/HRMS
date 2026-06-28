from __future__ import annotations

import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Conflict, NotFound
from app.core.security.password import hash_password
from app.models.employee import Employee, EmployeeDocument
from app.models.user import User
from app.modules.auth.repository import AuthRepository
from app.modules.employees.repository import EmployeeRepository
from app.modules.employees.schemas import (
    BankDetailsRequest,
    EmployeeCreateRequest,
    EmployeeStatusUpdateRequest,
    EmployeeUpdateRequest,
    StatutoryDetailsRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.auth import Role
from app.shared.schemas.listing import ListingRequest
from app.shared.utils.filter_builder import FilterBuilder


class EmployeeService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = EmployeeRepository(db)
        self._auth_repo = AuthRepository(db)

    async def create(self, payload: EmployeeCreateRequest) -> Employee:
        if await self._repo.get_by_email(payload.email):
            raise Conflict("Employee with this email already exists")

        code = await self._repo.get_next_employee_code()
        employee = Employee(
            employee_code=code,
            **payload.model_dump(exclude_unset=False),
        )
        employee = await self._repo.save(employee)

        activation_token = secrets.token_urlsafe(32)
        user = User(
            email=payload.email,
            hashed_password=hash_password(secrets.token_urlsafe(16)),
            role=Role.EMPLOYEE,
            is_active=False,
            is_email_verified=False,
            activation_token=activation_token,
            employee_id=employee.id,
        )
        await self._auth_repo.save(user)

        try:
            from arq import create_pool
            from arq.connections import RedisSettings
            from app.config import get_settings
            settings = get_settings()
            pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
            await pool.enqueue_job("send_activation_email_task", payload.email, activation_token, "activate")
            await pool.aclose()
        except Exception:
            pass

        return employee

    async def get(self, employee_id: uuid.UUID) -> Employee:
        emp = await self._repo.get_by_id(employee_id)
        if not emp:
            raise NotFound("Employee not found")
        return emp

    async def list(self, request: ListingRequest) -> tuple[list[Employee], int]:
        f = request.filter
        search = getattr(f, "search", None)
        status = getattr(f, "status", None)
        dept_id = getattr(f, "department_id", None)
        employment_type = getattr(f, "employment_type", None)

        conditions = (
            FilterBuilder(Employee)
            .soft_delete()
            .eq("status", status)
            .eq("department_id", dept_id)
            .eq("employment_type", employment_type)
            .search(["first_name", "last_name", "email", "employee_code"], search)
            .build()
        )
        return await self._repo.list(
            conditions=conditions,
            sort_by=f.sortBy,
            sort_order=f.sortOrder,
            offset=request.offset,
            limit=request.limit,
            paginate=request.paginationFlag,
        )

    async def _patch(self, employee_id: uuid.UUID, payload: object) -> Employee:
        emp = await self.get(employee_id)
        for field, value in payload.model_dump(exclude_unset=True).items():  # type: ignore[union-attr]
            setattr(emp, field, value)
        return await self._repo.save(emp)

    async def update(self, employee_id: uuid.UUID, payload: EmployeeUpdateRequest) -> Employee:
        return await self._patch(employee_id, payload)

    async def update_statutory(self, employee_id: uuid.UUID, payload: StatutoryDetailsRequest) -> Employee:
        return await self._patch(employee_id, payload)

    async def update_bank_details(self, employee_id: uuid.UUID, payload: BankDetailsRequest) -> Employee:
        emp = await self.get(employee_id)
        emp.bank_name = payload.bank_name
        emp.account_number = payload.account_number
        emp.ifsc_code = payload.ifsc_code
        emp.account_type = payload.account_type
        return await self._repo.save(emp)

    async def update_status(self, employee_id: uuid.UUID, payload: EmployeeStatusUpdateRequest) -> Employee:
        emp = await self.get(employee_id)
        emp.status = payload.status
        if payload.date_of_leaving:
            emp.date_of_leaving = payload.date_of_leaving
        return await self._repo.save(emp)

    async def soft_delete(self, employee_id: uuid.UUID) -> None:
        emp = await self.get(employee_id)
        await self._repo.soft_delete(emp)

    async def get_documents(self, employee_id: uuid.UUID) -> list[EmployeeDocument]:
        await self.get(employee_id)
        return await self._repo.get_documents(employee_id)

    async def upload_document(
        self,
        employee_id: uuid.UUID,
        document_type: str,
        document_name: str,
        file_key: str,
        file_url: str,
        actor: CurrentUser,
    ) -> EmployeeDocument:
        await self.get(employee_id)
        doc = EmployeeDocument(
            employee_id=employee_id,
            document_type=document_type,
            document_name=document_name,
            file_key=file_key,
            file_url=file_url,
            uploaded_by=actor.employee_id,
        )
        return await self._repo.add_document(doc)

    async def delete_document(self, employee_id: uuid.UUID, doc_id: uuid.UUID) -> None:
        await self.get(employee_id)
        doc = await self._repo.get_document(doc_id)
        if not doc or doc.employee_id != employee_id:
            raise NotFound("Document not found")
        await self._repo.delete_document(doc)
