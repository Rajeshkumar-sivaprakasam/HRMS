export interface EmployeeSummaryApiResponse {
  message: string;
  response: {
    today_attendance: {
      status: string | null;
      clock_in: string | null;
      clock_out: string | null;
      work_hours: number | null;
    };
    monthly_attendance: {
      days_attended: number;
      days_attended_prev_month: number;
      mom_diff: number;
    };
    work_hours: {
      avg_hours: number;
      target_hours: number;
      on_track: boolean;
    };
    lop_days: number;
    leave_balances: Array<{
      leave_type: string;
      entitled: number;
      taken: number;
      available: number;
      lop_days: number;
    }>;
    pending_requests: {
      total: number;
      leaves: number;
      permissions: number;
      regularisations: number;
    };
    unread_notifications: number;
    latest_payslip?: {
      month: number;
      year: number;
      net_salary: number;
    };
  };
}

export interface EmployeeSummary {
  greeting: {
    message: string;
    name: string;
    status: 'clocked_in' | 'clocked_out' | 'on_leave';
    clock_in_time?: string;
    clock_in_raw?: string | null;
  };
  attendance: {
    today: {
      date: string;
      current_time: string;
      status: 'clocked_in' | 'clocked_out';
      worked_hours: string;
      total_hours_goal: string;
      progress_percent: number;
    };
    timeline: Array<{
      id: string;
      type: 'clock_in' | 'clock_out';
      time: string;
      status: 'completed' | 'pending';
    }>;
  };
  leave_balance: Array<{
    type: string;
    label: string;
    used: number;
    total: number;
    color: string;
  }>;
  stats: {
    this_month: {
      days: number;
      diff_label: string;
    };
    avg_work_hours: {
      hours: string;
      status: 'on_track' | 'behind';
      target: string;
    };
    lop_days: number;
    pending_requests: {
      total: number;
      breakdown: string;
    };
  };
}

export interface Announcement {
  id: string;
  title: string;
  author: string;
  time_ago: string;
  type: 'policy' | 'event' | 'hiring' | 'general';
  is_pinned?: boolean;
  content?: string;
}

export interface WhosOutToday {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'on_leave';
}

export interface Holiday {
  id: string;
  date: string;
  day: string;
  month: string;
  name: string;
  type: string;
  rawDate?: string;
}

export interface Birthday {
  id: string;
  name: string;
  role: string;
  date: string;
  avatar?: string;
}

export interface WorkforceStats {
  headcount: {
    total: number;
    diff_this_month: number;
  };
  present_today: {
    count: number;
    total: number;
    percentage: number;
  };
  on_leave: {
    total: number;
    sick: number;
    casual: number;
  };
}

export interface AttendanceTrend {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface PendingApproval {
  id: string;
  employee_name: string;
  avatar?: string;
  type: string;
  duration: string;
  date: string;
}

export interface DeptHeadcount {
  name: string;
  count: number;
  diff: number;
}

export interface HelpdeskTicket {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  requester: string;
  status: 'Open' | 'In progress' | 'Resolved';
}

export interface HRDashboardSummary {
  total_employees: number;
  present_today: number;
  absent_today: number;
  pending_leaves: number;
  open_tickets: number;
  new_joiners_this_month: number;
  separations_this_month: number;
  latest_payroll: {
    month: number;
    year: number;
    status: string;
    total_net: number;
  };
}
