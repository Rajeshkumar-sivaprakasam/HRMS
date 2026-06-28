from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Runtime
    ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    APP_NAME: str = "HRForz Platform API"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://hrms_user:hrms_pass@localhost:5432/hrms_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 3
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth / JWT (RS256)
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""
    JWT_ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ACTIVATION_TOKEN_EXPIRE_HOURS: int = 48

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # S3 / Storage (also works with Cloudflare R2)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "hrforz"
    AWS_S3_REGION: str = "auto"
    AWS_S3_ENDPOINT_URL: str = ""  # R2: https://<account_id>.r2.cloudflarestorage.com

    # Email
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@hrms.company.com"
    EMAIL_FROM_NAME: str = "HRMS Platform"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 120
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Employee Code
    EMPLOYEE_CODE_PREFIX: str = "FIN"
    EMPLOYEE_CODE_PADDING: int = 3

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg uses 'ssl' not psycopg2's 'sslmode'
        v = v.replace("sslmode=", "ssl=")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
