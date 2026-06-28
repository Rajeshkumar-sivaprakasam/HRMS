export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/v1/auth/login',
  LOGOUT: '/v1/auth/logout',
  FORGOT_PASSWORD: '/v1/auth/forgot-password',

  // Dashboard
  DASHBOARD_SUMMARY: '/v1/dashboard/employee/summary',
  DASHBOARD_HR_SUMMARY: '/v1/dashboard/hr/summary',
  DASHBOARD_ATTENDANCE_TREND: '/v1/dashboard/hr/attendance-trend',
  DASHBOARD_DEPT_HEADCOUNT: '/v1/dashboard/hr/department-headcount',
  WHOS_OUT_TODAY: '/v1/dashboard/employee/whos-out-today',
  BIRTHDAYS_THIS_WEEK: '/v1/dashboard/employee/birthdays',
  PENDING_APPROVALS: '/v1/approvals/pending',
  OPEN_TICKETS: '/v1/helpdesk/tickets/open',
  LEAVE_ACTION: (id: string) => `/v1/leaves/${id}/action`,
  REGULARISATION_ACTION: (id: string) => `/v1/attendance/regularisations/${id}`,

  // Attendance
  CLOCK_IN: '/v1/attendance/clock-in',
  CLOCK_OUT: '/v1/attendance/clock-out',
  ATTENDANCE_TODAY: '/v1/attendance/today',
  REGULARISATIONS: '/v1/attendance/regularisations',

  // Notifications
  NOTIFICATIONS: '/v1/notifications',
  MARK_NOTIFICATION_READ: (id: string) => `/v1/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/v1/notifications/mark-all-read',

  // Payroll & Company
  MY_PAYSLIPS: '/v1/payroll/payslips/my',
  ANNOUNCEMENTS: '/v1/announcements',
  HOLIDAYS: '/v1/holidays',

  // Other
  BIRTHDAYS: '/v1/dashboard/employee/birthdays',
  WHOS_OUT: '/v1/dashboard/employee/whos-out-today',

  // Employees
  EMPLOYEES_LIST: '/v1/employees/list',
  EMPLOYEES_CREATE: '/v1/employees/',
  EMPLOYEES_UPDATE: (id: string) => `/v1/employees/${id}`,
  EMPLOYEES_DELETE: (id: string) => `/v1/employees/${id}`,
  EMPLOYEES_GET: (id: string) => `/v1/employees/${id}`,
  
  // Master Data
  DEPARTMENTS: '/v1/masterdata/departments',
  DEPARTMENTS_LIST: '/v1/departments',
  LOCATIONS: '/v1/masterdata/locations',
  LOCATIONS_LIST: '/v1/work-locations',
  DESIGNATIONS: '/v1/masterdata/designations',

  MASTERDATA_HOLIDAY_TYPES: '/v1/masterdata/holiday-types',
  MASTERDATA_ACCOUNT_TYPES: '/v1/masterdata/account-types',
  MASTERDATA_LEAVE_PLANS:   '/v1/masterdata/leave-plans',
  
  // Notifications
  // NOTIFICATIONS: '/v1/notifications',

  // Dropdowns
  DROPDOWNS: {
    DEPARTMENTS:     '/v1/dropdowns/departments',
    DESIGNATIONS:    '/v1/dropdowns/designations',
    WORK_LOCATIONS:  '/v1/dropdowns/work-locations',
    MANAGERS:        '/v1/dropdowns/managers',
    SALARY_STRUCTURES: '/v1/dropdowns/salary-structures',
    HELPDESK_CATEGORIES: '/v1/dropdowns/helpdesk-categories',
    COUNTRIES:       '/v1/countries',
    LEAVE_TYPES:     '/v1/dropdowns/leave-types',
    LEAVE_POLICIES:  '/v1/dropdowns/leave-policies',
    HOLIDAY_TYPES:    '/v1/dropdowns/holiday-types',
    HOLIDAY_CALENDAR: '/v1/dropdowns/holiday-calendars',
    GENDER:          '/v1/dropdowns/gender',
    MARITAL_STATUS:  '/v1/dropdowns/marital-statuses',
    NATIONALITY:     '/v1/dropdowns/nationalities',
    RELATIONSHIP:    '/v1/dropdowns/relationships',
    BLOOD_GROUPS:    '/v1/dropdowns/blood-groups',
    EMPLOYMENT_TYPES: '/v1/dropdowns/employment-types',
    EMPLOYEE_STATUSES: '/v1/dropdowns/employee-statuses',
    ACCOUNT_TYPES:   '/v1/dropdowns/account-types',
    WORK_LOCATION_TYPES: '/v1/dropdowns/work-location-types',
    PERMISSION_TYPES: '/v1/dropdowns/permission-types',
    TAX_REGIMES:     '/v1/dropdowns/tax-regimes',
    PAYMENT_MODES:   '/v1/dropdowns/payment-modes',
    REVISION_TYPES:  '/v1/dropdowns/revision-types',
  },
  // Account Types
  ACCOUNT_TYPES: '/v1/account-types',

  // Leave Plans
  LEAVE_PLANS: '/v1/leave-plans',

  // Holiday Types
  HOLIDAY_TYPES: '/v1/holiday-types',

  // Holidays
  // HOLIDAYS: '/v1/holidays',

  // Announcements
  // ANNOUNCEMENTS: '/v1/announcements',

  // Birthdays
  // BIRTHDAYS: '/v1/employees/birthdays',

  // Dashboard
  DASHBOARD_EMPLOYEE_SUMMARY: '/v1/dashboard/employee/summary',
  // DASHBOARD_HR_SUMMARY: '/v1/dashboard/hr/summary',
  DASHBOARD_WHOS_OUT_TODAY: '/v1/dashboard/employee/whos-out-today',

  // Onboarding
  ONBOARDING: {
    CREATE:       '/v1/onboarding',
    PERSONAL:     (id: string) => `/v1/onboarding/${id}/personal`,
    EMPLOYMENT:   (id: string) => `/v1/onboarding/${id}/employment`,
    COMPENSATION: (id: string) => `/v1/onboarding/${id}/compensation`,
    LEAVE_ORG:    (id: string) => `/v1/onboarding/${id}/leave-org`,
    ACTIVATE:     (id: string) => `/v1/onboarding/${id}/activate`,
    LIST_DOCUMENTS: (id: string) => `/v1/onboarding/${id}/documents`,
    UPLOAD_DOCUMENT: (id: string, categoryId: string) => `/v1/onboarding/${id}/documents/${categoryId}`,
  },

  // Payroll
  PAYROLL: {
    CTC_SUMMARY:       '/v1/payroll/ctc-summary',
    LATEST_PAYSLIP:    '/v1/payroll/payslips/latest',
    PAYSLIP_HISTORY:   '/v1/payroll/payslips',
    REVISIONS:         '/v1/payroll/revisions',
    PF_DETAILS:        '/v1/payroll/pf-details',
    GENERATE_PDF:      (id: string) => `/v1/payroll/payslips/${id}/generate-pdf`,
    DOWNLOAD_PAYSLIP:  (id: string) => `/v1/payroll/payslips/${id}/download`,
  },

  // Leaves
  LEAVES: {
    LIST:               '/v1/leaves/list',
    APPLY:              '/v1/leaves',
    ACTION:             (id: string) => `/v1/leaves/${id}/action`,
    CANCEL:             (id: string) => `/v1/leaves/${id}/cancel`,
    BALANCES:           (employeeId: string) => `/v1/leaves/balances/${employeeId}`,
    POLICIES:           '/v1/leaves/policies',
    POLICY_UPDATE:      (leaveType: string) => `/v1/leaves/policies/${leaveType}`,
  },

  // Holidays (extended)
  HOLIDAY:             (id: string) => `/v1/holidays/${id}`,

  // Helpdesk
  HELPDESK: {
    CATEGORIES:  '/v1/helpdesk/categories',
    LIST:        '/v1/helpdesk/list',
    CREATE:      '/v1/helpdesk',
    GET:         (id: string) => `/v1/helpdesk/${id}`,
    UPDATE:      (id: string) => `/v1/helpdesk/${id}`,
    ADD_COMMENT: (id: string) => `/v1/helpdesk/${id}/comments`,
  },

  // Attendance
  ATTENDANCE_CLOCK_IN: '/v1/attendance/clock-in',
  ATTENDANCE_CLOCK_OUT: '/v1/attendance/clock-out',
  ATTENDANCE_MANUAL: '/v1/attendance/manual',
  ATTENDANCE_LIST: '/v1/attendance/list',
  ATTENDANCE_MONTHLY_SUMMARY: '/v1/attendance/monthly-summary',
  ATTENDANCE_WEEKLY_STATS: '/v1/attendance/weekly-stats',
  ATTENDANCE_EXPORT: '/v1/attendance/export',
  ATTENDANCE_REGULARISATIONS_CREATE: '/v1/attendance/regularisations',
  ATTENDANCE_REGULARISATIONS_ACTION: (regId: string) => `/v1/attendance/regularisations/${regId}`,
  ATTENDANCE_SHIFTS: '/v1/attendance/shifts',
  ATTENDANCE_STATUS_OPTIONS: '/v1/attendance/status-options',
};
