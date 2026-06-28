from dataclasses import dataclass, field


@dataclass
class HRMSException(Exception):
    """Base for every domain exception in the system."""

    message: str
    code: str
    status_code: int = 400
    details: dict = field(default_factory=dict)


# ── 400 ────────────────────────────────────────────────────────────────────
class ValidationError(HRMSException):
    def __init__(self, message: str, details: dict | None = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details or {},
        )


class BusinessRuleViolation(HRMSException):
    def __init__(self, message: str, code: str = "BUSINESS_RULE_VIOLATION") -> None:
        super().__init__(message=message, code=code, status_code=400)


# ── 401 / 403 ───────────────────────────────────────────────────────────────
class Unauthorized(HRMSException):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message=message, code="UNAUTHORIZED", status_code=401)


class Forbidden(HRMSException):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message=message, code="FORBIDDEN", status_code=403)


class TokenExpired(HRMSException):
    def __init__(self) -> None:
        super().__init__(message="Token has expired", code="TOKEN_EXPIRED", status_code=401)


class TokenInvalid(HRMSException):
    def __init__(self) -> None:
        super().__init__(message="Token is invalid", code="TOKEN_INVALID", status_code=401)


# ── 404 ────────────────────────────────────────────────────────────────────
class NotFound(HRMSException):
    def __init__(self, resource: str, identifier: str | None = None) -> None:
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} '{identifier}' not found"
        super().__init__(message=msg, code="NOT_FOUND", status_code=404)


# ── 409 ────────────────────────────────────────────────────────────────────
class Conflict(HRMSException):
    def __init__(self, message: str, code: str = "CONFLICT") -> None:
        super().__init__(message=message, code=code, status_code=409)


class DuplicateError(Conflict):
    def __init__(self, resource: str, field: str, value: str) -> None:
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists",
            code="DUPLICATE_ERROR",
        )


# ── 423 ────────────────────────────────────────────────────────────────────
class ResourceLocked(HRMSException):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code="LOCKED", status_code=423)


# ── Domain-specific ────────────────────────────────────────────────────────
class InsufficientLeaveBalance(BusinessRuleViolation):
    def __init__(self, leave_type: str, available: float, requested: float) -> None:
        super().__init__(
            message=(
                f"Insufficient {leave_type} balance. "
                f"Available: {available}, Requested: {requested}"
            ),
            code="INSUFFICIENT_LEAVE_BALANCE",
        )


class AttendanceAlreadyClockedIn(BusinessRuleViolation):
    def __init__(self) -> None:
        super().__init__(
            message="Employee is already clocked in",
            code="ALREADY_CLOCKED_IN",
        )


class AttendanceNotClockedIn(BusinessRuleViolation):
    def __init__(self) -> None:
        super().__init__(
            message="Employee has not clocked in yet",
            code="NOT_CLOCKED_IN",
        )


class PayrollAlreadyLocked(ResourceLocked):
    def __init__(self, month: int, year: int) -> None:
        super().__init__(f"Payroll for {month}/{year} is locked and cannot be modified")


class PermissionLimitExceeded(BusinessRuleViolation):
    def __init__(self, limit_type: str) -> None:
        super().__init__(
            message=f"Permission {limit_type} limit exceeded",
            code="PERMISSION_LIMIT_EXCEEDED",
        )
