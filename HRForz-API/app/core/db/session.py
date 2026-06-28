from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,        # shared persistent connections (reused, not per-request)
    max_overflow=settings.DB_MAX_OVERFLOW,  # extra burst connections, closed immediately after use
    pool_pre_ping=True,                     # health-check connection before lending it out
    pool_recycle=30,                        # recycle (close+reopen) connections idle for 30s
    pool_timeout=30,                        # if all connections busy, wait 30s before error
    echo=settings.DB_ECHO,
)

AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
