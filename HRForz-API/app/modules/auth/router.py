from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.schemas import (
    ActivateAccountRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.shared.dependencies.auth import AuthRequired, CurrentUser
from app.shared.dependencies.db import get_db
from app.shared.schemas.response import ApiResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    token_resp, refresh_token = await service.login(payload)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth/refresh",
    )
    return ApiResponse.ok(token_resp, "Login successful")


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    token_resp = await service.refresh(payload)
    return ApiResponse.ok(token_resp, "Token refreshed")


@router.post("/logout", response_model=ApiResponse[None])
async def logout(
    response: Response,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(current_user)
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    return ApiResponse.ok(None, "Logged out successfully")


@router.post("/change-password", response_model=ApiResponse[None])
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser = AuthRequired,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.change_password(current_user, payload)
    return ApiResponse.ok(None, "Password changed successfully")


@router.post("/forgot-password", response_model=ApiResponse[None])
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.forgot_password(payload)
    return ApiResponse.ok(None, "If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=ApiResponse[None])
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.reset_password(payload)
    return ApiResponse.ok(None, "Password reset successfully")


@router.post("/activate", response_model=ApiResponse[None])
async def activate_account(
    payload: ActivateAccountRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.activate_account(payload)
    return ApiResponse.ok(None, "Account activated successfully")
