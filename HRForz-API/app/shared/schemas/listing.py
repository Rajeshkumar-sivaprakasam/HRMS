from pydantic import BaseModel, Field


class ListingFilter(BaseModel):
    """Base filter — all module filters extend this."""

    sortBy: str = Field(default="created_at")
    sortOrder: str = Field(default="desc", pattern="^(asc|desc)$")

    model_config = {"extra": "ignore"}


class PaginationInput(BaseModel):
    page: int = Field(default=1, ge=1, description="1-indexed page number")
    size: int = Field(default=20, ge=1, le=100, description="Records per page")


class ListingRequest(BaseModel):
    filter: ListingFilter
    pagination: PaginationInput = Field(default_factory=PaginationInput)
    paginationFlag: bool = Field(default=True)

    @property
    def page(self) -> int:
        return self.pagination.page

    @property
    def size(self) -> int:
        return self.pagination.size

    @property
    def offset(self) -> int:
        return (self.pagination.page - 1) * self.pagination.size

    @property
    def limit(self) -> int:
        return self.pagination.size


