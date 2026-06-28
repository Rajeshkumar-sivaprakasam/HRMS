from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.shared.enums.employee import AccountType, EmploymentType, Gender
from app.shared.enums.onboarding import DocumentCategory, DocumentStatus, OnboardingStatus


# ── Step request schemas ─────────────────────────────────────────────────────

class PersonalStepRequest(BaseModel):
    first_name: str | None = Field(None, max_length=100)
    middle_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    date_of_birth: date | None = None
    gender: Gender | None = None
    marital_status: str | None = None
    nationality: str | None = None
    blood_group: str | None = None
    pan_number: str | None = None
    personal_email: EmailStr | None = None
    mobile_number: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    emergency_contact_relation: str | None = None


class EmploymentStepRequest(BaseModel):
    job_title: str | None = Field(None, max_length=150)
    job_code: str | None = Field(None, max_length=50)
    sub_department: str | None = None
    grade_band: str | None = None
    department_id: uuid.UUID | None = None
    work_location_id: uuid.UUID | None = None
    employment_type: EmploymentType | None = None
    date_of_joining: date | None = None
    shift_id: uuid.UUID | None = None
    probation_end_date: date | None = None
    notice_period_days: int | None = None
    reporting_manager_id: uuid.UUID | None = None
    buddy_id: uuid.UUID | None = None
    profile_picture_url: str | None = None


class CTCBreakdown(BaseModel):
    earnings: dict[str, float] = Field(default_factory=dict)
    deductions: dict[str, float] = Field(default_factory=dict)
    benefits: dict[str, float] = Field(default_factory=dict)
    compensation: dict[str, float] = Field(default_factory=dict)


class CompensationStepRequest(BaseModel):
    annual_ctc: float | None = None
    ctc_effective_from: date | None = None
    salary_structure_id: uuid.UUID | None = None
    ctc_breakdown: CTCBreakdown | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    account_type: AccountType | None = None


class LeaveAllocation(BaseModel):
    annual_quota: float = 0
    opening_balance: float = 0
    carry_fwd_cap: float = 0


class LeaveOrgStepRequest(BaseModel):
    leave_plan: str | None = None
    holiday_calendar: str | None = None
    leave_allocations: dict[str, LeaveAllocation] | None = None
    cost_centre: str | None = None
    business_unit: str | None = None
    legal_entity: str | None = None
    workspace_team: str | None = None


# ── Document schemas ─────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: DocumentCategory
    document_name: str
    file_url: str
    is_required: bool
    status: DocumentStatus
    rejection_reason: str | None
    uploaded_by: uuid.UUID | None
    verified_by: uuid.UUID | None
    verified_at: datetime | None
    created_at: datetime


class DocumentStatusUpdate(BaseModel):
    rejection_reason: str | None = None


class DocumentListResponse(BaseModel):
    uploaded: int
    pending: int
    verified: int
    rejected: int
    documents: list[DocumentResponse]


# ── Checklist ────────────────────────────────────────────────────────────────

class ChecklistStep(BaseModel):
    key: str
    label: str
    complete: bool


class ChecklistResponse(BaseModel):
    progress_percent: int
    steps: list[ChecklistStep]


# ── Activation ───────────────────────────────────────────────────────────────

class ActivateRequest(BaseModel):
    notify_by_email: bool = True
    notify_by_sms: bool = False


# ── Onboarding response ──────────────────────────────────────────────────────

class OnboardingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    auto_employee_code: str
    status: OnboardingStatus
    created_at: datetime

    # Step 1
    first_name: str | None
    middle_name: str | None
    last_name: str | None
    date_of_birth: date | None
    gender: Gender | None
    marital_status: str | None
    nationality: str | None
    blood_group: str | None
    pan_number: str | None
    personal_email: str | None
    mobile_number: str | None
    current_address: str | None
    permanent_address: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    emergency_contact_relation: str | None
    profile_picture_url: str | None

    # Step 2
    job_title: str | None
    job_code: str | None
    sub_department: str | None
    grade_band: str | None
    department_id: uuid.UUID | None
    work_location_id: uuid.UUID | None
    employment_type: EmploymentType | None
    date_of_joining: date | None
    shift_id: uuid.UUID | None
    probation_end_date: date | None
    notice_period_days: int | None
    reporting_manager_id: uuid.UUID | None
    buddy_id: uuid.UUID | None

    # Step 3
    annual_ctc: float | None
    ctc_effective_from: date | None
    salary_structure_id: uuid.UUID | None
    ctc_breakdown: dict | None
    bank_name: str | None
    bank_branch: str | None
    account_number: str | None
    ifsc_code: str | None
    account_type: AccountType | None

    # Step 4
    leave_plan: str | None
    holiday_calendar: str | None
    leave_allocations: dict | None
    cost_centre: str | None
    business_unit: str | None
    legal_entity: str | None
    workspace_team: str | None

    # Meta
    work_email: str | None
    activated_at: datetime | None


class OnboardingListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    auto_employee_code: str
    status: OnboardingStatus
    first_name: str | None
    last_name: str | None
    personal_email: str | None
    department_id: uuid.UUID | None
    date_of_joining: date | None
    created_at: datetime
    department_name: str | None = None

    @classmethod
    def from_orm_with_relations(cls, obj: Any) -> "OnboardingListItem":
        dept = getattr(obj, "department", None)
        return cls(
            id=obj.id,
            auto_employee_code=obj.auto_employee_code,
            status=obj.status,
            first_name=obj.first_name,
            last_name=obj.last_name,
            personal_email=obj.personal_email,
            department_id=obj.department_id,
            date_of_joining=obj.date_of_joining,
            created_at=obj.created_at,
            department_name=dept.name if dept else None,
        )
