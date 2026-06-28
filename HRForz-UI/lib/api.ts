import { apiService } from '@/app/core/services/api-service';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';

export interface ApiResponse<T> {
  message: string;
  response: T;
  code: string;
}

export interface LoginResponse extends ApiResponse<{
  access_token: string;
  token_type: string;
  role: string;
  employee_id: string;
  work_location_id?: string;
  work_location_name?: string;
}> {}
export interface ApiResponse<T = any> {
  message: string;
  response: T;
  code: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  department_name?: string;
  designation: string;
  designation_name?: string;
  location: string;
  work_location_name?: string;
  work_location_city?: string;
  status: string;
  avatar_url?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiService.post<LoginResponse>(API_ENDPOINTS.LOGIN, { email, password });
    if (data.response?.access_token) {
      // Keep localStorage for existing client-side reads (role checks, etc.)
      localStorage.setItem('hrforz_token', data.response.access_token);
      localStorage.setItem('hrforz_role', data.response.role || '');
      localStorage.setItem('hrforz_employee_id', data.response.employee_id || '');
      localStorage.setItem('hrforz_work_location_id', data.response.work_location_id || '');

      // Bridge the token into an httpOnly cookie so middleware + Server
      // Components can read the session (enables server-side auth & SSR).
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: data.response.access_token,
            role: data.response.role || '',
            employeeId: data.response.employee_id || '',
          }),
        });
      } catch {
        // Non-fatal: client session still works via localStorage.
      }
    }
    return data;
  },
  logout: async (): Promise<void> => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      // Non-fatal: cookie may already be gone.
    }
  },
  forgotPassword: async (email: string): Promise<any> => {
    return apiService.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  },
};

export type AttendanceStatus = 'P' | 'A' | 'HD_FH' | 'HD_SH' | 'L' | 'WFH' | 'PH' | 'WO' | 'LT' | 'OT' | 'PE' | 'R' | 'IC';

export interface TodayAttendanceStatus {
  status: 'clocked_in' | 'clocked_out' | 'not_clocked_in';
  clock_in:   string | null;
  clock_out:  string | null;
  work_hours: number | null;
  is_late:    boolean;
}
export type ClockMethod = 'web_portal' | 'hr_manual' | 'system_auto';
export type RegularisationStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceMonthlySummary {
  total_working_days: number;
  day_percent: number;
  total_worked_hours: number | null;
  avg_working_time: number | null;
  late_arrivals: number;
  strikes: number;
}

export interface AttendanceWeeklyStats {
  hours_logged_label: string;
  weekly_target_hours: number;
  hours_progress_percent: number;
  avg_clock_in_time: string;
  is_on_schedule: boolean;
  current_streak: number;
  personal_best_streak: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;       // "YYYY-MM-DD"
  status: AttendanceStatus;
  clock_in?: string | null;      // ISO datetime "YYYY-MM-DDTHH:MM:SS"
  clock_out?: string | null;     // ISO datetime "YYYY-MM-DDTHH:MM:SS"
  work_hours?: number | null;    // backend-computed total hours
  is_late?: boolean;
  is_early_out?: boolean;
  overtime_hours?: number | null;
  remarks?: string | null;
  leave_type?: string | null;        // leave type code e.g. "CL", "SL"
  leave_type_code?: string | null;   // alternate field name from some API versions
  leave_type_name?: string | null;   // full name e.g. "Casual Leave"
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes?: number;
  is_default?: boolean;
}

export const dashboardApi = {
  getSummary: async () => {
    return apiService.get<any>(API_ENDPOINTS.DASHBOARD_SUMMARY);
  },
  getHRSummary: async () => {
    return apiService.get<any>(API_ENDPOINTS.DASHBOARD_HR_SUMMARY);
  },
  getAnnouncements: async () => {
    return apiService.get<any>(API_ENDPOINTS.ANNOUNCEMENTS);
  },
  getHolidays: async (year?: number) => {
    return apiService.get<any>(API_ENDPOINTS.HOLIDAYS, year ? { year } : undefined);
  },
  getTodayAttendance: async () => {
    return apiService.get<any>(API_ENDPOINTS.ATTENDANCE_TODAY);
  },
  getBirthdays: async () => {
    return apiService.get<any>(API_ENDPOINTS.BIRTHDAYS_THIS_WEEK);
  },
  createRegularisation: async (data: { 
    attendance_record_id: string; 
    requested_clock_in: string; 
    requested_clock_out: string; 
    reason: string; 
  }) => {
    return apiService.post<any>(API_ENDPOINTS.REGULARISATIONS, data);
  },
  getWhosOut: async () => {
    return apiService.get<any>(API_ENDPOINTS.WHOS_OUT);
  },
  updateAnnouncement: async (id: string, data: any) => {
    return apiService.put(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, data);
  },
  deleteAnnouncement: async (id: string) => {
    return apiService.delete(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`);
  },
  clockIn: async (payload: { method: 'web_portal' | 'mobile_app'; remarks?: string }) => {
    return apiService.post<any>(API_ENDPOINTS.CLOCK_IN, payload);
  },
  clockOut: async (payload: { method: 'web_portal' | 'mobile_app'; remarks?: string }) => {
    return apiService.post<any>(API_ENDPOINTS.CLOCK_OUT, payload);
  },
  getAttendanceTrend: async () => {
    return apiService.get<any>(API_ENDPOINTS.DASHBOARD_ATTENDANCE_TREND);
  },
  getDeptHeadcount: async () => {
    return apiService.get<any>(API_ENDPOINTS.DASHBOARD_DEPT_HEADCOUNT);
  },
  getPendingApprovals: async () => {
    return apiService.get<any>(API_ENDPOINTS.PENDING_APPROVALS);
  },
  getOpenTickets: async () => {
    return apiService.get<any>(API_ENDPOINTS.OPEN_TICKETS);
  },
  approveLeave: async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    return apiService.post(API_ENDPOINTS.LEAVE_ACTION(id), { status, ...(reason ? { reason } : {}) });
  },
  approveRegularisation: async (id: string, status: 'approved' | 'rejected') => {
    return apiService.patch(API_ENDPOINTS.REGULARISATION_ACTION(id), { status });
  },
};

export const employeesApi = {
  list: async (params: any = {}) => {
    return apiService.post(API_ENDPOINTS.EMPLOYEES_LIST, params);
  },
  get: async (id: string) => {
    return apiService.get<ApiResponse<any>>(API_ENDPOINTS.EMPLOYEES_GET(id));
  },
  create: async (data: any) => {
    return apiService.post(API_ENDPOINTS.EMPLOYEES_CREATE, data);
  },
  update: async (id: string, data: any) => {
    return apiService.put(API_ENDPOINTS.EMPLOYEES_UPDATE(id), data);
  },
  delete: async (id: string) => {
    return apiService.delete(API_ENDPOINTS.EMPLOYEES_DELETE(id));
  },
};

export const onboardingApi = {
  create: async (data: any) => apiService.post<ApiResponse<{ id: string }>>(API_ENDPOINTS.ONBOARDING.CREATE, data),
  savePersonal: async (id: string, data: any) => apiService.patch(API_ENDPOINTS.ONBOARDING.PERSONAL(id), data),
  saveEmployment: async (id: string, data: any) => apiService.patch(API_ENDPOINTS.ONBOARDING.EMPLOYMENT(id), data),
  saveCompensation: async (id: string, data: any) => apiService.patch(API_ENDPOINTS.ONBOARDING.COMPENSATION(id), data),
  saveLeaveOrg: async (id: string, data: any) => apiService.patch(API_ENDPOINTS.ONBOARDING.LEAVE_ORG(id), data),
  listDocuments: async (id: string) => apiService.get<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.LIST_DOCUMENTS(id)),
  uploadDocument: async (onboardingId: string, categoryId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(API_ENDPOINTS.ONBOARDING.UPLOAD_DOCUMENT(onboardingId, categoryId), formData, {
      'Content-Type': 'multipart/form-data'
    });
  },
  activate: async (id: string, data: any) => apiService.post(API_ENDPOINTS.ONBOARDING.ACTIVATE(id), data),
};

export const onboardingEmpAddApi = {
  create: async (data: any) => {
    return apiService.post<ApiResponse<{ id: string }>>(API_ENDPOINTS.ONBOARDING.CREATE, data);
  },
  savePersonal: async (id: string, data: any) => {
    return apiService.put<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.PERSONAL(id), data);
  },
  saveEmployment: async (id: string, data: any) => {
    return apiService.put<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.EMPLOYMENT(id), data);
  },
  saveCompensation: async (id: string, data: any) => {
    return apiService.put<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.COMPENSATION(id), data);
  },
  saveLeaveOrg: async (id: string, data: any) => {
    return apiService.put<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.LEAVE_ORG(id), data);
  },
  activate: async (id: string, data: any) => {
    return apiService.post<ApiResponse<any>>(API_ENDPOINTS.ONBOARDING.ACTIVATE(id), data);
  },
};

export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface HelpdeskTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description?: string;
  category_id: string;
  category_name?: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export const helpdeskApi = {
  categories: () =>
    apiService.get<any>(API_ENDPOINTS.HELPDESK.CATEGORIES),
  list: (params: any = {}, signal?: AbortSignal) =>
    apiService.post(API_ENDPOINTS.HELPDESK.LIST, params, undefined, signal),
  create: (data: { category_id: string; subject: string; description: string; priority: TicketPriority }) =>
    apiService.post(API_ENDPOINTS.HELPDESK.CREATE, data),
  get: (id: string) =>
    apiService.get<any>(API_ENDPOINTS.HELPDESK.GET(id)),
  update: (id: string, data: Partial<{ status: TicketStatus; resolution_note: string }>) =>
    apiService.patch(API_ENDPOINTS.HELPDESK.UPDATE(id), data),
  addComment: (id: string, data: { comment: string }) =>
    apiService.post(API_ENDPOINTS.HELPDESK.ADD_COMMENT(id), data),
};

export const notificationsApi = {
  list: async (unreadOnly: boolean = false) => {
    return apiService.get(API_ENDPOINTS.NOTIFICATIONS, { unread_only: unreadOnly });
  },
};

export type LeaveType = 'CL' | 'SL' | 'LOP' | 'WFH';
export type LeaveDurationType = 'full_day' | 'first_half' | 'second_half';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  duration_type: LeaveDurationType;
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  status: LeaveStatus;
  applied_on: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  employee_name?: string;
  employee_code?: string;
}

export interface LeaveBalance {
  leave_type: LeaveType;
  year: number;
  entitled: number;
  taken: number;
  carried_forward: number;
  available: number;
  lop_days: number;
}

export interface LeavePolicy {
  id: string;
  leave_type: LeaveType;
  annual_quota: number;
  carry_forward_limit: number;
  max_consecutive_days: number | null;
  is_paid: boolean;
  requires_approval: boolean;
  min_days_notice: number;
  is_active: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  holiday_date: string;
  holiday_type_id: string;
  description: string | null;
  year: number;
  is_optional: boolean;
  work_location_id: string | null;
  work_location_name: string | null;
  holiday_type_name: string | null;
}

export const leavesApi = {
  list: (params: any = {}, signal?: AbortSignal) =>
    apiService.post<any>(API_ENDPOINTS.LEAVES.LIST, params, undefined, signal),
  apply: (data: { leave_type: LeaveType; duration_type: LeaveDurationType; from_date: string; to_date: string; reason: string }) =>
    apiService.post<any>(API_ENDPOINTS.LEAVES.APPLY, data),
  action: (id: string, payload: { status: LeaveStatus; rejection_reason?: string }) =>
    apiService.patch<any>(API_ENDPOINTS.LEAVES.ACTION(id), payload),
  cancel: (id: string, reason: string) =>
    apiService.patch<any>(API_ENDPOINTS.LEAVES.CANCEL(id), { reason }),
  getBalances: (employeeId: string, year?: number) =>
    apiService.get<any>(API_ENDPOINTS.LEAVES.BALANCES(employeeId), year ? { year } : undefined),
  getPolicies: () =>
    apiService.get<any>(API_ENDPOINTS.LEAVES.POLICIES),
};

export const holidaysApi = {
  list: (params: { year?: number; work_location_id?: string | null } = {}) => {
    const p: any = { ...params };
    if (!p.work_location_id) delete p.work_location_id;
    return apiService.get<any>(API_ENDPOINTS.HOLIDAYS, p);
  },
  create: (data: { name: string; holiday_date: string; holiday_type_id: string; description?: string; is_optional?: boolean; work_location_id?: string }) =>
    apiService.post<any>(API_ENDPOINTS.HOLIDAYS, data),
  get: (id: string) =>
    apiService.get<any>(API_ENDPOINTS.HOLIDAY(id)),
  update: (id: string, data: Partial<{ name: string; holiday_date: string; holiday_type_id: string; description: string; is_optional: boolean; work_location_id: string }>) =>
    apiService.put<any>(API_ENDPOINTS.HOLIDAY(id), data),
  delete: (id: string) =>
    apiService.delete<any>(API_ENDPOINTS.HOLIDAY(id)),
};

export const dropdownsApi = {
  getDepartments: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.DEPARTMENTS),
  getDesignations: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.DESIGNATIONS),
  getWorkLocations: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.WORK_LOCATIONS),
  getHolidayTypes: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.HOLIDAY_CALENDAR),
  getLeavePolicies: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.LEAVE_POLICIES),
  getGender: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.GENDER),
  getMaritalStatus: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.MARITAL_STATUS),
  getNationality: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.NATIONALITY),
  getRelationship: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.RELATIONSHIP),
  getBloodGroups: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.BLOOD_GROUPS),
  getEmploymentTypes: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.EMPLOYMENT_TYPES),
  getManagers: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.MANAGERS),
  getEmployeeStatuses: async () => apiService.get<any>(API_ENDPOINTS.DROPDOWNS.EMPLOYEE_STATUSES),
};

export const attendanceApi = {
  statusOptions: async () => apiService.get<any>(API_ENDPOINTS.ATTENDANCE_STATUS_OPTIONS),
  monthlySummary: async (params: { month: number; year: number }) => apiService.post(API_ENDPOINTS.ATTENDANCE_MONTHLY_SUMMARY, params),
  weeklyStats: async () => apiService.get<any>(API_ENDPOINTS.ATTENDANCE_WEEKLY_STATS),
  list: async (params: any, signal?: AbortSignal) => apiService.post(API_ENDPOINTS.ATTENDANCE_LIST, params, undefined, signal),
  today: async () => apiService.get<any>(API_ENDPOINTS.ATTENDANCE_TODAY),
  clockIn: async (payload: { method: 'web_portal' | 'mobile_app'; remarks?: string }) => apiService.post<any>(API_ENDPOINTS.ATTENDANCE_CLOCK_IN, payload),
  clockOut: async (payload: { method: 'web_portal' | 'mobile_app'; remarks?: string }) => apiService.post<any>(API_ENDPOINTS.ATTENDANCE_CLOCK_OUT, payload),
  export: async (params: any) => apiService.post(API_ENDPOINTS.ATTENDANCE_EXPORT, params, { responseType: 'blob' }),
};
