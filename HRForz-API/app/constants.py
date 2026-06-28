from decimal import Decimal

# Attendance
ATTENDANCE_STATUS_COLORS: dict[str, str] = {
    "P": "#1A7341",
    "A": "#A93226",
    "HD_FH": "#B7690A",
    "HD_SH": "#B7690A",
    "L": "#6B2FAA",
    "WFH": "#1E6CA3",
    "PH": "#555555",
    "WO": "#888888",
    "LT": "#CC7A00",
    "OT": "#0D6B4F",
    "PE": "#2E75B6",
    "R": "#4A4A4A",
    "IC": "#C0392B",
}

# Leave
LEAVE_YEAR_START_MONTH = 4  # April
CL_ANNUAL_QUOTA = Decimal("12.0")
SL_ANNUAL_QUOTA = Decimal("12.0")

# Permission
MAX_PERMISSION_HOURS_PER_DAY = Decimal("2.0")
MAX_PERMISSION_INSTANCES_MONTH = 3

# Payroll
PF_EMPLOYEE_RATE = Decimal("0.12")
PF_EMPLOYER_RATE = Decimal("0.12")
PF_WAGE_CEILING = Decimal("15000")
PF_MAX_MONTHLY = Decimal("1800")
ESI_EMPLOYEE_RATE = Decimal("0.0075")
ESI_EMPLOYER_RATE = Decimal("0.0325")
ESI_GROSS_CEILING = Decimal("21000")
PF_ADMIN_EDLI_RATE = Decimal("0.005")
PF_ADMIN_MIN = Decimal("75")

# Basic salary ratio in CTC
BASIC_RATIO = Decimal("0.46")
HRA_RATIO_OF_BASIC = Decimal("0.50")
CONVEYANCE_FIXED = Decimal("1600")

# File upload
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
}
MAX_DOCUMENT_SIZE_MB = 10
MAX_PHOTO_SIZE_MB = 5

# Onboarding steps
ONBOARDING_TOTAL_STEPS = 9

# Ticket number prefix
TICKET_PREFIX = "HD"

# Probation alert days
PROBATION_ALERT_DAYS = 30

# Draft reminder days
DRAFT_REMINDER_DAYS = 1

# Activation link expiry
ACTIVATION_LINK_EXPIRY_HOURS = 48

# Auto clock-out time (midnight)
AUTO_CLOCKOUT_TIME = "23:59"

# Grace period default (minutes)
DEFAULT_GRACE_PERIOD_MINUTES = 15

# Upcoming holidays window (days)
UPCOMING_HOLIDAYS_DAYS = 30

# Upcoming birthdays window (days)
UPCOMING_BIRTHDAYS_DAYS = 7

# Leave lapse alert days before year end
LEAVE_LAPSE_ALERT_DAYS = 30
