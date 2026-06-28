import pytest
from sqlalchemy import and_, true

from app.shared.utils.filter_builder import FilterBuilder
from app.models.employee import Employee


def test_build_empty_returns_true():
    result = FilterBuilder(Employee).build()
    assert result is True


def test_eq_skips_none():
    result = FilterBuilder(Employee).eq("status", None).build()
    assert result is True


def test_eq_skips_all():
    result = FilterBuilder(Employee).eq("status", "all").build()
    assert result is True


def test_eq_adds_condition():
    result = FilterBuilder(Employee).eq("status", "active").build()
    assert result is not True
    assert result is not None


def test_soft_delete_adds_condition():
    result = FilterBuilder(Employee).soft_delete().build()
    assert result is not True


def test_like_skips_empty():
    result = FilterBuilder(Employee).like("first_name", "").build()
    assert result is True


def test_like_adds_condition():
    result = FilterBuilder(Employee).like("first_name", "John").build()
    assert result is not True


def test_multiple_conditions():
    result = (
        FilterBuilder(Employee)
        .soft_delete()
        .eq("status", "active")
        .like("first_name", "John")
        .build()
    )
    assert result is not True
