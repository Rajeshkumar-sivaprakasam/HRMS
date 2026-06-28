from pydantic import BaseModel, EmailStr, Field, field_validator

from app.shared.enums.auth import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    employee_id: str
    work_location_id: str | None = None
    work_location_name: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_strength(cls, v: str) -> str:
        from app.core.security.password import validate_password_strength
        validate_password_strength(v)
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_strength(cls, v: str) -> str:
        from app.core.security.password import validate_password_strength
        validate_password_strength(v)
        return v


class ActivateAccountRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
