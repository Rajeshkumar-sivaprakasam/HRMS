import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions.base import Forbidden, Unauthorized
from app.core.security.jwt import decode_access_token
from app.shared.enums.auth import Role

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    """Resolved user attached to request state."""

    def __init__(
        self,
        user_id: uuid.UUID,
        employee_id: uuid.UUID,
        role: Role,
        email: str,
    ) -> None:
        self.user_id = user_id
        self.employee_id = employee_id
        self.role = role
        self.email = email

    def has_role(self, *roles: Role) -> bool:
        return self.role in roles

    def is_hr_or_above(self) -> bool:
        return self.role in (Role.HR_ADMIN, Role.SUPER_ADMIN)

    def is_manager_or_above(self) -> bool:
        return self.role in (Role.MANAGER, Role.HR_ADMIN, Role.FINANCE_ADMIN, Role.SUPER_ADMIN)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if not credentials:
        raise Unauthorized()
    payload = decode_access_token(credentials.credentials)
    return CurrentUser(
        user_id=uuid.UUID(payload["sub"]),
        employee_id=uuid.UUID(payload["employee_id"]),
        role=Role(payload["role"]),
        email=payload["email"],
    )


def require_roles(*roles: Role):
    """
    Usage:
        @router.get("/", dependencies=[Depends(require_roles(Role.HR_ADMIN))])
    """

    async def checker(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in roles:
            raise Forbidden(f"Requires one of: {', '.join(r.value for r in roles)}")
        return current_user

    return checker


# Convenience aliases
AuthRequired = Depends(get_current_user)
HROnly = Depends(require_roles(Role.HR_ADMIN, Role.SUPER_ADMIN))
FinanceOnly = Depends(require_roles(Role.FINANCE_ADMIN, Role.SUPER_ADMIN))
HROrFinance = Depends(require_roles(Role.HR_ADMIN, Role.FINANCE_ADMIN, Role.SUPER_ADMIN))
ManagerOrHR = Depends(require_roles(Role.MANAGER, Role.HR_ADMIN, Role.SUPER_ADMIN))
