from __future__ import annotations

import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache.client import cache_delete, cache_get, cache_set
from app.core.cache.keys import CacheKeys
from app.core.exceptions.base import (
    BusinessRuleViolation,
    NotFound,
    TokenExpired,
    TokenInvalid,
    Unauthorized,
)
from app.core.security.jwt import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.security.password import hash_password, verify_password
from app.models.user import User
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    ActivateAccountRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.shared.dependencies.auth import CurrentUser


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = AuthRepository(db)

    async def login(self, payload: LoginRequest) -> tuple[TokenResponse, str]:
        user = await self._repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise Unauthorized("Invalid email or password")
        if not user.is_active:
            raise BusinessRuleViolation("Account is not activated. Check your email.")
        if not user.is_email_verified:
            raise BusinessRuleViolation("Email not verified.")
        if not user.employee_id:
            raise BusinessRuleViolation("Employee profile not linked to this user.")

        access_token = create_access_token(
            user_id=str(user.id),
            employee_id=str(user.employee_id),
            role=user.role,
            email=user.email,
        )
        refresh_token = create_refresh_token(user_id=str(user.id))

        await cache_set(
            CacheKeys.refresh_token(user.id),
            refresh_token,
            ttl=7 * 24 * 3600,
        )

        work_location_id = None
        work_location_name = None
        if user.employee:
            work_location_id = str(user.employee.work_location_id) if user.employee.work_location_id else None
            work_location_name = user.employee.work_location.name if user.employee.work_location else None

        return (
            TokenResponse(
                access_token=access_token,
                role=user.role,
                employee_id=str(user.employee_id),
                work_location_id=work_location_id,
                work_location_name=work_location_name,
            ),
            refresh_token,
        )

    async def refresh(self, payload: RefreshRequest) -> TokenResponse:
        data = decode_refresh_token(payload.refresh_token)
        user_id = uuid.UUID(data["sub"])

        stored = await cache_get(CacheKeys.refresh_token(user_id))
        if stored != payload.refresh_token:
            raise TokenInvalid("Refresh token revoked or invalid")

        user = await self._repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise Unauthorized()

        access_token = create_access_token(
            user_id=str(user.id),
            employee_id=str(user.employee_id),
            role=user.role,
            email=user.email,
        )
        return TokenResponse(
            access_token=access_token,
            role=user.role,
            employee_id=str(user.employee_id),
        )

    async def logout(self, current_user: CurrentUser) -> None:
        await cache_delete(CacheKeys.refresh_token(current_user.user_id))

    async def change_password(
        self, current_user: CurrentUser, payload: ChangePasswordRequest
    ) -> None:
        user = await self._repo.get_by_id(current_user.user_id)
        if not user:
            raise NotFound("User not found")
        if not verify_password(payload.current_password, user.hashed_password):
            raise BusinessRuleViolation("Current password is incorrect")
        user.hashed_password = hash_password(payload.new_password)
        await self._repo.save(user)
        await cache_delete(CacheKeys.refresh_token(current_user.user_id))

    async def forgot_password(self, payload: ForgotPasswordRequest) -> None:
        user = await self._repo.get_by_email(payload.email)
        if not user:
            return  # silent â€” don't reveal whether email exists
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        await self._repo.save(user)
        from app.core.tasks.registry import send_activation_email_task
        from arq import create_pool
        from app.config import get_settings
        settings = get_settings()
        # Fire-and-forget via ARQ
        pool = await create_pool(settings.arq_redis_settings)
        await pool.enqueue_job(
            "send_activation_email_task",
            user.email,
            token,
            "reset",
        )
        await pool.aclose()

    async def reset_password(self, payload: ResetPasswordRequest) -> None:
        user = await self._repo.get_by_reset_token(payload.token)
        if not user:
            raise TokenInvalid("Invalid or expired reset token")
        user.hashed_password = hash_password(payload.new_password)
        user.password_reset_token = None
        await self._repo.save(user)

    async def activate_account(self, payload: ActivateAccountRequest) -> None:
        user = await self._repo.get_by_activation_token(payload.token)
        if not user:
            raise TokenInvalid("Invalid or expired activation token")
        user.hashed_password = hash_password(payload.new_password)
        user.activation_token = None
        user.is_active = True
        user.is_email_verified = True
        await self._repo.save(user)
