from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy import and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import BusinessRuleViolation, Conflict, NotFound
from app.core.storage.s3 import S3StorageClient
from app.models.employee import Employee, EmployeeDocument
from app.models.leave import LeaveBalance
from app.models.onboarding import EmployeeOnboarding, OnboardingDocument
from app.models.payroll import EmployeeSalary
from app.models.user import User
from app.modules.onboarding.repository import OnboardingRepository
from app.modules.onboarding.schemas import (
    ActivateRequest,
    ChecklistResponse,
    ChecklistStep,
    CompensationStepRequest,
    DocumentListResponse,
    DocumentResponse,
    EmploymentStepRequest,
    LeaveOrgStepRequest,
    PersonalStepRequest,
)
from app.shared.dependencies.auth import CurrentUser
from app.shared.enums.auth import Role
from app.shared.enums.employee import EmployeeStatus
from app.shared.enums.onboarding import (
    REQUIRED_CATEGORIES,
    SINGLE_FILE_CATEGORIES,
    DocumentCategory,
    DocumentStatus,
    OnboardingStatus,
)
from app.shared.schemas.listing import ListingRequest

_STEP_REQUIRED: dict[str, list[str]] = {
    "personal": ["first_name", "last_name", "personal_email", "mobile_number"],
    "employment": ["department_id", "work_location_id", "employment_type", "date_of_joining", "reporting_manager_id"],
    "compensation": ["annual_ctc", "ctc_effective_from"],
    "leave_org": ["leave_plan"],
}

_STEP_LABELS = {
    "personal": "Personal information",
    "employment": "Employment & manager",
    "compensation": "CTC & bank",
    "leave_org": "Leave & org policies",
    "documents": "Documents",
}


class OnboardingService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = OnboardingRepository(db)
        self._db = db
        self._storage = S3StorageClient()

    async def create(self, actor: CurrentUser) -> EmployeeOnboarding:
        code = await self._repo.get_next_code()
        draft = EmployeeOnboarding(
            auto_employee_code=code,
            status=OnboardingStatus.DRAFT,
            created_by=actor.employee_id,
        )
        return await self._repo.save(draft)

    async def get(self, onboarding_id: uuid.UUID) -> EmployeeOnboarding:
        obj = await self._repo.get_by_id(onboarding_id)
        if not obj:
            raise NotFound("Onboarding draft", str(onboarding_id))
        return obj

    async def list(self, request: ListingRequest) -> tuple[list[EmployeeOnboarding], int]:
        from app.models.onboarding import EmployeeOnboarding as OB

        f = request.filter
        search = getattr(f, "search", None)
        status = getattr(f, "status", None)

        filters = [OB.status != OnboardingStatus.CANCELLED]
        if status:
            filters.append(OB.status == status)
        if search:
            filters.append(
                or_(
                    OB.first_name.ilike(f"%{search}%"),
                    OB.last_name.ilike(f"%{search}%"),
                    OB.personal_email.ilike(f"%{search}%"),
                    OB.auto_employee_code.ilike(f"%{search}%"),
                )
            )
        conditions = and_(*filters)
        return await self._repo.list(conditions, request.offset, request.limit, request.paginationFlag)

    async def cancel(self, onboarding_id: uuid.UUID) -> None:
        obj = await self.get(onboarding_id)
        if obj.status == OnboardingStatus.ACTIVATED:
            raise BusinessRuleViolation("Cannot cancel an activated onboarding")
        obj.status = OnboardingStatus.CANCELLED
        await self._repo.save(obj)

    # ── Step saves ────────────────────────────────────────────────────────────

    async def save_personal(self, onboarding_id: uuid.UUID, payload: PersonalStepRequest) -> EmployeeOnboarding:
        return await self._apply_step(onboarding_id, payload)

    async def save_employment(self, onboarding_id: uuid.UUID, payload: EmploymentStepRequest) -> EmployeeOnboarding:
        return await self._apply_step(onboarding_id, payload)

    async def save_compensation(self, onboarding_id: uuid.UUID, payload: CompensationStepRequest) -> EmployeeOnboarding:
        return await self._apply_step(onboarding_id, payload)

    async def save_leave_org(self, onboarding_id: uuid.UUID, payload: LeaveOrgStepRequest) -> EmployeeOnboarding:
        return await self._apply_step(onboarding_id, payload)

    async def _apply_step(self, onboarding_id: uuid.UUID, payload: object) -> EmployeeOnboarding:
        obj = await self.get(onboarding_id)
        self._assert_draft(obj)
        for field, value in payload.model_dump(exclude_unset=True).items():  # type: ignore[union-attr]
            setattr(obj, field, value)
        return await self._repo.save(obj)

    # ── Photo ─────────────────────────────────────────────────────────────────

    async def upload_photo(self, onboarding_id: uuid.UUID, file: UploadFile) -> EmployeeOnboarding:
        obj = await self.get(onboarding_id)
        self._assert_draft(obj)

        if obj.profile_picture_key:
            await self._storage.delete(obj.profile_picture_key)

        content = await file.read()
        key = S3StorageClient.build_document_key(obj.auto_employee_code, "profile", file.filename or "photo.jpg")
        await self._storage.upload(content, key, file.content_type or "image/jpeg")
        url = await self._storage.get_presigned_url(key)

        obj.profile_picture_key = key
        obj.profile_picture_url = url
        return await self._repo.save(obj)

    # ── Documents ─────────────────────────────────────────────────────────────

    async def list_documents(self, onboarding_id: uuid.UUID) -> DocumentListResponse:
        await self.get(onboarding_id)
        docs = await self._repo.get_documents(onboarding_id)
        counts = await self._repo.count_documents_by_status(onboarding_id)
        return DocumentListResponse(
            **counts,
            documents=[DocumentResponse.model_validate(d) for d in docs],
        )

    async def upload_document(
        self,
        onboarding_id: uuid.UUID,
        category: DocumentCategory,
        file: UploadFile,
        actor: CurrentUser,
    ) -> OnboardingDocument:
        obj = await self.get(onboarding_id)
        self._assert_draft(obj)

        if category in SINGLE_FILE_CATEGORIES:
            existing = await self._repo.get_document_by_category(onboarding_id, category)
            if existing:
                await self._storage.delete(existing.file_key)
                await self._repo.delete_document(existing)

        content = await file.read()
        key = S3StorageClient.build_document_key(
            obj.auto_employee_code, category.value, file.filename or "document"
        )
        await self._storage.upload(content, key, file.content_type or "application/octet-stream")
        url = await self._storage.get_presigned_url(key)

        doc = OnboardingDocument(
            onboarding_id=onboarding_id,
            category=category,
            document_name=file.filename or category.value,
            file_key=key,
            file_url=url,
            is_required=category in REQUIRED_CATEGORIES,
            status=DocumentStatus.UPLOADED,
            uploaded_by=actor.employee_id,
        )
        return await self._repo.save_document(doc)

    async def delete_document(self, onboarding_id: uuid.UUID, doc_id: uuid.UUID) -> None:
        await self.get(onboarding_id)
        doc = await self._repo.get_document(doc_id)
        if not doc or doc.onboarding_id != onboarding_id:
            raise NotFound("Document", str(doc_id))
        await self._storage.delete(doc.file_key)
        await self._repo.delete_document(doc)

    async def verify_document(self, onboarding_id: uuid.UUID, doc_id: uuid.UUID, actor: CurrentUser) -> OnboardingDocument:
        doc = await self._get_doc_or_404(onboarding_id, doc_id)
        doc.status = DocumentStatus.VERIFIED
        doc.verified_by = actor.employee_id
        doc.verified_at = datetime.now(timezone.utc)
        doc.rejection_reason = None
        return await self._repo.save_document(doc)

    async def reject_document(
        self, onboarding_id: uuid.UUID, doc_id: uuid.UUID, reason: str | None, actor: CurrentUser
    ) -> OnboardingDocument:
        doc = await self._get_doc_or_404(onboarding_id, doc_id)
        doc.status = DocumentStatus.REJECTED
        doc.rejection_reason = reason
        doc.verified_by = actor.employee_id
        doc.verified_at = datetime.now(timezone.utc)
        return await self._repo.save_document(doc)

    # ── Checklist ─────────────────────────────────────────────────────────────

    async def get_checklist(self, onboarding_id: uuid.UUID) -> ChecklistResponse:
        obj = await self.get(onboarding_id)
        docs = await self._repo.get_documents(onboarding_id)
        uploaded_categories = {d.category for d in docs}

        step_complete = {
            "personal": all(getattr(obj, f) for f in _STEP_REQUIRED["personal"]),
            "employment": all(getattr(obj, f) for f in _STEP_REQUIRED["employment"]),
            "compensation": all(getattr(obj, f) for f in _STEP_REQUIRED["compensation"]),
            "leave_org": all(getattr(obj, f) for f in _STEP_REQUIRED["leave_org"]),
            "documents": all(cat in uploaded_categories for cat in REQUIRED_CATEGORIES),
        }

        completed = sum(step_complete.values())
        steps = [
            ChecklistStep(key=k, label=_STEP_LABELS[k], complete=v)
            for k, v in step_complete.items()
        ]
        return ChecklistResponse(
            progress_percent=int((completed / len(step_complete)) * 100),
            steps=steps,
        )

    # ── Activation ────────────────────────────────────────────────────────────

    async def activate(
        self, onboarding_id: uuid.UUID, payload: ActivateRequest, actor: CurrentUser
    ) -> Employee:
        obj = await self.get(onboarding_id)
        self._assert_draft(obj)

        errors = self._validate_for_activation(obj)
        if errors:
            raise BusinessRuleViolation(f"Missing required fields: {', '.join(errors)}")

        from app.modules.employees.repository import EmployeeRepository
        from app.modules.auth.repository import AuthRepository
        from app.core.security.password import hash_password
        import secrets

        emp_repo = EmployeeRepository(self._db)
        auth_repo = AuthRepository(self._db)

        if await emp_repo.get_by_email(obj.personal_email):  # type: ignore[arg-type]
            raise Conflict("An employee with this email already exists")

        employee = Employee(
            employee_code=obj.auto_employee_code,
            first_name=obj.first_name,
            last_name=obj.last_name,
            email=obj.personal_email,
            phone=obj.mobile_number,
            gender=obj.gender,
            date_of_birth=obj.date_of_birth,
            profile_picture_url=obj.profile_picture_url,
            status=EmployeeStatus.ACTIVE,
            employment_type=obj.employment_type,
            date_of_joining=obj.date_of_joining,
            probation_end_date=obj.probation_end_date,
            notice_period_days=obj.notice_period_days,
            department_id=obj.department_id,
            work_location_id=obj.work_location_id,
            reporting_manager_id=obj.reporting_manager_id,
            pan_number=obj.pan_number,
            emergency_contact_name=obj.emergency_contact_name,
            emergency_contact_phone=obj.emergency_contact_phone,
            emergency_contact_relation=obj.emergency_contact_relation,
            bank_name=obj.bank_name,
            account_number=obj.account_number,
            ifsc_code=obj.ifsc_code,
            account_type=obj.account_type,
            current_ctc=obj.annual_ctc,
        )
        employee = await emp_repo.save(employee)

        activation_token = secrets.token_urlsafe(32)
        user = User(
            email=obj.personal_email,
            hashed_password=hash_password(secrets.token_urlsafe(16)),
            role=Role.EMPLOYEE,
            is_active=True,
            is_email_verified=False,
            activation_token=activation_token,
            employee_id=employee.id,
        )
        await auth_repo.save(user)

        if obj.leave_allocations:
            from app.shared.enums.leave import LeaveType
            for leave_type_str, alloc in obj.leave_allocations.items():
                try:
                    leave_type = LeaveType(leave_type_str)
                except ValueError:
                    continue
                balance = LeaveBalance(
                    employee_id=employee.id,
                    leave_type=leave_type,
                    year=obj.date_of_joining.year,  # type: ignore[union-attr]
                    entitled=alloc.get("annual_quota", 0),
                    carried_forward=alloc.get("opening_balance", 0),
                )
                self._db.add(balance)

        if obj.annual_ctc and obj.ctc_effective_from:
            breakdown = obj.ctc_breakdown or {}
            salary = EmployeeSalary(
                employee_id=employee.id,
                structure_id=obj.salary_structure_id,
                ctc=obj.annual_ctc,
                basic=breakdown.get("earnings", {}).get("basic", 0),
                hra=breakdown.get("earnings", {}).get("hra", 0),
                effective_from=obj.ctc_effective_from,
                is_current=True,
            )
            self._db.add(salary)

        docs = await self._repo.get_documents(onboarding_id)
        for od in docs:
            ed = EmployeeDocument(
                employee_id=employee.id,
                document_type=od.category.value,
                document_name=od.document_name,
                file_key=od.file_key,
                file_url=od.file_url,
                uploaded_by=od.uploaded_by,
            )
            self._db.add(ed)

        await self._db.flush()

        obj.status = OnboardingStatus.ACTIVATED
        obj.activated_at = datetime.now(timezone.utc)
        obj.activated_by = actor.employee_id
        await self._repo.save(obj)

        if payload.notify_by_email:
            try:
                from arq import create_pool
                from arq.connections import RedisSettings
                from app.config import get_settings
                settings = get_settings()
                pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
                await pool.enqueue_job(
                    "send_activation_email_task",
                    obj.personal_email,
                    activation_token,
                    "activate",
                )
                await pool.aclose()
            except Exception:
                pass

        return employee

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _assert_draft(self, obj: EmployeeOnboarding) -> None:
        if obj.status != OnboardingStatus.DRAFT:
            raise BusinessRuleViolation(f"Onboarding is already {obj.status}")

    async def _get_doc_or_404(self, onboarding_id: uuid.UUID, doc_id: uuid.UUID) -> OnboardingDocument:
        await self.get(onboarding_id)
        doc = await self._repo.get_document(doc_id)
        if not doc or doc.onboarding_id != onboarding_id:
            raise NotFound("Document", str(doc_id))
        return doc

    def _validate_for_activation(self, obj: EmployeeOnboarding) -> list[str]:
        missing = []
        all_required = _STEP_REQUIRED["personal"] + _STEP_REQUIRED["employment"]
        for f in all_required:
            if not getattr(obj, f, None):
                missing.append(f)
        return missing
