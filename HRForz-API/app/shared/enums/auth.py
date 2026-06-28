from enum import StrEnum


class Role(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    HR_ADMIN = "hr_admin"
    FINANCE_ADMIN = "finance_admin"
    SUPER_ADMIN = "super_admin"


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"
    ACTIVATION = "activation"
    RESET = "reset"
