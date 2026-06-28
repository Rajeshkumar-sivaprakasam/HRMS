import uuid
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.shared.enums.employee import (
    AccountType,
    EmployeeStatus,
    EmploymentType,
    Gender,
    WorkLocationType,
)


class EmployeeCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    work_location_type: WorkLocationType = WorkLocationType.OFFICE
    date_of_joining: date | None = None
    department_id: uuid.UUID | None = None
    designation_id: uuid.UUID | None = None
    work_location_id: uuid.UUID | None = None
    reporting_manager_id: uuid.UUID | None = None
    probation_end_date: date | None = None
    notice_period_days: int | None = None


class EmployeeUpdateRequest(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    employment_type: EmploymentType | None = None
    work_location_type: WorkLocationType | None = None
    department_id: uuid.UUID | None = None
    designation_id: uuid.UUID | None = None
    work_location_id: uuid.UUID | None = None
    reporting_manager_id: uuid.UUID | None = None
    probation_end_date: date | None = None
    notice_period_days: int | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    emergency_contact_relation: str | None = None


class BankDetailsRequest(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    account_type: AccountType


class StatutoryDetailsRequest(BaseModel):
    pan_number: str | None = None
    aadhar_number: str | None = None
    pf_uan_number: str | None = None
    esic_number: str | None = None


class EmployeeStatusUpdateRequest(BaseModel):
    status: EmployeeStatus
    date_of_leaving: date | None = None
    reason: str | None = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    gender: Gender | None
    date_of_birth: date | None
    status: EmployeeStatus
    employment_type: EmploymentType
    work_location_type: WorkLocationType
    date_of_joining: date | None
    date_of_leaving: date | None
    probation_end_date: date | None
    notice_period_days: int | None
    department_id: uuid.UUID | None
    designation_id: uuid.UUID | None
    work_location_id: uuid.UUID | None
    reporting_manager_id: uuid.UUID | None
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    pincode: str | None
    country: str
    bank_name: str | None
    account_number: str | None
    ifsc_code: str | None
    account_type: AccountType | None
    pan_number: str | None
    aadhar_number: str | None
    pf_uan_number: str | None
    esic_number: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    emergency_contact_relation: str | None
    current_ctc: float | None
    profile_picture_url: str | None


class EmployeeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    status: EmployeeStatus
    employment_type: EmploymentType
    date_of_joining: date | None
    department_id: uuid.UUID | None
    designation_id: uuid.UUID | None
    work_location_id: uuid.UUID | None
    profile_picture_url: str | None
    department_name: str | None = None
    designation_name: str | None = None
    work_location_name: str | None = None
    work_location_city: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _extract_relation_names(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        dept = getattr(data, "department", None)
        desig = getattr(data, "designation", None)
        loc = getattr(data, "work_location", None)
        return {
            "id": data.id,
            "employee_code": data.employee_code,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": data.email,
            "phone": data.phone,
            "status": data.status,
            "employment_type": data.employment_type,
            "date_of_joining": data.date_of_joining,
            "department_id": data.department_id,
            "designation_id": data.designation_id,
            "work_location_id": data.work_location_id,
            "profile_picture_url": data.profile_picture_url,
            "department_name": dept.name if dept else None,
            "designation_name": desig.name if desig else None,
            "work_location_name": loc.name if loc else None,
            "work_location_city": loc.city if loc else None,
        }
