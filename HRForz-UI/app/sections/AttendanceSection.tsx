'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, Typography, Spinner, Skeleton, Icon, DataTable, Modal, Textarea, Button, Input, useToast } from '@/components';
import { attendanceApi, holidaysApi, dropdownsApi, type AttendanceRecord, type AttendanceStatus, type TodayAttendanceStatus, type AttendanceMonthlySummary, type AttendanceWeeklyStats } from '@/lib/api';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import styles from '../(shell)/attendance/attendance.module.scss';

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  P:     { label: 'Present',   color: '#15803d', bg: '#dcfce7' },
  LT:    { label: 'Late',      color: '#92400e', bg: '#fef3c7' },
  A:     { label: 'Absent',    color: '#dc2626', bg: '#fee2e2' },
  L:     { label: 'Leave',     color: '#dc2626', bg: '#fce7f3' },
  HD_FH: { label: 'Half Day',  color: '#c2410c', bg: '#ffedd5' },
  HD_SH: { label: 'Half Day',  color: '#c2410c', bg: '#ffedd5' },
  WFH:   { label: 'WFH',       color: '#1d4ed8', bg: '#dbeafe' },
  PH:    { label: 'Hol',       color: '#7c3aed', bg: '#ede9fe' },
  WO:    { label: 'WO',        color: '#94a3b8', bg: '#f8fafc' },
  OT:    { label: 'OT',        color: '#0f766e', bg: '#ccfbf1' },
  PE:    { label: 'PE',        color: '#92400e', bg: '#fef3c7' },
  R:     { label: 'Reg',       color: '#1e40af', bg: '#eff6ff' },
  IC:    { label: 'In',        color: '#0369a1', bg: '#e0f2fe' },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEGEND = [
  { label: 'Present', color: '#15803d' },
  { label: 'Late',    color: '#92400e' },
  { label: 'Leave',   color: '#dc2626' },
  { label: 'Holiday', color: '#7c3aed' },
  { label: 'Weekend', color: '#94a3b8' },
];

const AVATAR_COLORS = ['#2f6df5','#7c3aed','#16a34a','#0284c7','#dc2626','#d97706','#0d9488','#ec4899'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTime(val?: string | null): string {
  if (!val) return '';
  // Handle ISO datetime "2026-05-07T09:30:00[+Z...]" or bare "09:30" / "09:30:00"
  return val.includes('T') ? val.split('T')[1].slice(0, 5) : val.slice(0, 5);
}

function toMins(val?: string | null): number {
  const t = extractTime(val);
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmtMins(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtTime12(val?: string | null): string {
  if (!val) return '—';
  // For ISO datetimes use Date() so the browser applies the local timezone offset
  if (val.includes('T')) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      const h = d.getHours(), m = d.getMinutes();
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    }
  }
  // Bare "HH:MM" or "HH:MM:SS" strings — treat as local time directly
  const [h, m] = val.slice(0, 5).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Converts a clock-in/out timestamp to minutes since midnight IN LOCAL TIME.
// Used for average in-time calculations (not for duration subtraction).
function toLocalTimeMins(val?: string | null): number {
  if (!val) return 0;
  if (val.includes('T')) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  }
  const [h, m] = val.slice(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function elapsedSince(clockInVal: string | null | undefined, now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  if (!clockInVal) return '00:00:00';
  const start = new Date(clockInVal.includes('T') ? clockInVal : `1970-01-01T${clockInVal}`);
  // Normalise to today if the stored value is a bare time (1970 epoch)
  if (start.getFullYear() === 1970) {
    const today = new Date();
    start.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
  }
  const totalSec = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function sessionDuration(clockIn: string | null | undefined, clockOut: string | null | undefined): string {
  const p = (n: number) => String(n).padStart(2, '0');
  if (!clockIn || !clockOut) return '00:00:00';
  const diffSec = Math.max(0, Math.floor(
    (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 1000
  ));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function workingDaysCount(year: number, month: number, upToDay?: number): number {
  const total = upToDay ?? new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + (c.codePointAt(0) ?? 0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttendanceSection() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const todayDateStr = useMemo(() => {
    const t = new Date();
    return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  // Read role + employee_id once from localStorage (set during login)
  const role = useMemo<string>(() => {
    if (globalThis.window === undefined) return 'employee';
    return localStorage.getItem('hrforz_role') || 'employee';
  }, []);
  const isHrAdmin = role === 'hr_admin';
  const loggedInEmployeeId = useMemo<string>(() => {
    if (globalThis.window === undefined) return '';
    return localStorage.getItem('hrforz_employee_id') || '';
  }, []);

  const [viewYear, setViewYear]         = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth]       = useState(() => new Date().getMonth());
  const [records, setRecords]           = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(false);
  const [clockLoading, setClockLoading]   = useState(false);
  const [clockError, setClockError]       = useState<string | null>(null);
  const [now, setNow]                     = useState(new Date());
  const [attendanceTab, setAttendanceTab] = useState<'myself' | 'overall'>('myself');
  const [myselfPage, setMyselfPage]       = useState(1);
  const [myselfPageSize, setMyselfPageSize] = useState(10);
  // Single source of truth for today's clock state — from /v1/attendance/today
  const [todayStatus, setTodayStatus]     = useState<TodayAttendanceStatus | null>(null);
  // Dashboard summary data (used for monthly stats only)
  const [monthlySummary, setMonthlySummary] = useState<AttendanceMonthlySummary | null>(null);
  const [weeklyStatsData, setWeeklyStatsData] = useState<AttendanceWeeklyStats | null>(null);
  const [holidays, setHolidays]           = useState<any[]>([]);
  // True until the first dashboard + attendance fetch both complete
  const [sessionLoading, setSessionLoading] = useState(true);
  // True on every month/year change while stats are re-fetching
  const [statsLoading, setStatsLoading] = useState(true);
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [clockInRemarks, setClockInRemarks] = useState('');

  // ── Filter sidebar (HR only) ───────────────────────────────────────────────
  type TeamFilter = { from_date: string; to_date: string; employee_code: string; department_id: string; designation_id: string; status: string };
  const EMPTY_FILTER: TeamFilter = { from_date: '', to_date: '', employee_code: '', department_id: '', designation_id: '', status: '' };
  const [filterOpen, setFilterOpen]         = useState(false);
  const [filterClosing, setFilterClosing]   = useState(false);
  const [filterDraft, setFilterDraft]       = useState<TeamFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter]   = useState<TeamFilter>(EMPTY_FILTER);
  const [departments,  setDepartments]  = useState<{ label: string; value: string }[]>([]);
  const [designations, setDesignations] = useState<{ label: string; value: string }[]>([]);
  const [statuses,     setStatuses]     = useState<{ label: string; value: string }[]>([]);

  const filterDropdownsLoaded = useRef(false);
  useEffect(() => {
    if (!filterOpen || filterDropdownsLoaded.current) return;
    filterDropdownsLoaded.current = true;
    const toOpts = (res: any) => {
      const rows = res?.response?.data ?? res?.response ?? res?.data ?? [];
      return Array.isArray(rows)
        ? rows.map((d: any) => ({ label: d.name || d.label || '', value: String(d.id || d.value || d.name || '') }))
        : [];
    };
    dropdownsApi.getDepartments().then(res  => setDepartments(toOpts(res))).catch(() => {});
    dropdownsApi.getDesignations().then(res => setDesignations(toOpts(res))).catch(() => {});
    attendanceApi.statusOptions().then(res => {
      const rows = res?.data ?? res?.response?.data ?? res?.response ?? [];
      if (Array.isArray(rows)) setStatuses(rows.map((d: any) => ({ label: d.label || '', value: String(d.value || '') })));
    }).catch(() => {});
  }, [filterOpen]);

  const closeFilter = useCallback(() => {
    setFilterClosing(true);
    setTimeout(() => { setFilterOpen(false); setFilterClosing(false); }, 260);
  }, []);

  const handleApplyFilter = () => { setAppliedFilter({ ...filterDraft }); closeFilter(); };
  const handleClearFilter = () => { setFilterDraft(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER); };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch holidays — re-runs when year or employee work location changes ───

  const fetchHolidays = useCallback(async () => {
    try {
      const workLocationId = globalThis.window === undefined ? null : localStorage.getItem('hrforz_work_location_id');
      const params: any = { year: viewYear };
      if (workLocationId) params.work_location_id = workLocationId;
      const res: any = await holidaysApi.list(params);
      const rows = res?.response?.data ?? res?.response ?? [];
      setHolidays(Array.isArray(rows) ? rows : []);
    } catch { /* best-effort */ }
  }, [viewYear]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  // Map holiday date → name for O(1) lookup in calendar cells
  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {};
    holidays.forEach(h => {
      const d: string = h.date || h.holiday_date || h.start_date || '';
      if (d) map[d.split('T')[0]] = h.name || h.holiday_name || h.title || 'Hol';
    });
    return map;
  }, [holidays]);

  // ── Fetch monthly KPI summary (current month, current user) ───────────────

  const fetchMonthlySummary = useCallback(async () => {
    try {
      const res: any = await attendanceApi.monthlySummary({ month: viewMonth + 1, year: viewYear });
      setMonthlySummary(res?.response ?? null);
    } catch { /* best-effort */ }
  }, [viewMonth, viewYear]);

  // ── Fetch weekly KPI stats (current week, current user) ───────────────────

  const fetchWeeklyStats = useCallback(async () => {
    try {
      const res: any = await attendanceApi.weeklyStats();
      setWeeklyStatsData(res?.response ?? null);
    } catch { /* best-effort */ }
  }, []);

  // ── Fetch attendance records for the calendar ──────────────────────────────

  const fetchAttendance = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(false);
    try {
      const daysInView = new Date(viewYear, viewMonth + 1, 0).getDate();
      const pad = (n: number) => String(n).padStart(2, '0');
      const from_date = `${viewYear}-${pad(viewMonth + 1)}-01`;
      const to_date   = `${viewYear}-${pad(viewMonth + 1)}-${pad(daysInView)}`;
      const res: any = await attendanceApi.list({
        filter: {
          sortBy: 'attendance_date', sortOrder: 'asc', from_date, to_date,
          ...(loggedInEmployeeId && { employee_id: loggedInEmployeeId }),
        },
        pagination: { page: 1, size: daysInView },
        paginationFlag: true,
      }, signal);
      // API returns { response: { data: [] } } when paginationFlag:true
      const rows = res?.response?.data ?? res?.response ?? [];
      setRecords(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // cancelled by cleanup — not an error
      setRecords([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear]);

  // Weekly stats and today status don't depend on the calendar — fetch once on mount
  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    if (isFirstLoad.current) setSessionLoading(true);
    setStatsLoading(true);
    Promise.all([
      fetchMonthlySummary(),
      fetchAttendance(controller.signal),
    ]).finally(() => {
      if (!controller.signal.aborted) {
        isFirstLoad.current = false;
        setSessionLoading(false);
        setStatsLoading(false);
      }
    });
    return () => controller.abort();
  }, [fetchMonthlySummary, fetchAttendance]);

  const byDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    records.forEach(r => { map[r.attendance_date.split('T')[0]] = r; });
    return map;
  }, [records]);

  // ── Fetch today's clock status from dedicated endpoint ─────────────────────

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await attendanceApi.today();
      setTodayStatus(res?.response ?? null);
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => { fetchTodayStatus(); }, [fetchTodayStatus]);

  // Clock state — single source of truth from /v1/attendance/today
  const clockedIn  = todayStatus?.status === 'clocked_in';
  const clockedOut = todayStatus?.status === 'clocked_out';

  // ── Month-level stats — from /v1/attendance/monthly-summary when available ──

  const monthStats = useMemo(() => {
    const today    = new Date();
    const isCurMon = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const upToDay  = isCurMon ? today.getDate() : undefined;
    const wDays    = workingDaysCount(viewYear, viewMonth, upToDay);
    const rangeEnd = isCurMon ? today.getDate() : new Date(viewYear, viewMonth + 1, 0).getDate();

    // Compute from records — always used for avgInTime; used as fallback for other fields
    let recPresent = 0, totalMins = 0, inTimeMins = 0, inCount = 0, lateCountRec = 0, lopDaysRec = 0;
    records.forEach(r => {
      if (['P', 'LT', 'WFH', 'OT', 'PE', 'IC'].includes(r.status)) recPresent++;
      if (r.status === 'LT' || r.is_late) lateCountRec++;
      if (r.status === 'A') lopDaysRec++;
      if (r.work_hours != null && r.work_hours > 0) {
        totalMins += Math.round(r.work_hours * 60);
      } else if (r.clock_in && r.clock_out) {
        const diff = toMins(r.clock_out) - toMins(r.clock_in);
        if (diff > 0) totalMins += diff;
      }
      if (r.clock_in) { inTimeMins += toLocalTimeMins(r.clock_in); inCount++; }
    });

    const avgIn  = inCount > 0 ? Math.round(inTimeMins / inCount) : 0;
    const avgInH = Math.floor(avgIn / 60);
    const avgInM = avgIn % 60;

    // Prefer /monthly-summary for current month; fall back to record-computed values
    const ms = isCurMon ? monthlySummary : null;
    const workingDays  = ms?.total_working_days ?? wDays;
    const daysPresent  = ms
      ? Math.round((ms.day_percent / 100) * ms.total_working_days)
      : recPresent;
    // total_worked_hours format: H.MM (e.g. 156.30 → 156h 30m)
    const totalWorkedRaw = ms?.total_worked_hours ?? null;
    const totalWorkedMins = totalWorkedRaw === null
      ? totalMins
      : Math.floor(totalWorkedRaw) * 60 + Math.round((totalWorkedRaw % 1) * 100);
    const totalHLabel = totalWorkedRaw === null
      ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
      : `${Math.floor(totalWorkedRaw)}h ${Math.round((totalWorkedRaw % 1) * 100)}m`;
    const lateCount    = ms?.late_arrivals ?? lateCountRec;
    const strikes      = ms?.strikes ?? Math.floor(lateCountRec / 3);
    const lopDays      = lopDaysRec;
    const targetMins   = Math.round(workingDays * 8.5 * 60);
    const diffMins     = totalWorkedMins - targetMins;

    // avg_working_time format: H.MM (e.g. 6.26 → 6h 26m, not decimal hours)
    const avgWorkDecimal = ms?.avg_working_time ?? null;
    const avgWorkTime: string | null = avgWorkDecimal === null
      ? null
      : `${Math.floor(avgWorkDecimal)}h ${Math.round((avgWorkDecimal % 1) * 100)}m`;
    const avgWorkDiffMins = avgWorkDecimal === null
      ? null
      : (Math.floor(avgWorkDecimal) * 60 + Math.round((avgWorkDecimal % 1) * 100)) - 8 * 60;

    return {
      daysPresent,
      workingDays,
      lopDays,
      avgWorkTime,
      avgWorkDiffMins,
      // fallback avg clock-in time (used when API value absent)
      avgInTime: avgIn > 0 ? `${avgInH}:${String(avgInM).padStart(2, '0')}` : '—',
      devMins:   avgIn > 0 ? avgIn - 9 * 60 : 0,
      totalHLabel,
      diffMins,
      lateCount,
      strikes,
      rangeLabel: `${MONTHS[viewMonth].slice(0, 3)} 1–${rangeEnd}`,
    };
  }, [monthlySummary, records, viewYear, viewMonth]);

  // ── This-week stats — from /v1/attendance/weekly-stats when available ───────

  const weekStats = useMemo(() => {
    if (weeklyStatsData) {
      return {
        logged:       weeklyStatsData.hours_logged_label,
        target:       weeklyStatsData.weekly_target_hours,
        pct:          weeklyStatsData.hours_progress_percent,
        avgIn:        weeklyStatsData.avg_clock_in_time,
        onTrack:      weeklyStatsData.is_on_schedule,
        streak:       weeklyStatsData.current_streak,
        personalBest: weeklyStatsData.personal_best_streak,
      };
    }

    // Fallback: compute from records
    const ref       = new Date();
    const weekStart = new Date(ref);
    weekStart.setDate(ref.getDate() - ref.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let streak = 0, inTimeMins = 0, presentCount = 0, totalMins = 0;
    const sorted = [...records].sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
    for (const r of sorted) {
      if (new Date(r.attendance_date) > ref) continue;
      if (['P', 'LT', 'WFH', 'OT'].includes(r.status)) streak++;
      else if (['WO', 'PH'].includes(r.status)) continue;
      else break;
    }
    records.forEach(r => {
      const d = new Date(r.attendance_date + 'T00:00:00');
      if (d < weekStart || d > ref) return;
      if (r.clock_in) { inTimeMins += toLocalTimeMins(r.clock_in); presentCount++; }
      if (r.work_hours != null && r.work_hours > 0) {
        totalMins += Math.round(r.work_hours * 60);
      } else if (r.clock_in && r.clock_out) {
        const diff = toMins(r.clock_out) - toMins(r.clock_in);
        if (diff > 0) totalMins += diff;
      }
    });
    const avgIn    = presentCount > 0 ? Math.round(inTimeMins / presentCount) : 0;
    const avgH     = Math.floor(avgIn / 60);
    const avgM     = avgIn % 60;
    const avgAmPm  = avgH >= 12 ? 'PM' : 'AM';
    return {
      logged:       fmtMins(totalMins),
      target:       42,
      pct:          Math.min(100, Math.round((totalMins / (42 * 60)) * 100)),
      avgIn:        avgIn > 0
        ? `${String(avgH).padStart(2, '0')}:${String(avgM).padStart(2, '0')} ${avgAmPm}`
        : '—',
      onTrack:      false,
      streak,
      personalBest: 0,
    };
  }, [weeklyStatsData, records]);

  // ── Calendar cells ────────────────────────────────────────────────────────

  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow      = new Date(viewYear, viewMonth, 1).getDay();

  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevMonthDays - (firstDow - 1 - i);
    cells.push({ key: toDateStr(viewYear, viewMonth - 1, d), day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: toDateStr(viewYear, viewMonth, d), day: d });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ key: toDateStr(viewYear, viewMonth + 1, nextDay++), day: null });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ── Clock actions ─────────────────────────────────────────────────────────

  const handleClockIn = () => {
    setClockInRemarks('');
    setIsClockInModalOpen(true);
  };

  const performClockIn = async () => {
    setClockLoading(true);
    setClockError(null);
    try {
      await attendanceApi.clockIn({
        method: 'web_portal',
        remarks: clockInRemarks.trim() || undefined
      });
      // Optimistic update so the timer starts immediately
      setTodayStatus({
        status: 'clocked_in',
        clock_in: new Date().toISOString(),
        clock_out: null,
        work_hours: null,
        is_late: false
      });
      setIsClockInModalOpen(false);
      addToast({ variant: 'success', title: t('attendance.clock_in'), message: t('attendance.clocked_in_message') });
      fetchTodayStatus();
      fetchAttendance();
    } catch (e: any) {
      const msg: string = e.message || '';
      if (msg.toLowerCase().includes('already clocked')) {
        setIsClockInModalOpen(false);
        fetchTodayStatus(); // sync real state
      } else {
        setClockError(msg || t('attendance.clock_in_failed'));
        addToast({ variant: 'error', title: t('attendance.clock_in_failed'), message: msg || t('common.error_saving') });
      }
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    setClockError(null);
    try {
      await attendanceApi.clockOut({ method: 'web_portal' });
      // Optimistic update
      setTodayStatus(prev => prev ? { ...prev, status: 'clocked_out', clock_out: new Date().toISOString() } : null);
      addToast({ variant: 'success', title: t('attendance.clock_out'), message: t('attendance.clocked_out_message') });
      fetchTodayStatus();
      fetchAttendance();
    } catch (e: any) {
      const msg: string = e.message || '';
      if (msg.toLowerCase().includes('already clocked')) {
        fetchTodayStatus();
      } else {
        setClockError(msg || t('attendance.clock_out_failed'));
        addToast({ variant: 'error', title: t('attendance.clock_out_failed'), message: msg || t('common.error_saving') });
      }
    } finally {
      setClockLoading(false);
    }
  };

  // ── Export handler ────────────────────────────────────────────────────────

  const handleExport = async (extraFilter: Record<string, string> = {}) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const daysInView = new Date(viewYear, viewMonth + 1, 0).getDate();
    const from_date  = `${viewYear}-${pad(viewMonth + 1)}-01`;
    const to_date    = `${viewYear}-${pad(viewMonth + 1)}-${pad(daysInView)}`;
    try {
      await attendanceApi.export({
        filter: { sortBy: 'attendance_date', sortOrder: 'asc', from_date, to_date, ...extraFilter },
        pagination: { page: 1, size: 20 },
        paginationFlag: true,
      });
    } catch { /* no-op — server may stream a file download directly */ }
  };

  // ── Team attendance DataTable columns ─────────────────────────────────────

  const teamColumns = [
    {
      id: 'employee',
      header: t('attendance.col_employee'),
      accessor: (row: any) => {
        const name  = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.employee_name || row.employee_id;
        const desig = row.designation_name || row.designation || '';
        const color = avatarColor(name);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {initials(name)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{desig}</div>
            </div>
          </div>
        );
      },
      width: '240px',
    },
    {
      id: 'department',
      header: t('attendance.col_department'),
      accessor: (row: any) => (
        <span style={{ fontSize: 13, color: '#2f6df5' }}>{row.department_name || row.department || '—'}</span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      accessor: (row: any) => {
        const MAP: Record<string, { label: string; color: string }> = {
          P:   { label: 'Present',  color: '#15803d' },
          LT:  { label: 'Late',     color: '#d97706' },
          A:   { label: 'Absent',   color: '#dc2626' },
          L:   { label: 'On leave', color: '#d97706' },
          WFH: { label: 'WFH',      color: '#2563eb' },
          PH:  { label: 'Holiday',  color: '#7c3aed' },
          WO:  { label: 'Weekend',  color: '#94a3b8' },
        };
        const cfg = MAP[row.status] || { label: row.status || '—', color: '#64748b' };
        return <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>;
      },
    },
    {
      id: 'in',
      header: t('attendance.col_in'),
      accessor: (row: any) => <span style={{ fontSize: 13 }}>{fmtTime12(row.clock_in)}</span>,
    },
    {
      id: 'out',
      header: t('attendance.col_out'),
      accessor: (row: any) => <span style={{ fontSize: 13 }}>{fmtTime12(row.clock_out)}</span>,
    },
    {
      id: 'hours',
      header: t('attendance.col_hours'),
      accessor: (row: any) => {
        if (!row.clock_in || !row.clock_out) return <span style={{ fontSize: 13, color: '#94a3b8' }}>—</span>;
        const diff = toMins(row.clock_out) - toMins(row.clock_in);
        return <span style={{ fontSize: 13 }}>{diff > 0 ? fmtMins(diff) : '—'}</span>;
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Typography variant="h2" className={styles.pageTitle}>
            {isHrAdmin ? t('attendance.title') : t('attendance.my_attendance')}
          </Typography>
          <Typography variant="body2" color="secondary" as="p" className={styles.pageSubtitle}>
            {isHrAdmin
              ? t('attendance.subtitle_hr')
              : `${MONTHS[viewMonth]} ${viewYear} · ${monthStats.daysPresent} days present · ${monthStats.lopDays} LOP days`}
          </Typography>
        </div>

      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {statsLoading ? (
          <>
            {[0, 1, 2, 3].map(i => (
              <Card key={i} className={styles.statCard}>
                <Skeleton variant="text" width="60%" height={12} style={{ marginBottom: 10 }} />
                <Skeleton variant="text" width="40%" height={28} style={{ marginBottom: 8 }} />
                <Skeleton variant="text" width="75%" height={12} />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className={styles.statCard}>
              <Typography variant="caption" className={styles.statCardLabel}>{t('attendance.days_present')}</Typography>
              <Typography variant="h3" className={styles.statCardValue}>{monthStats.daysPresent}</Typography>
              <Typography variant="caption" className={styles.statCardSub}>of {monthStats.workingDays} working days</Typography>
            </Card>

            <Card className={styles.statCard}>
              <Typography variant="caption" className={styles.statCardLabel}>{t('attendance.avg_working_time')}</Typography>
              <Typography variant="h3" className={styles.statCardValue}>{monthStats.avgWorkTime ?? monthStats.avgInTime}</Typography>
              {monthStats.avgWorkDiffMins != null ? (
                <Typography variant="caption" className={`${styles.statCardSub} ${monthStats.avgWorkDiffMins >= 0 ? styles.statCardSubSuccess : styles.statCardSubWarning}`}>
                  {monthStats.avgWorkDiffMins >= 0
                    ? `+${monthStats.avgWorkDiffMins}m ${t('attendance.vs_target')}`
                    : `${monthStats.avgWorkDiffMins}m ${t('attendance.vs_target')}`}
                </Typography>
              ) : monthStats.devMins !== 0 ? (
                <Typography variant="caption" className={`${styles.statCardSub} ${monthStats.devMins > 0 ? styles.statCardSubWarning : styles.statCardSubSuccess}`}>
                  {monthStats.devMins > 0
                    ? `${monthStats.devMins} min later than usual`
                    : `${Math.abs(monthStats.devMins)} min earlier than usual`}
                </Typography>
              ) : null}
            </Card>

            <Card className={styles.statCard}>
              <Typography variant="caption" className={styles.statCardLabel}>{t('attendance.total_hours')}</Typography>
              <Typography variant="h3" className={styles.statCardValue}>{monthStats.totalHLabel}</Typography>
              <Typography variant="caption" className={`${styles.statCardSub} ${monthStats.diffMins >= 0 ? styles.statCardSubSuccess : styles.statCardSubWarning}`}>
                {monthStats.diffMins >= 0 ? '+' : ''}{Math.floor(Math.abs(monthStats.diffMins) / 60)}h {Math.abs(monthStats.diffMins) % 60}m {t('attendance.vs_target')}
                <span style={{ color: '#94a3b8', marginLeft: 6 }}>{monthStats.rangeLabel}</span>
              </Typography>
            </Card>

            <Card className={styles.statCard}>
              <Typography variant="caption" className={styles.statCardLabel}>{t('attendance.late_arrivals')}</Typography>
              <Typography variant="h3" className={styles.statCardValue}>{monthStats.lateCount}</Typography>
              <Typography variant="caption" className={styles.statCardSub}>{monthStats.strikes} {monthStats.strikes === 1 ? t('attendance.strike') : t('attendance.strikes')} · {t('attendance.strike_policy')}</Typography>
            </Card>
          </>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className={styles.grid}>

        {/* Calendar card */}
        <Card className={styles.calCard}>

          {/* Month nav */}
              <div className={styles.calHeader}>
                <Typography variant="h5">{MONTHS[viewMonth]} {viewYear}</Typography>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
                    <Icon name="chevron-left" size={14} />
                  </button>
                  <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
                    <Icon name="chevron-right" size={14} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className={styles.dayRow}>
                {DAYS_SHORT.map(d => <div key={d} className={styles.dayHead}>{d}</div>)}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className={styles.loadWrap}><Spinner size="md" /></div>
              ) : fetchError ? (
                <div className={styles.logEmpty}>
                  <Icon name="alert-circle" size={28} color="#fca5a5" />
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Could not load attendance data</p>
                  <button className={styles.actionBtn} onClick={() => fetchAttendance()} style={{ marginTop: 4 }}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className={styles.calGrid}>
                  {cells.map(({ key, day }) => {
                    if (!day) return <div key={key} style={{ minHeight: 76 }} />;
                    const ds      = toDateStr(viewYear, viewMonth, day);
                    const rec     = byDate[ds];
                    const cfg     = rec?.status ? STATUS_CFG[rec.status] : undefined;
                    const isToday = ds === todayDateStr;
                    const isWknd  = [0, 6].includes(new Date(viewYear, viewMonth, day).getDay());
                    const isHol   = !cfg && !!holidayMap[ds];
                    const holLabel = isHol
                      ? (holidayMap[ds].length > 6 ? holidayMap[ds].slice(0, 3) : holidayMap[ds])
                      : '';

                    let hoursLabel = '';
                    if (rec?.work_hours != null && rec.work_hours > 0) {
                      hoursLabel = `${rec.work_hours.toFixed(1)}h`;
                    } else if (rec?.clock_in && rec?.clock_out) {
                      const diff = toMins(rec.clock_out) - toMins(rec.clock_in);
                      if (diff > 0) hoursLabel = `${(diff / 60).toFixed(1)}h`;
                    }

                    // Derive a human-readable leave label from the record's leave type fields
                    const leaveTypeRaw = rec?.leave_type_code || rec?.leave_type || rec?.leave_type_name || '';
                    // Abbreviate long names to ≤6 chars so they fit in the cell
                    const leaveLabel = leaveTypeRaw.length > 6
                      ? leaveTypeRaw.slice(0, 3).toUpperCase()
                      : leaveTypeRaw.toUpperCase() || '';

                    // Cell background + text colours
                    let bg: string;
                    let border: string;
                    let numCol: string;
                    if (isToday) {
                      bg = 'rgba(20,184,166,0.05)';
                      border = '2px solid #14b8a6';
                      numCol = '#0d9488';
                    } else if (cfg) {
                      bg = cfg.bg;
                      border = '1px solid transparent';
                      numCol = cfg.color;
                    } else if (isHol) {
                      bg = '#ede9fe';
                      border = '1px solid transparent';
                      numCol = '#7c3aed';
                    } else if (isWknd) {
                      bg = '#eef2f7';
                      border = '1px solid #dde3ec';
                      numCol = '#94a3b8';
                    } else {
                      bg = '#fff';
                      border = '1px solid #e2e8f0';
                      numCol = '#64748b';
                    }

                    // For leave/half-day cells show leave type code (CL, SL…) when available, else fall back to status label
                    const isLeaveStatus = rec && ['L', 'HD_FH', 'HD_SH'].includes(rec.status);
                    const statusLabel   = cfg ? cfg.label : (isHol ? holLabel : '');
                    const resolvedLabel = isLeaveStatus && leaveLabel ? leaveLabel : statusLabel;
                    const subText  = hoursLabel || resolvedLabel;
                    const subColor = isToday ? '#0d9488' : (cfg?.color ?? (isHol ? '#7c3aed' : '#94a3b8'));

                    return (
                      <div
                        key={key}
                        className={`${styles.dayCell} ${isToday ? styles.today : ''}`}
                        style={{ background: bg, border }}
                      >
                        <span className={styles.dayNum} style={{ color: numCol }}>{day}</span>
                        {subText && (
                          <span className={styles.cellSub} style={{ color: subColor }}>{subText}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className={styles.legend}>
                {LEGEND.map(l => (
                  <div key={l.label} className={styles.legendItem}>
                    <span className={styles.dot} style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
        </Card>

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Today's session */}
          <Card className={styles.sessionCard}>
            <Typography variant="caption" className={styles.sessionLabel}>{t('attendance.todays_session')}</Typography>

            {sessionLoading ? (
              <div className={styles.sessionSpinner}><Spinner size="md" /></div>
            ) : (
              <>
                {(() => {
                  const display = clockedIn
                    ? elapsedSince(todayStatus?.clock_in, now)
                    : clockedOut
                      ? sessionDuration(todayStatus?.clock_in, todayStatus?.clock_out)
                      : '00:00:00';
                  return <div className={styles.clockTime}>{display}</div>;
                })()}

                {clockedIn && todayStatus?.clock_in && (() => {
                  const elapsedMins = Math.max(0, Math.floor((now.getTime() - new Date(todayStatus.clock_in).getTime()) / 60000));
                  const sessionPct  = Math.min(100, Math.round((elapsedMins / 510) * 100));
                  return (
                    <>
                      <Typography variant="caption" as="p" className={styles.clockSub}>
                        {t('attendance.clocked_in')} {fmtTime12(todayStatus.clock_in)} · {t('attendance.target_hours')}
                      </Typography>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${sessionPct}%` }} />
                      </div>
                    </>
                  );
                })()}
                {clockedOut && (
                  <Typography variant="caption" as="p" className={styles.clockSub} style={{ color: '#15803d' }}>
                    {t('attendance.clocked_out')} {fmtTime12(todayStatus?.clock_in)} – {fmtTime12(todayStatus?.clock_out)}
                  </Typography>
                )}
                {!clockedIn && !clockedOut && (
                  <Typography variant="caption" as="p" className={styles.clockSub}>{t('attendance.not_clocked_in')}</Typography>
                )}

                {clockedIn ? (
                  <button className={`${styles.clockBtn} ${styles.clockBtnOut}`} onClick={handleClockOut} disabled={clockLoading}>
                    {clockLoading ? <Spinner size="sm" /> : <span>⏹</span>} {t('attendance.clock_out')}
                  </button>
                ) : (
                  <button className={`${styles.clockBtn} ${styles.clockBtnIn}`} onClick={handleClockIn} disabled={clockLoading}>
                    {clockLoading ? <Spinner size="sm" /> : <span>▶</span>} {t('attendance.clock_in')}
                  </button>
                )}
              </>
            )}

            {clockError && (
              <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert-circle" size={12} color="#dc2626" /> {clockError}
              </p>
            )}

            <div className={styles.clockHint}>
              <Icon name="info" size={13} color="#94a3b8" />
              <span>{t('attendance.clock_in_hint')}</span>
            </div>
          </Card>

          {/* This week */}
          <Card className={styles.weekCard}>
              <Typography variant="h5">{t('attendance.this_week')}</Typography>
              <div className={styles.statList}>
                <div className={styles.statRow}>
                  <div>
                    <Typography variant="caption" className={styles.statRowLabel}>{t('attendance.hours_logged')}</Typography>
                    <Typography variant="caption" color="secondary" className={styles.statRowSub}>of {weekStats.target}h target</Typography>
                  </div>
                  <div className={styles.statRowVal}>{weekStats.logged}</div>
                </div>
                <div className={styles.statRow}>
                  <div>
                    <Typography variant="caption" className={styles.statRowLabel}>{t('attendance.avg_in_time')}</Typography>
                    <Typography variant="caption" color="secondary" className={styles.statRowSub}>{weekStats.onTrack ? t('attendance.on_schedule') : t('attendance.off_schedule')}</Typography>
                  </div>
                  <div className={styles.statRowVal}>{weekStats.avgIn}</div>
                </div>
                <div className={styles.statRow}>
                  <div>
                    <Typography variant="caption" className={styles.statRowLabel}>{t('attendance.streak')}</Typography>
                    <Typography variant="caption" color="secondary" className={styles.statRowSub}>{weekStats.personalBest > 0 ? `Personal best: ${weekStats.personalBest}` : t('attendance.keep_it_up')}</Typography>
                  </div>
                  <div className={styles.statRowVal}>{weekStats.streak} {t('attendance.days')}</div>
                </div>
              </div>
            </Card>
        </div>
      </div>

      {/* ── Attendance table (all users) ── */}
      <Card className={styles.teamCard}>
        <div className={styles.teamHeader}>
          <Typography variant="h5">
            {attendanceTab === 'overall' ? t('attendance.team_attendance') : t('attendance.my_attendance')}
          </Typography>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
              {(['myself', ...(isHrAdmin ? ['overall'] : [])] as ('myself' | 'overall')[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAttendanceTab(tab)}
                  style={{
                    padding: '5px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: attendanceTab === tab ? '#fff' : 'transparent',
                    color: attendanceTab === tab ? '#0f172a' : '#64748b',
                    boxShadow: attendanceTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab === 'myself' ? t('attendance.myself') : t('attendance.overall')}
                </button>
              ))}
            </div>

            {/* Actions */}
            {attendanceTab === 'overall' && isHrAdmin && (
              <>
                <button className={styles.actionBtn} onClick={() => { setFilterDraft({ ...appliedFilter }); setFilterOpen(true); }}>
                  <Icon name="filter" size={13} /> {t('common.apply_filters')}
                </button>
                <button className={styles.actionBtn} onClick={() => handleExport({
                    ...(appliedFilter.from_date      && { from_date:      appliedFilter.from_date }),
                    ...(appliedFilter.to_date        && { to_date:        appliedFilter.to_date }),
                    ...(appliedFilter.employee_code  && { employee_code:  appliedFilter.employee_code }),
                    ...(appliedFilter.department_id  && { department_id:  appliedFilter.department_id }),
                    ...(appliedFilter.designation_id && { designation_id: appliedFilter.designation_id }),
                    ...(appliedFilter.status         && { status:         appliedFilter.status }),
                  })}>
                  <Icon name="download" size={13} /> {t('common.export')}
                </button>
              </>
            )}
            {attendanceTab === 'myself' && (
              <button className={styles.actionBtn} onClick={() => handleExport()}>
                <Icon name="download" size={13} /> {t('common.export')}
              </button>
            )}
          </div>
        </div>

        {/* ── Myself tab ── */}
        {attendanceTab === 'myself' && (() => {
          const SELF_STATUS: Record<string, { label: string; color: string; bg: string }> = {
            P:     { label: 'Present',     color: '#15803d', bg: '#dcfce7' },
            LT:    { label: 'Late',        color: '#d97706', bg: '#fef3c7' },
            A:     { label: 'Absent',      color: '#dc2626', bg: '#fee2e2' },
            L:     { label: 'Leave',       color: '#dc2626', bg: '#fce7f3' },
            HD_FH: { label: 'Half Day',    color: '#c2410c', bg: '#ffedd5' },
            HD_SH: { label: 'Half Day',    color: '#c2410c', bg: '#ffedd5' },
            WFH:   { label: 'WFH',         color: '#1d4ed8', bg: '#dbeafe' },
            PH:    { label: 'Holiday',     color: '#7c3aed', bg: '#ede9fe' },
            WO:    { label: 'Weekend',     color: '#94a3b8', bg: '#f1f5f9' },
            OT:    { label: 'OT',          color: '#0f766e', bg: '#ccfbf1' },
            PE:    { label: 'PE',          color: '#92400e', bg: '#fef3c7' },
            R:     { label: 'Reg',         color: '#1e40af', bg: '#eff6ff' },
            IC:    { label: 'In progress', color: '#2f6df5', bg: '#eff6ff' },
          };

          const fmtDate = (ds: string) => {
            const d = new Date(ds.split('T')[0] + 'T00:00:00');
            return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
          };

          const fmtHours = (r: AttendanceRecord): string => {
            if (!r.clock_in) return '—';
            if (r.work_hours != null && r.work_hours > 0) {
              const h = Math.floor(r.work_hours);
              const m = Math.round((r.work_hours - h) * 60);
              return m > 0 ? `${h}h ${m}m` : `${h}h`;
            }
            if (r.clock_out) {
              const diff = toMins(r.clock_out) - toMins(r.clock_in);
              return diff > 0 ? fmtMins(diff) : '—';
            }
            return '—';
          };

          const sorted     = [...records].sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
          const total      = sorted.length;
          const totalPages = Math.max(1, Math.ceil(total / myselfPageSize));
          const safePage   = Math.min(myselfPage, totalPages);
          const pageRecs   = sorted.slice((safePage - 1) * myselfPageSize, safePage * myselfPageSize);

          const pageNums: (number | '...')[] = [];
          if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pageNums.push(i);
          } else {
            pageNums.push(1);
            if (safePage > 3) pageNums.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pageNums.push(i);
            if (safePage < totalPages - 2) pageNums.push('...');
            pageNums.push(totalPages);
          }

          const btnStyle = (active: boolean, disabled?: boolean) => ({
            minWidth: 28, height: 28, border: active ? 'none' : '1px solid #e2e8f0',
            borderRadius: 6, background: active ? '#2f6df5' : '#fff',
            color: active ? '#fff' : disabled ? '#cbd5e1' : '#64748b',
            fontSize: 13, fontWeight: active ? 600 : 400,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
          } as React.CSSProperties);

          return loading ? (
            <div className={styles.loadWrap}><Spinner size="md" /></div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[t('attendance.col_date'), t('common.status'), t('attendance.col_in'), t('attendance.col_out'), t('attendance.col_hours')].map(col => (
                      <th key={col} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textAlign: 'left', padding: '0 8px 10px 0', letterSpacing: '0.05em' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRecs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: '#94a3b8' }}>
                        {t('common.no_data')}
                      </td>
                    </tr>
                  ) : pageRecs.map((r, idx) => {
                    const ds      = r.attendance_date.split('T')[0];
                    const isToday = ds === todayDateStr;
                    const isLive  = isToday && !!r.clock_in && !r.clock_out;
                    const liveElapsed = isLive ? (() => {
                      const [h, m] = elapsedSince(r.clock_in, now).split(':').map(Number);
                      return `${h}h ${m}m (live)`;
                    })() : null;
                    const leaveCode = ['L', 'HD_FH', 'HD_SH'].includes(r.status)
                      ? (r.leave_type_code || r.leave_type || r.leave_type_name || '') : '';
                    const base = isLive
                      ? { label: 'In progress', color: '#2f6df5', bg: '#eff6ff' }
                      : (SELF_STATUS[r.status] ?? { label: r.status, color: '#64748b', bg: '#f1f5f9' });
                    const cfg = leaveCode
                      ? { ...base, label: `${base.label} · ${leaveCode.toUpperCase()}` } : base;

                    return (
                      <tr key={r.id ?? `${ds}-${idx}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 8px 10px 0', fontSize: 13, fontWeight: isToday ? 700 : 400, color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {fmtDate(ds)}
                        </td>
                        <td style={{ padding: '10px 8px 10px 0' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px 10px 0', fontSize: 13, color: r.clock_in ? '#2f6df5' : '#94a3b8' }}>
                          {r.clock_in ? fmtTime12(r.clock_in) : '—'}
                        </td>
                        <td style={{ padding: '10px 8px 10px 0', fontSize: 13, color: r.clock_out ? '#2f6df5' : '#94a3b8' }}>
                          {r.clock_out ? fmtTime12(r.clock_out) : '—'}
                        </td>
                        <td style={{ padding: '10px 8px 10px 0', fontSize: 13, fontWeight: isLive ? 600 : 400, color: isLive ? '#0f172a' : '#475569', whiteSpace: 'nowrap' }}>
                          {liveElapsed ?? fmtHours(r)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                  {t('common.rows_per_page')}
                  <select
                    value={myselfPageSize}
                    onChange={e => { setMyselfPageSize(Number(e.target.value)); setMyselfPage(1); }}
                    style={{ fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 4px', color: '#0f172a', background: '#fff' }}
                  >
                    {[10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#64748b', marginRight: 4 }}>
                    {total === 0 ? '0' : `${(safePage - 1) * myselfPageSize + 1}–${Math.min(safePage * myselfPageSize, total)}`} of {total}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setMyselfPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={btnStyle(false, safePage === 1)}>‹</button>
                    {pageNums.map((p, i) =>
                      p === '...'
                        ? <span key={`e${i}`} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '0 2px' }}>…</span>
                        : <button key={p} onClick={() => setMyselfPage(p)} style={btnStyle(p === safePage)}>{p}</button>
                    )}
                    <button onClick={() => setMyselfPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={btnStyle(false, safePage === totalPages)}>›</button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* ── Overall tab (HR only) ── */}
        {attendanceTab === 'overall' && isHrAdmin && (
          <DataTable
            columns={teamColumns as any}
            apiConfig={{
              url: API_ENDPOINTS.ATTENDANCE_LIST,
              method: 'POST',
              params: appliedFilter,
              transformParams: ({ page, pageSize }) => ({
                filter: {
                  sortBy: 'attendance_date', sortOrder: 'asc',
                  from_date: appliedFilter.from_date || todayDateStr,
                  to_date:   appliedFilter.to_date   || todayDateStr,
                  ...(appliedFilter.employee_code  && { employee_code:  appliedFilter.employee_code }),
                  ...(appliedFilter.department_id  && { department_id:  appliedFilter.department_id }),
                  ...(appliedFilter.designation_id && { designation_id: appliedFilter.designation_id }),
                  ...(appliedFilter.status         && { status:         appliedFilter.status }),
                },
                pagination: { page, size: pageSize },
                paginationFlag: true,
              }),
              mapResponse: (res: any) => ({
                data: res?.response?.data ?? [],
                total: res?.response?.meta?.totalRecords ?? res?.response?.totalRecords ?? res?.response?.total ?? 0,
              }),
            }}
            pageSize={10}
          />
        )}
      </Card>

      {/* ── Filter Panel (slides from top) ── */}
      {filterOpen && (
        <>
          <div
            className={`${styles.filterBackdrop} ${filterClosing ? styles.filterBackdropClosing : ''}`}
            onClick={closeFilter}
          />
          <div className={`${styles.filterPanel} ${filterClosing ? styles.filterPanelClosing : ''}`}>

            {/* header — matches card header style */}
            <div className={styles.filterHeader}>
              <Typography variant="h5">{t('common.apply_filters')}</Typography>
              <button className={styles.filterCloseBtn} onClick={closeFilter} aria-label="Close filter">
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* body — 3-column grid */}
            <div className={styles.filterBody}>
              <Input
                type="date"
                label={t('attendance.filter_from')}
                value={filterDraft.from_date}
                onChange={e => setFilterDraft(p => ({ ...p, from_date: e.target.value }))}
              />
              <Input
                type="date"
                label={t('attendance.filter_to')}
                value={filterDraft.to_date}
                min={filterDraft.from_date || undefined}
                onChange={e => setFilterDraft(p => ({ ...p, to_date: e.target.value }))}
              />
              <Input
                type="text"
                label={t('attendance.employee_code')}
                placeholder={t('attendance.employee_code_placeholder')}
                value={filterDraft.employee_code}
                onChange={e => setFilterDraft(p => ({ ...p, employee_code: e.target.value }))}
              />
              <div className={styles.filterSelectWrap}>
                <label className={styles.filterLabel}>{t('attendance.department')}</label>
                <select
                  value={filterDraft.department_id}
                  onChange={e => setFilterDraft(p => ({ ...p, department_id: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">{t('attendance.all_departments')}</option>
                  {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className={styles.filterSelectWrap}>
                <label className={styles.filterLabel}>{t('attendance.designation')}</label>
                <select
                  value={filterDraft.designation_id}
                  onChange={e => setFilterDraft(p => ({ ...p, designation_id: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">{t('attendance.all_designations')}</option>
                  {designations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className={styles.filterSelectWrap}>
                <label className={styles.filterLabel}>{t('common.status')}</label>
                <select
                  value={filterDraft.status}
                  onChange={e => setFilterDraft(p => ({ ...p, status: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">{t('attendance.all_statuses')}</option>
                  {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* footer */}
            <div className={styles.filterFooter}>
              <button
                onClick={handleClearFilter}
                className={styles.actionBtn}
              >
                {t('common.clear')}
              </button>
              <button
                onClick={handleApplyFilter}
                className={`${styles.actionBtn}`}
                style={{ background: '#2f6df5', color: '#fff', borderColor: '#2f6df5' }}
              >
                {t('common.apply_filters')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Clock In Modal */}
      <Modal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        title={t('attendance.clock_in')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
          <Typography variant="body2" color="secondary">
            {t('attendance.clock_in_prompt')}
          </Typography>
          <Textarea
            label={t('attendance.remarks')}
            placeholder={t('attendance.remarks_placeholder')}
            value={clockInRemarks}
            onChange={(e) => setClockInRemarks(e.target.value)}
            rows={3}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setIsClockInModalOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              onClick={performClockIn}
              loading={clockLoading}
              disabled={clockLoading || !clockInRemarks.trim()}
            >
              {t('attendance.confirm_clock_in')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
