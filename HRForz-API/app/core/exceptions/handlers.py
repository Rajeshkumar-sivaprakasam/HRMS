import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.exceptions.base import HRMSException

log = structlog.get_logger()


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(HRMSException)
    async def hrms_exception_handler(
        request: Request, exc: HRMSException
    ) -> JSONResponse:
        log.warning(
            "domain_exception",
            code=exc.code,
            message=exc.message,
            path=str(request.url),
            request_id=getattr(request.state, "request_id", "unknown"),
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "response": exc.details or None,
                "code": exc.code,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors: dict[str, str] = {}
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
            errors[field] = error["msg"]
        return JSONResponse(
            status_code=422,
            content={
                "message": "Request validation failed",
                "response": errors,
                "code": "VALIDATION_ERROR",
            },
        )

    @app.exception_handler(IntegrityError)
    async def db_integrity_handler(
        request: Request, exc: IntegrityError
    ) -> JSONResponse:
        log.error("db_integrity_error", error=str(exc), path=str(request.url))
        return JSONResponse(
            status_code=409,
            content={
                "message": "Data conflict — duplicate or constraint violation",
                "response": None,
                "code": "CONFLICT",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        log.exception(
            "unhandled_exception",
            error=str(exc),
            path=str(request.url),
            request_id=getattr(request.state, "request_id", "unknown"),
        )
        return JSONResponse(
            status_code=500,
            content={
                "message": "An unexpected error occurred",
                "response": None,
                "code": "INTERNAL_ERROR",
            },
        )
