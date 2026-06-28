from enum import StrEnum


class NotificationType(StrEnum):
    LEAVE_APPLIED = "leave_applied"
    LEAVE_APPROVED = "leave_approved"
    LEAVE_REJECTED = "leave_rejected"
    LEAVE_CANCELLED = "leave_cancelled"
    PERMISSION_APPLIED = "permission_applied"
    PERMISSION_APPROVED = "permission_approved"
    PERMISSION_REJECTED = "permission_rejected"
    REGULARISATION_APPLIED = "regularisation_applied"
    REGULARISATION_APPROVED = "regularisation_approved"
    REGULARISATION_REJECTED = "regularisation_rejected"
    CLOCK_OUT_MISSED = "clock_out_missed"
    PAYSLIP_RELEASED = "payslip_released"
    SALARY_REVISED = "salary_revised"
    FORM16_AVAILABLE = "form16_available"
    FNF_APPROVED = "fnf_approved"
    TICKET_UPDATED = "ticket_updated"
    TICKET_RESOLVED = "ticket_resolved"
    ANNOUNCEMENT = "announcement"
    PROBATION_DUE = "probation_due"
    BIRTHDAY_REMINDER = "birthday_reminder"
