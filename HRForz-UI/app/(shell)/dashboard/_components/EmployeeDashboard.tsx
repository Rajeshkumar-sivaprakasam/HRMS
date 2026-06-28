'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Greeting } from './Greeting';
import { AttendanceCard } from './AttendanceCard';
import { LeaveBalanceCard } from './LeaveBalanceCard';
import { StatsGrid } from './StatsGrid';
import { AnnouncementsList, WhosOutTodayList, UpcomingHolidaysList, BirthdaysList } from './BottomWidgets';
import { dashboardApi } from '@/lib/api';
import { EmployeeSummary, EmployeeSummaryApiResponse, Announcement, WhosOutToday, Holiday, Birthday } from '@/lib/types/dashboard';
import { Spinner, useToast } from '@/components';
import { RegulariseModal } from './RegulariseModal';
import { EmptyState } from './EmptyState';
import { ClockInModal } from './ClockInModal';
import { Modal, Button } from '@/components';

export const EmployeeDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [whosOut, setWhosOut] = useState<WhosOutToday[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [showRegulariseModal, setShowRegulariseModal] = useState(false);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [attendanceRecordId, setAttendanceRecordId] = useState<string>('');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [now, setNow] = useState(new Date());
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      const userName = typeof window !== 'undefined' ? localStorage.getItem('hrforz_user_name') : '';

      // Fetch Holidays
      try {
        const holidaysRes = await dashboardApi.getHolidays(2026);
        if (holidaysRes && holidaysRes.response) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); 

          const formattedHolidays: Holiday[] = holidaysRes.response
            .sort((a: any, b: any) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
            .map((h: any) => {
              const hDate = new Date(h.holiday_date);
              return {
                id: h.id || Math.random().toString(),
                date: hDate.getDate().toString().padStart(2, '0'),
                day: hDate.toLocaleDateString('en-US', { weekday: 'short' }),
                month: hDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                name: h.name,
                type: h.holiday_type_name || 'Public holiday',
                rawDate: h.holiday_date
              };
            });
          setHolidays(formattedHolidays);
        } else {
          setHolidays([]);
        }
      } catch (error) {
        setHolidays([]);
      }

      // Fetch Announcements
      try {
        const announcementsRes = await dashboardApi.getAnnouncements();
        if (announcementsRes && announcementsRes.response) {
          const now = new Date();
          const realAnnouncements: Announcement[] = announcementsRes.response.map((a: any) => {
            const pubDate = new Date(a.published_at);
            const diffMs = now.getTime() - pubDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            let time_ago = 'Recently';
            if (diffDays === 0) time_ago = 'Today';
            else if (diffDays === 1) time_ago = 'Yesterday';
            else time_ago = `${diffDays}d ago`;

            let type: 'policy' | 'event' | 'hiring' = 'event';
            const titleLower = a.title.toLowerCase();
            if (titleLower.includes('policy') || titleLower.includes('wfh')) type = 'policy';
            if (titleLower.includes('join') || titleLower.includes('hiring')) type = 'hiring';

            return {
              id: a.id,
              title: a.title,
              author: 'HR Team',
              time_ago,
              type,
              is_pinned: a.is_pinned
            };
          });
          setAnnouncements(realAnnouncements);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        setAnnouncements([]);
      }

      // Fetch Birthdays
      try {
        const birthdaysRes = await dashboardApi.getBirthdays();
        if (birthdaysRes && birthdaysRes.response) {
          const realBirthdays: Birthday[] = birthdaysRes.response.map((b: any) => {
            const bDate = new Date(b.birthday_date);
            return {
              id: b.id,
              name: b.employee_name,
              role: b.designation || 'Team Member',
              date: bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              avatar: b.profile_picture
            };
          });
          setBirthdays(realBirthdays);
        } else {
          setBirthdays([]);
        }
      } catch (error) {
        setBirthdays([]);
      }

      // Fetch Who's Out Today
      try {
        const whosOutRes = await dashboardApi.getWhosOut();
        if (whosOutRes && whosOutRes.response) {
          const realWhosOut: WhosOutToday[] = whosOutRes.response.map((p: any, idx: number) => ({
            id: p.id || p.employee_id || `out-${idx}-${p.employee_name}`,
            name: p.employee_name,
            role: p.designation || 'Team Member',
            status: p.status || 'on_leave',
            avatar: p.profile_picture
          }));
          setWhosOut(realWhosOut);
        } else {
          setWhosOut([]);
        }
      } catch (error) {
        setWhosOut([]);
      }

      const formatApiTime = (isoString: string | null) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
          return isoString;
        }
      };

      const formatApiDate = (isoString: string | null) => {
        const date = isoString ? new Date(isoString) : new Date();
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      };

      const formatWorkHours = (hours: number | null) => {
        if (hours === null || hours === undefined) return '0h 0m';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
      };

      const mapApiResponseToSummary = (apiData: EmployeeSummaryApiResponse): EmployeeSummary => {
        const res = apiData.response;
        const isClockedIn = res.today_attendance.status === 'P';
        const clockInIso = res.today_attendance.clock_in;
        
        return {
          greeting: {
            message: apiData.message === 'Success' ? 'Good afternoon' : 'Hello',
            name: typeof window !== 'undefined' ? localStorage.getItem('hrforz_user_name')?.split(' ')[0] || 'Aarav' : 'Aarav', 
            status: isClockedIn ? 'clocked_in' : 'clocked_out',
            clock_in_time: formatApiTime(clockInIso),
            clock_in_raw: clockInIso
          },
          attendance: {
            today: {
              date: formatApiDate(clockInIso),
              current_time: formatApiTime(res.today_attendance.clock_out || clockInIso || new Date().toISOString()),
              status: isClockedIn ? 'clocked_in' : 'clocked_out',
              worked_hours: formatWorkHours(res.today_attendance.work_hours),
              total_hours_goal: `${res.work_hours.target_hours}h 0m`,
              progress_percent: res.today_attendance.work_hours ? Math.min(100, Math.round((res.today_attendance.work_hours / res.work_hours.target_hours) * 100)) : 0
            },
            timeline: [
              { 
                id: '1', 
                type: 'clock_in', 
                time: formatApiTime(clockInIso).split(' ')[0], 
                status: clockInIso ? 'completed' : 'pending' 
              },
              { 
                id: '2', 
                type: 'clock_out', 
                time: formatApiTime(res.today_attendance.clock_out).split(' ')[0], 
                status: res.today_attendance.clock_out ? 'completed' : 'pending' 
              },
            ]
          },
          leave_balance: res.leave_balances
            .filter(lb => lb.leave_type.trim().toUpperCase() !== 'WFH')
            .map(lb => ({
              type: lb.leave_type,
              label: lb.leave_type === 'CL' ? 'Casual leave' : lb.leave_type === 'SL' ? 'Sick leave' : lb.leave_type,
              used: lb.taken,
              total: lb.entitled,
              color: lb.leave_type === 'CL' ? '#16a34a' : lb.leave_type === 'SL' ? '#f59e0b' : '#7c3aed'
            })),
          stats: {
            this_month: {
              days: res.monthly_attendance.days_attended,
              diff_label: `${res.monthly_attendance.mom_diff > 0 ? '+' : ''}${res.monthly_attendance.mom_diff}d vs prev month`
            },
            avg_work_hours: {
              hours: (() => {
                const val = res.work_hours.avg_hours.toString();
                if (val.includes('.')) {
                  const [h, m] = val.split('.');
                  return `${h}h ${m}min`;
                }
                return `${val}h 0min`;
              })(),
              status: res.work_hours.on_track ? 'on_track' : 'behind',
              target: `${res.work_hours.target_hours}h 0min`
            },
            lop_days: res.lop_days,
            pending_requests: {
              total: res.pending_requests.total,
              breakdown: `${res.pending_requests.leaves} leave · ${res.pending_requests.regularisations} regularisation`
            }
          }
        };
      };

      // Actual API call
      try {
        const apiSummary = await dashboardApi.getSummary().catch(() => ({
          response: {
            today_attendance: { status: 'clocked_out', clock_in: null, clock_out: null, work_hours: 0 },
            work_hours: { worked_hours: 0, target_hours: 9, percentage: 0 },
            leave_balances: [],
            monthly_attendance: { days_attended: 0, mom_diff: 0 },
            pending_requests: { total: 0, leaves: 0, regularisations: 0 }
          },
          message: 'Error'
        }));
        const summaryData = apiSummary?.response || apiSummary?.data || apiSummary;
        
        if (summaryData && (summaryData.today_attendance || summaryData.monthly_attendance)) {
          const mappedSummary = mapApiResponseToSummary({ ...apiSummary, response: summaryData });
          
          // Fetch Today's Attendance separately for button status
          try {
            const attendanceRes = await dashboardApi.getTodayAttendance();
            const att = attendanceRes?.response || attendanceRes?.data || attendanceRes;
            if (att && (att.status || att.id || att.uuid)) {
                const isAttClockedIn = att.status === 'clocked_in' || att.status === 'P' || att.status === 'present' || (att.clock_in && !att.clock_out);
                mappedSummary.attendance.today.status = isAttClockedIn ? 'clocked_in' : 'clocked_out';
                mappedSummary.attendance.today.worked_hours = formatWorkHours(att.work_hours);
                mappedSummary.greeting.status = isAttClockedIn ? 'clocked_in' : 'clocked_out';
                mappedSummary.greeting.clock_in_time = formatApiTime(att.clock_in);
                mappedSummary.greeting.clock_in_raw = att.clock_in;
                
                // Store the attendance record ID for regularisation
                const recordId = att.attendance_record_id || att.id || att.uuid || att.attendance_id;
                if (recordId) setAttendanceRecordId(recordId);
            }
          } catch (err) {
            console.warn('Failed to fetch specialized today attendance:', err);
          }
          
          setSummary(mappedSummary);
        } else {
          setSummary(null);
        }
      } catch (apiError) {
        setSummary(null);
      }

    } finally {
      setLoading(false);
    }
  };

  const formatTimeForInput = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async (remarks: string) => {
    setClockInLoading(true);
    try {
      const res = await dashboardApi.clockIn({ method: 'web_portal', remarks });
      const recordId = res.response?.attendance_record_id || res.response?.id || res.response?.uuid;
      if (recordId) setAttendanceRecordId(recordId);
      
      // Immediate UI update
      const nowTime = new Date();
      setSummary(prev => prev ? ({
        ...prev,
        greeting: { 
          ...prev.greeting, 
          status: 'clocked_in', 
          clock_in_raw: nowTime.toISOString(),
          clock_in_time: nowTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        },
        attendance: { 
          ...prev.attendance, 
          today: { ...prev.attendance.today, status: 'clocked_in' } 
        }
      }) : null);

      addToast({ variant: 'success', title: 'Success', message: 'Clocked in successfully!' });
      setShowClockInModal(false);
      fetchData();
    } catch (error) {
      console.error('Clock in failed:', error);
      addToast({ variant: 'error', title: 'Error', message: 'Failed to clock in.' });
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await dashboardApi.clockOut({ method: 'web_portal', remarks: 'Clocked out via web portal' });
      const recordId = res.response?.attendance_record_id || res.response?.id || res.response?.uuid;
      if (recordId) setAttendanceRecordId(recordId);

      addToast({ variant: 'success', title: 'Success', message: 'Clocked out successfully!' });
      fetchData();
    } catch (error) {
      console.error('Clock out failed:', error);
      addToast({ variant: 'error', title: 'Error', message: 'Failed to clock out.' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const emptySummary: EmployeeSummary = {
    greeting: { message: 'Hello', name: typeof window !== 'undefined' ? localStorage.getItem('hrforz_user_name') || '' : '', status: 'clocked_out' },
    attendance: {
      today: { date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), current_time: '--:--', status: 'clocked_out', worked_hours: '0h 0m', total_hours_goal: '0h 0m', progress_percent: 0 },
      timeline: []
    },
    leave_balance: [],
    stats: {
      this_month: { days: 0, diff_label: '0d vs prev month' },
      avg_work_hours: { hours: '0h 0m', status: 'behind', target: '0h 0m' },
      lop_days: 0,
      pending_requests: { total: 0, breakdown: '0 leave · 0 regularisation' }
    }
  };

  const displaySummary = summary || emptySummary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Greeting 
        name={displaySummary.greeting.name} 
        statusMessage={displaySummary.greeting.clock_in_time ? `${displaySummary.attendance.today.date} · You're clocked in since ${displaySummary.greeting.clock_in_time}` : displaySummary.attendance.today.date} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 20 }}>
        <AttendanceCard 
          date={displaySummary.attendance.today.date}
          currentTime={(() => {
            if (displaySummary.attendance.today.status !== 'clocked_in' || !displaySummary.greeting.clock_in_raw) {
              return '00:00:00';
            }
            const start = new Date(displaySummary.greeting.clock_in_raw);
            const diffMs = now.getTime() - start.getTime();
            const diffSec = Math.max(0, Math.floor(diffMs / 1000));
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            const p = (n: number) => String(n).padStart(2, '0');
            return `${p(h)}:${p(m)}:${p(s)}`;
          })()}
          isClockedIn={displaySummary.attendance.today.status === 'clocked_in'}
          workedTime={(() => {
            if (displaySummary.attendance.today.status !== 'clocked_in' || !displaySummary.greeting.clock_in_raw) {
              return displaySummary.attendance.today.worked_hours;
            }
            const start = new Date(displaySummary.greeting.clock_in_raw);
            const diffMs = now.getTime() - start.getTime();
            const diffSec = Math.max(0, Math.floor(diffMs / 1000));
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            return `${h}h ${m}m`;
          })()}
          goalTime={displaySummary.attendance.today.total_hours_goal}
          progress={(() => {
            if (displaySummary.attendance.today.status !== 'clocked_in' || !displaySummary.greeting.clock_in_raw) {
              return displaySummary.attendance.today.progress_percent;
            }
            const start = new Date(displaySummary.greeting.clock_in_raw);
            const diffMs = now.getTime() - start.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const targetHours = parseInt(displaySummary.attendance.today.total_hours_goal) || 8.5;
            return Math.min(100, Math.round((diffHours / targetHours) * 100));
          })()}
          timeline={displaySummary.attendance.timeline}
          onClockIn={() => setShowClockInModal(true)}
          onClockOut={handleClockOut}
          onRegularise={() => setShowRegulariseModal(true)}
        />
        {summary && summary.leave_balance.length > 0 && (
          <LeaveBalanceCard 
            balances={summary.leave_balance} 
            onApply={() => router.push('/leave')}
            onViewDetails={() => router.push('/leave')}
          />
        )}
      </div>

      <RegulariseModal 
        isOpen={showRegulariseModal} 
        onClose={() => setShowRegulariseModal(false)}
        attendanceRecordId={attendanceRecordId}
        defaultClockIn={formatTimeForInput(summary?.greeting.clock_in_raw || null)}
        onSuccess={() => window.location.reload()}
      />

      <StatsGrid stats={{
        thisMonth: displaySummary.stats.this_month,
        avgHours: displaySummary.stats.avg_work_hours,
        lopDays: displaySummary.stats.lop_days,
        pending: displaySummary.stats.pending_requests
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <AnnouncementsList items={announcements} />
        <WhosOutTodayList items={whosOut} />
      </div>

      <ClockInModal 
        isOpen={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        onConfirm={handleClockIn}
        loading={clockInLoading}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        <UpcomingHolidaysList 
          items={holidays.filter(h => h.rawDate && new Date(h.rawDate).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5)} 
          onCalendarClick={() => setShowHolidayModal(true)}
        />
        <BirthdaysList items={birthdays} />
      </div>

      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title="Company Holidays"
        showCloseButton={true}
      >
        <div style={{ padding: '0 8px 12px 8px' }}>
          <div 
            className="holiday-list-container"
            style={{ 
              maxHeight: '500px', 
              overflowY: 'auto', 
              paddingRight: '8px',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            <style>{`
              .holiday-list-container::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {holidays.map((hol, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 0',
                borderBottom: idx === holidays.length - 1 ? 'none' : '1px solid #f1f5f9'
              }}>
                <div style={{ 
                  background: '#eff6ff', 
                  padding: '6px', 
                  borderRadius: '10px', 
                  minWidth: '46px', 
                  height: '46px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '1px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2f6df5', lineHeight: 1 }}>{hol.date}</div>
                  <div style={{ fontSize: '9px', color: '#2f6df5', textTransform: 'uppercase', fontWeight: '800', lineHeight: 1 }}>{hol.month}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '1px' }}>{hol.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{hol.day} · {hol.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
