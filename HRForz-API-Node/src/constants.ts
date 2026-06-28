// Attendance
export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  P: '#1A7341',
  A: '#A93226',
  HD_FH: '#B7690A',
  HD_SH: '#B7690A',
  L: '#6B2FAA',
  WFH: '#1E6CA3',
  PH: '#555555',
  WO: '#888888',
  LT: '#CC7A00',
  OT: '#0D6B4F',
  PE: '#2E75B6',
  R: '#4A4A4A',
  IC: '#C0392B',
};

// Leave
export const LEAVE_YEAR_START_MONTH = 4; // April
export const CL_ANNUAL_QUOTA = 12.0;
export const SL_ANNUAL_QUOTA = 12.0;

// Permission
export const MAX_PERMISSION_HOURS_PER_DAY = 2.0;
export const MAX_PERMISSION_INSTANCES_MONTH = 3;

// Payroll
export const PF_EMPLOYEE_RATE = 0.12;
export const PF_EMPLOYER_RATE = 0.12;
export const PF_WAGE_CEILING = 15000;
export const PF_MAX_MONTHLY = 1800;
export const ESI_EMPLOYEE_RATE = 0.0075;
export const ESI_EMPLOYER_RATE = 0.0325;
export const ESI_GROSS_CEILING = 21000;
export const PF_ADMIN_EDLI_RATE = 0.005;
export const PF_ADMIN_MIN = 75;

// Basic salary ratio in CTC
export const BASIC_RATIO = 0.46;
export const HRA_RATIO_OF_BASIC = 0.5;
export const CONVEYANCE_FIXED = 1600;

// File upload
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]);
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_PHOTO_SIZE_MB = 5;

// Onboarding steps
export const ONBOARDING_TOTAL_STEPS = 9;

// Ticket number prefix
export const TICKET_PREFIX = 'HD';

// Probation alert days
export const PROBATION_ALERT_DAYS = 30;

// Draft reminder days
export const DRAFT_REMINDER_DAYS = 1;

// Activation link expiry
export const ACTIVATION_LINK_EXPIRY_HOURS = 48;

// Auto clock-out time (midnight)
export const AUTO_CLOCKOUT_TIME = '23:59';

// Grace period default (minutes)
export const DEFAULT_GRACE_PERIOD_MINUTES = 15;

// Upcoming holidays window (days)
export const UPCOMING_HOLIDAYS_DAYS = 30;

// Upcoming birthdays window (days)
export const UPCOMING_BIRTHDAYS_DAYS = 7;

// Leave lapse alert days before year end
export const LEAVE_LAPSE_ALERT_DAYS = 30;
