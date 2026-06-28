from enum import StrEnum


class PaymentMode(StrEnum):
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"


class SalaryComponentType(StrEnum):
    EARNING = "earning"
    DEDUCTION = "deduction"


class SalaryCalcType(StrEnum):
    FIXED = "fixed"
    FORMULA = "formula"
    STATUTORY = "statutory"
    MANUAL = "manual"


class ComponentCategory(StrEnum):
    STATUTORY = "statutory"
    CUSTOM = "custom"
    AUTO = "auto"


class SalaryRevisionType(StrEnum):
    INCREMENT = "increment"
    PROMOTION = "promotion"
    CORRECTION = "correction"
    RESTRUCTURE = "restructure"
    DEMOTION = "demotion"


class TaxRegime(StrEnum):
    NEW = "new"
    OLD = "old"


class PayrollRunStatus(StrEnum):
    NOT_RUN = "not_run"
    INITIATED = "initiated"
    COMPUTED = "computed"
    PREVIEW = "preview"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    LOCKED = "locked"
    RELEASED = "released"


class FnFStatus(StrEnum):
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"


class AdjustmentType(StrEnum):
    EARNING = "earning"
    DEDUCTION = "deduction"
