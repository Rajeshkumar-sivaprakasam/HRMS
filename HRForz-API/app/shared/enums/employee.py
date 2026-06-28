from enum import StrEnum


class EmployeeStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXITED = "exited"


class EmploymentType(StrEnum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"


class WorkLocationType(StrEnum):
    OFFICE = "office"
    WFH = "wfh"
    HYBRID = "hybrid"


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class AccountType(StrEnum):
    SAVINGS = "savings"
    CURRENT = "current"
    SALARY = "salary"
