from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Every single API endpoint returns this shape."""

    message: str
    response: T | None = None
    code: str = "SUCCESS"

    @classmethod
    def ok(cls, data: T, message: str = "Success") -> "ApiResponse[T]":
        return cls(message=message, response=data, code="SUCCESS")

    @classmethod
    def created(cls, data: T, message: str) -> "ApiResponse[T]":
        return cls(message=message, response=data, code="CREATED")

    @classmethod
    def no_content(cls, message: str = "Deleted successfully") -> "ApiResponse[None]":
        return cls(message=message, response=None, code="SUCCESS")


class PaginatedResponse(BaseModel, Generic[T]):
    message: str
    response: dict[str, Any]
    code: str = "SUCCESS"

    @classmethod
    def ok(
        cls,
        data: list[T],
        total: int,
        page: int,
        page_size: int,
        message: str = "Records fetched",
    ) -> "PaginatedResponse[T]":
        total_pages = max(1, -(-total // page_size))
        return cls(
            message=message,
            response={
                "data": data,
                "meta": {
                    "page": page,
                    "pageSize": page_size,
                    "totalRecords": total,
                    "totalPages": total_pages,
                    "hasNext": page < total_pages,
                    "hasPrev": page > 1,
                },
            },
            code="SUCCESS",
        )
