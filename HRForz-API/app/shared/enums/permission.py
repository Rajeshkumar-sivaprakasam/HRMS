from enum import StrEnum


class PermissionType(StrEnum):
    EARLY_OUT = "early_out"
    LATE_IN = "late_in"
    MID_DAY_OUT = "mid_day_out"


class PermissionStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExcessAction(StrEnum):
    HALF_DAY = "half_day"
    LOP = "lop"
    BLOCK = "block"
