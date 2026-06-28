import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lookup import AccountType, LeavePlan


class LookupRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # Account Type
    async def get_account_type_by_id(self, account_type_id: uuid.UUID) -> AccountType | None:
        stmt = select(AccountType).where(
            AccountType.id == account_type_id, AccountType.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_account_types(self, active_only: bool = True) -> list[AccountType]:
        stmt = select(AccountType).where(AccountType.deleted_at.is_(None))
        if active_only:
            stmt = stmt.where(AccountType.is_active.is_(True))
        stmt = stmt.order_by(AccountType.name)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_account_type(self, account_type: AccountType) -> AccountType:
        now = datetime.now(timezone.utc)
        if not account_type.created_at:
            account_type.created_at = now
        account_type.updated_at = now
        self._db.add(account_type)
        await self._db.flush()
        await self._db.refresh(account_type)
        return account_type

    async def soft_delete_account_type(self, account_type: AccountType) -> None:
        account_type.deleted_at = datetime.now(timezone.utc)
        account_type.updated_at = datetime.now(timezone.utc)
        self._db.add(account_type)
        await self._db.flush()

    # Leave Plan
    async def get_leave_plan_by_id(self, leave_plan_id: uuid.UUID) -> LeavePlan | None:
        stmt = select(LeavePlan).where(
            LeavePlan.id == leave_plan_id, LeavePlan.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def get_leave_plan_by_country(self, country: str) -> LeavePlan | None:
        stmt = select(LeavePlan).where(
            LeavePlan.country == country, LeavePlan.deleted_at.is_(None)
        )
        return (await self._db.execute(stmt)).scalar_one_or_none()

    async def list_leave_plans(self, active_only: bool = True) -> list[LeavePlan]:
        stmt = select(LeavePlan).where(LeavePlan.deleted_at.is_(None))
        if active_only:
            stmt = stmt.where(LeavePlan.is_active.is_(True))
        stmt = stmt.order_by(LeavePlan.country)
        return list((await self._db.execute(stmt)).scalars().all())

    async def save_leave_plan(self, leave_plan: LeavePlan) -> LeavePlan:
        now = datetime.now(timezone.utc)
        if not leave_plan.created_at:
            leave_plan.created_at = now
        leave_plan.updated_at = now
        self._db.add(leave_plan)
        await self._db.flush()
        await self._db.refresh(leave_plan)
        return leave_plan

    async def soft_delete_leave_plan(self, leave_plan: LeavePlan) -> None:
        leave_plan.deleted_at = datetime.now(timezone.utc)
        leave_plan.updated_at = datetime.now(timezone.utc)
        self._db.add(leave_plan)
        await self._db.flush()
