from enum import StrEnum


class LeaveType(StrEnum):
    CL = "CL"
    SL = "SL"
    LOP = "LOP"
    WFH = "WFH"


class LeaveDurationType(StrEnum):
    FULL_DAY = "full_day"
    FIRST_HALF = "first_half"
    SECOND_HALF = "second_half"


class LeaveStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
