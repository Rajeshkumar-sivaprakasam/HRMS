from enum import StrEnum


class HolidayType(StrEnum):
    NATIONAL = "national"
    STATE = "state"
    COMPANY = "company"
    OPTIONAL = "optional"
