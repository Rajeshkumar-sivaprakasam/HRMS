from enum import StrEnum


class AttendanceStatus(StrEnum):
    PRESENT = "P"
    ABSENT = "A"
    HALF_DAY_FIRST = "HD_FH"
    HALF_DAY_SECOND = "HD_SH"
    ON_LEAVE = "L"
    WFH = "WFH"
    PUBLIC_HOLIDAY = "PH"
    WEEK_OFF = "WO"
    LATE = "LT"
    OVERTIME = "OT"
    PERMISSION = "PE"
    REGULARISED = "R"
    INCOMPLETE = "IC"


class ClockMethod(StrEnum):
    WEB_PORTAL = "web_portal"
    HR_MANUAL = "hr_manual"
    SYSTEM_AUTO = "system_auto"


class RegularisationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
