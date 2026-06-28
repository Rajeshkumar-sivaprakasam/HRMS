import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings
from app.core.cache.client import get_redis

log = structlog.get_logger()

AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/forgot-password"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        limit = (
            settings.AUTH_RATE_LIMIT_PER_MINUTE
            if path in AUTH_PATHS
            else settings.RATE_LIMIT_PER_MINUTE
        )

        key = f"ratelimit:{client_ip}:{path}"
        window = 60

        try:
            redis = await get_redis()
            current = await redis.incr(key)
            if current == 1:
                await redis.expire(key, window)
            if current > limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "message": "Too many requests. Please slow down.",
                        "response": None,
                        "code": "RATE_LIMITED",
                    },
                )
        except Exception as exc:
            log.warning("rate_limit_redis_error", error=str(exc))

        return await call_next(request)
