from uuid import UUID


class CacheKeys:
    """Single source of truth for all Redis key patterns."""

    @staticmethod
    def dropdown_departments() -> str:
        return "dropdown:departments"

    @staticmethod
    def dropdown_designations() -> str:
        return "dropdown:designations"

    @staticmethod
    def dropdown_work_locations() -> str:
        return "dropdown:work_locations"

    @staticmethod
    def dropdown_holiday_calendars() -> str:
        return "dropdown:holiday_calendars"

    @staticmethod
    def dropdown_salary_structures() -> str:
        return "dropdown:salary_structures"

    @staticmethod
    def employee_profile(employee_id: UUID) -> str:
        return f"employee:profile:{employee_id}"

    @staticmethod
    def attendance_today(employee_id: UUID) -> str:
        return f"attendance:today:{employee_id}"

    @staticmethod
    def leave_balance(employee_id: UUID) -> str:
        return f"leave:balance:{employee_id}"

    @staticmethod
    def refresh_token(user_id: UUID) -> str:
        return f"auth:refresh:{user_id}"

    @staticmethod
    def rate_limit(ip: str, endpoint: str) -> str:
        return f"ratelimit:{ip}:{endpoint}"

    @staticmethod
    def failed_login(ip: str) -> str:
        return f"auth:failed:{ip}"
