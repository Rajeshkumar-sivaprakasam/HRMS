import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions.base import NotFound, Conflict
from app.models.lookup import AccountType, LeavePlan
from app.modules.lookup.repository import LookupRepository
from app.modules.lookup.schemas import (
    AccountTypeRequest,
    LeavePlanRequest,
)


class LookupService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = LookupRepository(db)

    # Account Type CRUD
    async def create_account_type(self, payload: AccountTypeRequest) -> AccountType:
        account_type = AccountType(**payload.model_dump())
        return await self._repo.save_account_type(account_type)

    async def get_account_type(self, account_type_id: uuid.UUID) -> AccountType:
        account_type = await self._repo.get_account_type_by_id(account_type_id)
        if not account_type:
            raise NotFound("Account type not found")
        return account_type

    async def list_account_types(self, active_only: bool = True) -> list[AccountType]:
        return await self._repo.list_account_types(active_only=active_only)

    async def update_account_type(self, account_type_id: uuid.UUID, payload: AccountTypeRequest) -> AccountType:
        account_type = await self.get_account_type(account_type_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(account_type, field, value)
        return await self._repo.save_account_type(account_type)

    async def delete_account_type(self, account_type_id: uuid.UUID) -> None:
        account_type = await self.get_account_type(account_type_id)
        await self._repo.soft_delete_account_type(account_type)

    # Leave Plan CRUD
    async def create_leave_plan(self, payload: LeavePlanRequest) -> LeavePlan:
        existing = await self._repo.get_leave_plan_by_country(payload.country)
        if existing:
            raise Conflict(f"Leave plan for {payload.country} already exists")
        leave_plan = LeavePlan(**payload.model_dump())
        return await self._repo.save_leave_plan(leave_plan)

    async def get_leave_plan(self, leave_plan_id: uuid.UUID) -> LeavePlan:
        leave_plan = await self._repo.get_leave_plan_by_id(leave_plan_id)
        if not leave_plan:
            raise NotFound("Leave plan not found")
        return leave_plan

    async def get_leave_plan_by_country(self, country: str) -> LeavePlan:
        leave_plan = await self._repo.get_leave_plan_by_country(country)
        if not leave_plan:
            raise NotFound(f"Leave plan for {country} not found")
        return leave_plan

    async def list_leave_plans(self, active_only: bool = True) -> list[LeavePlan]:
        return await self._repo.list_leave_plans(active_only=active_only)

    async def update_leave_plan(self, leave_plan_id: uuid.UUID, payload: LeavePlanRequest) -> LeavePlan:
        leave_plan = await self.get_leave_plan(leave_plan_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(leave_plan, field, value)
        return await self._repo.save_leave_plan(leave_plan)

    async def delete_leave_plan(self, leave_plan_id: uuid.UUID) -> None:
        leave_plan = await self.get_leave_plan(leave_plan_id)
        await self._repo.soft_delete_leave_plan(leave_plan)
