from datetime import date
from typing import Any

from sqlalchemy import and_, asc, desc, or_


class FilterBuilder:
    """Builds SQLAlchemy WHERE clauses from a filter dict."""

    def __init__(self, model: Any) -> None:
        self._model = model
        self._conditions: list[Any] = []

    def eq(self, column: str, value: Any) -> "FilterBuilder":
        if value is not None and value != "all" and value != "":
            self._conditions.append(getattr(self._model, column) == value)
        return self

    def neq(self, column: str, value: Any) -> "FilterBuilder":
        if value is not None:
            self._conditions.append(getattr(self._model, column) != value)
        return self

    def like(self, column: str, value: str | None) -> "FilterBuilder":
        if value:
            self._conditions.append(getattr(self._model, column).ilike(f"%{value}%"))
        return self

    def in_(self, column: str, values: list | None) -> "FilterBuilder":
        if values:
            self._conditions.append(getattr(self._model, column).in_(values))
        return self

    def date_range(
        self,
        column: str,
        from_date: date | None,
        to_date: date | None,
    ) -> "FilterBuilder":
        if from_date:
            self._conditions.append(getattr(self._model, column) >= from_date)
        if to_date:
            self._conditions.append(getattr(self._model, column) <= to_date)
        return self

    def search(self, columns: list[str], term: str | None) -> "FilterBuilder":
        if term:
            self._conditions.append(
                or_(*[getattr(self._model, col).ilike(f"%{term}%") for col in columns])
            )
        return self

    def soft_delete(self) -> "FilterBuilder":
        self._conditions.append(getattr(self._model, "deleted_at").is_(None))
        return self

    def raw(self, condition: Any) -> "FilterBuilder":
        self._conditions.append(condition)
        return self

    def build(self) -> Any:
        return and_(*self._conditions) if self._conditions else True


def apply_sort(
    stmt: Any,
    model: Any,
    sort_by: str,
    sort_order: str,
    allowed_fields: list[str],
) -> Any:
    if sort_by not in allowed_fields:
        sort_by = "created_at"
    col = getattr(model, sort_by)
    return stmt.order_by(desc(col) if sort_order == "desc" else asc(col))
