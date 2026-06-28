from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import Conflict, NotFound
from app.models.helpdesk import HelpdeskCategory
from app.models.lookup import BloodGroup, HolidayType, MaritalStatus, Nationality, Relationship
from app.models.payroll import SalaryStructure
from app.shared.dependencies.auth import HROnly
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

Db = Depends(get_db)


class CreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class UpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    is_active: bool | None = None


# ── SALARY STRUCTURES ──────────────────────────────────────────────────────────

ss_router = APIRouter(prefix="/salary-structures", tags=["Salary Structures"])


@ss_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_salary_structure(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(SalaryStructure).where(SalaryStructure.name == payload.name, SalaryStructure.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Salary structure '{payload.name}' already exists")
    obj = SalaryStructure(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Salary structure created")


@ss_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_salary_structure(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(SalaryStructure).where(SalaryStructure.id == item_id, SalaryStructure.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Salary structure", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Salary structure updated")


@ss_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_salary_structure(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(SalaryStructure).where(SalaryStructure.id == item_id, SalaryStructure.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Salary structure", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Salary structure deleted")


# ── HELPDESK CATEGORIES ────────────────────────────────────────────────────────

hd_router = APIRouter(prefix="/helpdesk-categories", tags=["Helpdesk Categories"])


@hd_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_helpdesk_category(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(HelpdeskCategory).where(HelpdeskCategory.name == payload.name, HelpdeskCategory.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Category '{payload.name}' already exists")
    obj = HelpdeskCategory(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Category created")


@hd_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_helpdesk_category(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(HelpdeskCategory).where(HelpdeskCategory.id == item_id, HelpdeskCategory.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Helpdesk category", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Category updated")


@hd_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_helpdesk_category(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(HelpdeskCategory).where(HelpdeskCategory.id == item_id, HelpdeskCategory.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Helpdesk category", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Category deleted")


# ── NATIONALITIES ──────────────────────────────────────────────────────────────

nat_router = APIRouter(prefix="/nationalities", tags=["Nationalities"])


@nat_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_nationality(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(Nationality).where(Nationality.name == payload.name, Nationality.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Nationality '{payload.name}' already exists")
    obj = Nationality(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Nationality created")


@nat_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_nationality(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(Nationality).where(Nationality.id == item_id, Nationality.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Nationality", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Nationality updated")


@nat_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_nationality(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(Nationality).where(Nationality.id == item_id, Nationality.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Nationality", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Nationality deleted")


# ── BLOOD GROUPS ───────────────────────────────────────────────────────────────

bg_router = APIRouter(prefix="/blood-groups", tags=["Blood Groups"])


@bg_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_blood_group(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(BloodGroup).where(BloodGroup.name == payload.name, BloodGroup.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Blood group '{payload.name}' already exists")
    obj = BloodGroup(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Blood group created")


@bg_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_blood_group(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(BloodGroup).where(BloodGroup.id == item_id, BloodGroup.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Blood group", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Blood group updated")


@bg_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_blood_group(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(BloodGroup).where(BloodGroup.id == item_id, BloodGroup.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Blood group", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Blood group deleted")


# ── RELATIONSHIPS ──────────────────────────────────────────────────────────────

rel_router = APIRouter(prefix="/relationships", tags=["Relationships"])


@rel_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_relationship(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(Relationship).where(Relationship.name == payload.name, Relationship.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Relationship '{payload.name}' already exists")
    obj = Relationship(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Relationship created")


@rel_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_relationship(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(Relationship).where(Relationship.id == item_id, Relationship.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Relationship", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Relationship updated")


@rel_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_relationship(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(Relationship).where(Relationship.id == item_id, Relationship.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Relationship", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Relationship deleted")


# ── MARITAL STATUSES ───────────────────────────────────────────────────────────

ms_router = APIRouter(prefix="/marital-statuses", tags=["Marital Statuses"])


@ms_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_marital_status(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(MaritalStatus).where(MaritalStatus.name == payload.name, MaritalStatus.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Marital status '{payload.name}' already exists")
    obj = MaritalStatus(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Marital status created")


@ms_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_marital_status(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(MaritalStatus).where(MaritalStatus.id == item_id, MaritalStatus.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Marital status", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Marital status updated")


@ms_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_marital_status(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(MaritalStatus).where(MaritalStatus.id == item_id, MaritalStatus.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Marital status", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Marital status deleted")


# ── HOLIDAY TYPES ──────────────────────────────────────────────────────────────

ht_router = APIRouter(prefix="/holiday-types", tags=["Holiday Types"])


@ht_router.post("", response_model=ApiResponse[dict], dependencies=[HROnly])
async def create_holiday_type(payload: CreateRequest, db: AsyncSession = Db):
    if (await db.execute(select(HolidayType).where(HolidayType.name == payload.name, HolidayType.deleted_at.is_(None)))).scalar_one_or_none():
        raise Conflict(f"Holiday type '{payload.name}' already exists")
    obj = HolidayType(name=payload.name, description=payload.description)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return ApiResponse.created({"id": str(obj.id), "name": obj.name}, "Holiday type created")


@ht_router.put("/{item_id}", response_model=ApiResponse[dict], dependencies=[HROnly])
async def update_holiday_type(item_id: uuid.UUID, payload: UpdateRequest, db: AsyncSession = Db):
    obj = (await db.execute(select(HolidayType).where(HolidayType.id == item_id, HolidayType.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Holiday type", str(item_id))
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.add(obj)
    await db.flush()
    return ApiResponse.ok({"id": str(obj.id), "name": obj.name}, "Holiday type updated")


@ht_router.delete("/{item_id}", response_model=ApiResponse[None], dependencies=[HROnly])
async def delete_holiday_type(item_id: uuid.UUID, db: AsyncSession = Db):
    obj = (await db.execute(select(HolidayType).where(HolidayType.id == item_id, HolidayType.deleted_at.is_(None)))).scalar_one_or_none()
    if not obj:
        raise NotFound("Holiday type", str(item_id))
    obj.deleted_at = datetime.now(timezone.utc)
    db.add(obj)
    await db.flush()
    return ApiResponse.ok(None, "Holiday type deleted")


# ── Combined export ────────────────────────────────────────────────────────────

all_routers = [ss_router, hd_router, nat_router, bg_router, rel_router, ms_router, ht_router]
