'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Spinner, Button, Icon, useToast, ConfirmModal, Modal } from '@/components';
import { 
  WorkforceOverview, AttendancePulse, PendingApprovals, 
  DepartmentHeadcount, HRAnnouncementsList, HRHelpdeskTickets 
} from './HRWidgets';
import { UpcomingHolidaysList, BirthdaysList } from './BottomWidgets';
import { PublishAnnouncementModal } from './PublishAnnouncementModal';
import { Greeting } from './Greeting';
import { AttendanceCard } from './AttendanceCard';
import { LeaveBalanceCard } from './LeaveBalanceCard';
import { EmptyState } from './EmptyState';
import { ClockInModal } from './ClockInModal';
import { 
  WorkforceStats, AttendanceTrend, PendingApproval, 
  DeptHeadcount, HelpdeskTicket, Announcement, Holiday, Birthday, HRDashboardSummary,
  EmployeeSummary, EmployeeSummaryApiResponse
} from '@/lib/types/dashboard';
import { dashboardApi } from '@/lib/api';

export const HRDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [annToBeEdited, setAnnToBeEdited] = useState<Announcement | null>(null);
  const [annToBeDeleted, setAnnToBeDeleted] = useState<Announcement | null>(null);
  const [isDeletingAnn, setIsDeletingAnn] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PendingApproval | null;
    action: 'approve' | 'reject' | null;
  }>({ isOpen: false, item: null, action: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [summary, setSummary] = useState<HRDashboardSummary | null>(null);
  const [personalSummary, setPersonalSummary] = useState<EmployeeSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [trendResData, setTrendResData] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [deptHeadcount, setDeptHeadcount] = useState<DeptHeadcount[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [attendanceRecordId, setAttendanceRecordId] = useState<string>('');
  const [now, setNow] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        summaryRes, 
        annRes, 
        holRes, 
        bdayRes, 
        trendRes, 
        headcountRes, 
        approvalsRes, 
        ticketsRes
      ] = await Promise.all([
        dashboardApi.getHRSummary().catch(() => ({ 
          response: { 
            total_employees: 0, 
            present_today: 0, 
            absent_today: 0, 
            on_leave_today: 0, 
            pending_leaves: 0, 
            open_tickets: 0, 
            new_joiners_this_month: 0 
          } 
        })),
        dashboardApi.getAnnouncements().catch(() => ({ response: [] })),
        dashboardApi.getHolidays().catch(() => ({ response: [] })),
        dashboardApi.getBirthdays().catch(() => ({ response: [] })),
        dashboardApi.getAttendanceTrend().catch(() => ({ response: { trend: [], stats: {} } })),
        dashboardApi.getDeptHeadcount().catch(() => ({ response: [] })),
        dashboardApi.getPendingApprovals().catch(() => ({ response: [] })),
        dashboardApi.getOpenTickets().catch(() => ({ response: [] }))
      ]);

      if (summaryRes?.response) {
        setSummary(summaryRes.response);
      }

      if (annRes?.response && Array.isArray(annRes.response)) {
        const formattedAnnouncements = annRes.response.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          author: 'HR Team',
          time_ago: 'Recently',
          type: a.title.toLowerCase().includes('policy') ? 'policy' : a.title.toLowerCase().includes('event') ? 'event' : 'general',
          is_pinned: a.is_pinned
        }));
        setAnnouncements(formattedAnnouncements);
      }

      if (holRes?.response && Array.isArray(holRes.response)) {
        const formattedHolidays = holRes.response.map((h: any) => {
          const dateObj = new Date(h.holiday_date);
          return {
            id: h.id,
            name: h.name,
            date: dateObj.getDate().toString().padStart(2, '0'),
            month: dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
            day: dateObj.toLocaleString('en-US', { weekday: 'short' }),
            type: h.holiday_type_name || 'Public holiday',
            rawDate: h.holiday_date
          };
        });
        setHolidays(formattedHolidays);
      }

      if (bdayRes?.response && Array.isArray(bdayRes.response)) {
        const formattedBirthdays = bdayRes.response.map((b: any) => {
          const bDate = new Date(b.birthday_date);
          return {
            id: b.id,
            name: b.employee_name,
            role: b.designation || 'Team Member',
            date: bDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            avatar: b.profile_picture
          };
        });
        setBirthdays(formattedBirthdays);
      }

      if (trendRes?.response) {
        setTrendResData(trendRes.response);
        if (Array.isArray(trendRes.response.trend)) {
          const formattedTrend = trendRes.response.trend.map((t: any) => ({
            date: new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            present: t.present_count,
            late: t.late_count,
            absent: t.absent_count
          }));
          setAttendanceTrend(formattedTrend);
        }
      }

      if (headcountRes?.response && Array.isArray(headcountRes.response)) {
        const formattedHeadcount = headcountRes.response.map((d: any) => ({
          name: d.department_name,
          count: d.total_employees,
          diff: d.growth_this_month
        }));
        setDeptHeadcount(formattedHeadcount);
      }

      if (approvalsRes?.response && Array.isArray(approvalsRes.response)) {
        const formattedApprovals = approvalsRes.response.map((a: any) => ({
          id: a.id,
          employee_name: a.employee_name,
          avatar: a.avatar_url,
          type: a.request_type,
          duration: a.duration,
          date: a.date_range
        }));
        setPendingApprovals(formattedApprovals);
      }

      if (ticketsRes?.response && Array.isArray(ticketsRes.response)) {
        const formattedTickets = ticketsRes.response.map((t: any) => ({
          id: t.ticket_number || t.ticket_id,
          title: t.title,
          priority: t.priority as any,
          status: t.status,
          requester: t.requester_name
        }));
        setTickets(formattedTickets);
      }

    } catch (error) {
      console.error('Error fetching HR dashboard data:', error);
    }

    // Fetch personal summary for the HR user themselves
    try {
      const apiSummary = await dashboardApi.getSummary().catch(() => ({
        response: {
          today_attendance: { status: 'clocked_out', clock_in: null, clock_out: null, work_hours: 0 },
          work_hours: { worked_hours: 0, target_hours: 9, percentage: 0 },
          leave_balance: [],
          announcements: []
        }
      }));
      const summaryData = apiSummary?.response || apiSummary?.data || apiSummary;
      
      if (summaryData) {
        // Reuse mapping logic or simplify
        const formatApiTime = (isoString: string | null) => {
          if (!isoString) return '';
          try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          } catch (e) { return isoString; }
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

        const isClockedIn = summaryData.today_attendance.status === 'P' || summaryData.today_attendance.status === 'clocked_in';
        const clockInIso = summaryData.today_attendance.clock_in;

        const mapped: EmployeeSummary = {
          greeting: {
            message: 'Hello',
            name: typeof window !== 'undefined' ? localStorage.getItem('hrforz_user_name')?.split(' ')[0] || '' : '',
            status: isClockedIn ? 'clocked_in' : 'clocked_out',
            clock_in_time: formatApiTime(clockInIso),
            clock_in_raw: clockInIso
          },
          attendance: {
            today: {
              date: formatApiDate(clockInIso),
              current_time: formatApiTime(summaryData.today_attendance.clock_out || clockInIso || new Date().toISOString()),
              status: isClockedIn ? 'clocked_in' : 'clocked_out',
              worked_hours: formatWorkHours(summaryData.today_attendance.work_hours),
              total_hours_goal: `${summaryData.work_hours.target_hours}h 0m`,
              progress_percent: summaryData.today_attendance.work_hours ? Math.min(100, Math.round((summaryData.today_attendance.work_hours / summaryData.work_hours.target_hours) * 100)) : 0
            },
            timeline: [
              { id: '1', type: 'clock_in', time: formatApiTime(clockInIso).split(' ')[0], status: clockInIso ? 'completed' : 'pending' },
              { id: '2', type: 'clock_out', time: formatApiTime(summaryData.today_attendance.clock_out).split(' ')[0], status: summaryData.today_attendance.clock_out ? 'completed' : 'pending' },
            ]
          },
          leave_balance: summaryData.leave_balances
            .filter((lb: any) => lb.leave_type.trim().toUpperCase() !== 'WFH')
            .map((lb: any) => ({
              type: lb.leave_type,
              label: lb.leave_type === 'CL' ? 'Casual leave' : lb.leave_type === 'SL' ? 'Sick leave' : lb.leave_type,
              used: lb.taken,
              total: lb.entitled,
              color: lb.leave_type === 'CL' ? '#16a34a' : lb.leave_type === 'SL' ? '#f59e0b' : '#7c3aed'
            })),
          stats: {
            this_month: { days: 0, diff_label: '' },
            avg_work_hours: { hours: '', status: 'on_track', target: '' },
            lop_days: 0,
            pending_requests: { total: 0, breakdown: '' }
          }
        };

        setPersonalSummary(mapped);
        
        // Fetch specific attendance for status
        try {
          const attendanceRes = await dashboardApi.getTodayAttendance();
          const att = attendanceRes?.response || attendanceRes;
          if (att && (att.status || att.clock_in)) {
            const isAttClockedIn = att.status === 'clocked_in' || att.status === 'P' || att.status === 'present' || (att.clock_in && !att.clock_out);
            setPersonalSummary(prev => prev ? ({
              ...prev,
              greeting: { 
                ...prev.greeting, 
                status: isAttClockedIn ? 'clocked_in' : 'clocked_out', 
                clock_in_time: formatApiTime(att.clock_in),
                clock_in_raw: att.clock_in
              },
              attendance: { 
                ...prev.attendance, 
                today: { 
                  ...prev.attendance.today, 
                  status: isAttClockedIn ? 'clocked_in' : 'clocked_out', 
                  worked_hours: formatWorkHours(att.work_hours) 
                } 
              }
            }) : null);
            const recordId = att.attendance_record_id || att.id || att.uuid;
            if (recordId) setAttendanceRecordId(recordId);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to fetch personal summary for HR:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleApprovalAction = (item: PendingApproval, action: 'approve' | 'reject') => {
    setRejectionReason('');
    setConfirmModal({ isOpen: true, item, action });
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setAnnToBeEdited(ann);
    setShowPublishModal(true);
  };

  const handleDeleteAnnouncement = (ann: Announcement) => {
    setAnnToBeDeleted(ann);
  };

  const handleClockIn = async (remarks: string) => {
    setClockInLoading(true);
    try {
      await dashboardApi.clockIn({ method: 'web_portal', remarks });
      
      // Immediate UI update for the HR user themselves
      const nowTime = new Date();
      setPersonalSummary(prev => prev ? ({
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
      addToast({ variant: 'error', title: 'Error', message: 'Failed to clock in.' });
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      await dashboardApi.clockOut({ method: 'web_portal', remarks: 'Clocked out via web portal' });
      addToast({ variant: 'success', title: 'Success', message: 'Clocked out successfully!' });
      fetchData();
    } catch (error) {
      addToast({ variant: 'error', title: 'Error', message: 'Failed to clock out.' });
    }
  };

  const processDeleteAnnouncement = async () => {
    if (!annToBeDeleted) return;
    setIsDeletingAnn(true);
    try {
      await dashboardApi.deleteAnnouncement(annToBeDeleted.id);
      addToast({ variant: 'success', title: 'Deleted', message: 'Announcement deleted successfully.' });
      fetchData();
    } catch (error) {
      console.error('Delete announcement failed:', error);
      addToast({ variant: 'error', title: 'Error', message: 'Failed to delete announcement.' });
    } finally {
      setIsDeletingAnn(false);
      setAnnToBeDeleted(null);
    }
  };

  const processApproval = async () => {
    if (!confirmModal.item || !confirmModal.action) return;
    
    setConfirmLoading(true);
    try {
      const { id, type } = confirmModal.item;
      const isReject = confirmModal.action === 'reject';

      if (type.toLowerCase().includes('leave')) {
        await dashboardApi.approveLeave(id, isReject ? 'rejected' : 'approved', isReject ? rejectionReason : undefined);
      } else if (type.toLowerCase().includes('regularisation')) {
        await dashboardApi.approveRegularisation(id, isReject ? 'rejected' : 'approved');
      }

      addToast({
        variant: 'success',
        title: isReject ? 'Request Rejected' : 'Request Approved',
        message: `The ${type} request from ${confirmModal.item?.employee_name} has been processed.`
      });

      // Re-fetch data without full reload
      fetchData(); 
    } catch (error) {
      console.error('Error processing approval:', error);
      addToast({
        variant: 'error',
        title: 'Action Failed',
        message: 'Could not process the approval request. Please try again.'
      });
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ isOpen: false, item: null, action: null });
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Transform HR Summary to WorkforceStats
  const stats: WorkforceStats = {
    headcount: { 
      total: summary?.total_employees ?? 0, 
      diff_this_month: summary?.new_joiners_this_month ?? 0 
    },
    present_today: { 
      count: summary?.present_today ?? 0, 
      total: summary?.total_employees ?? 0,
      percentage: summary?.total_employees ? Math.round((summary.present_today / summary.total_employees) * 100) : 0
    },
    on_leave: { 
      total: summary?.pending_leaves ?? 0, 
      sick: 0, 
      casual: 0 
    }
  };

  const attendanceStats = trendResData?.stats ? {
    avg_in_time: '09:18', // Default as it's missing from current API snippet
    avg_work_hours: trendResData.stats.average_work_hours ? `${Math.floor(trendResData.stats.average_work_hours)}h ${Math.round((trendResData.stats.average_work_hours % 1) * 60)}m` : '0h 0m',
    total_late_arrivals: trendResData.stats.total_late_arrivals,
    missed_clock_out_count: trendResData.stats.missed_clock_out_count
  } : null;
  const attendanceTrendData = attendanceTrend;

  // Fallback for tickets if API is empty
  const displayTickets: HelpdeskTicket[] = tickets.length > 0 ? tickets : [
    { 
      id: 'TK-2041', 
      title: `${summary?.open_tickets || 0} open tickets require attention`, 
      priority: 'high', 
      requester: 'System', 
      status: 'Open' 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Heading level="h2" style={{ marginBottom: 4 }}>Workforce overview</Heading>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {summary?.total_employees || 0} active employees · {summary?.pending_leaves || 0} pending approvals
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => router.push('/employees/add-new')}>
          <Icon name="plus" size="sm" /> Add employee
        </Button>
      </div>

      {personalSummary && (
        <>
          <Greeting 
            name={personalSummary.greeting.name} 
            statusMessage={personalSummary.greeting.clock_in_time ? `${personalSummary.attendance.today.date} · You're clocked in since ${personalSummary.greeting.clock_in_time}` : personalSummary.attendance.today.date} 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 20 }}>
            <AttendanceCard 
              date={personalSummary.attendance.today.date}
              currentTime={(() => {
                if (personalSummary.attendance.today.status !== 'clocked_in' || !personalSummary.greeting.clock_in_raw) {
                  return '00:00:00';
                }
                const start = new Date(personalSummary.greeting.clock_in_raw);
                const diffMs = now.getTime() - start.getTime();
                const diffSec = Math.max(0, Math.floor(diffMs / 1000));
                const h = Math.floor(diffSec / 3600);
                const m = Math.floor((diffSec % 3600) / 60);
                const s = diffSec % 60;
                const p = (n: number) => String(n).padStart(2, '0');
                return `${p(h)}:${p(m)}:${p(s)}`;
              })()}
              isClockedIn={personalSummary.attendance.today.status === 'clocked_in'}
              workedTime={(() => {
                if (personalSummary.attendance.today.status !== 'clocked_in' || !personalSummary.greeting.clock_in_raw) {
                  return personalSummary.attendance.today.worked_hours;
                }
                const start = new Date(personalSummary.greeting.clock_in_raw);
                const diffMs = now.getTime() - start.getTime();
                const diffSec = Math.max(0, Math.floor(diffMs / 1000));
                const h = Math.floor(diffSec / 3600);
                const m = Math.floor((diffSec % 3600) / 60);
                return `${h}h ${m}m`;
              })()}
              goalTime={personalSummary.attendance.today.total_hours_goal}
              progress={(() => {
                if (personalSummary.attendance.today.status !== 'clocked_in' || !personalSummary.greeting.clock_in_raw) {
                  return personalSummary.attendance.today.progress_percent;
                }
                const start = new Date(personalSummary.greeting.clock_in_raw);
                const diffMs = now.getTime() - start.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                const targetHours = parseInt(personalSummary.attendance.today.total_hours_goal) || 8.5;
                return Math.min(100, Math.round((diffHours / targetHours) * 100));
              })()}
              timeline={personalSummary.attendance.timeline}
              onClockIn={() => setShowClockInModal(true)}
              onClockOut={handleClockOut}
              onRegularise={() => router.push('/attendance')}
            />
            {personalSummary.leave_balance.length > 0 && (
              <LeaveBalanceCard 
                balances={personalSummary.leave_balance} 
                onApply={() => router.push('/leave')}
                onViewDetails={() => router.push('/leave')}
              />
            )}
          </div>
        </>
      )}

      <WorkforceOverview stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <AttendancePulse data={attendanceTrend} stats={attendanceStats} />
        <PendingApprovals items={pendingApprovals} onAction={handleApprovalAction} />
      </div>

      <DepartmentHeadcount departments={deptHeadcount} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <UpcomingHolidaysList 
          items={holidays.filter(h => h.rawDate && new Date(h.rawDate).getTime() >= new Date().setHours(0,0,0,0)).slice(0, 5)} 
          onCalendarClick={() => setShowHolidayModal(true)} 
        />
        <BirthdaysList items={birthdays} />
      </div>

      <ClockInModal 
        isOpen={showClockInModal}
        onClose={() => setShowClockInModal(false)}
        onConfirm={handleClockIn}
        loading={clockInLoading}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <HRAnnouncementsList 
          items={announcements} 
          onPublish={() => {
            setAnnToBeEdited(null);
            setShowPublishModal(true);
          }} 
          onEdit={handleEditAnnouncement}
          onDelete={handleDeleteAnnouncement}
        />
        <HRHelpdeskTickets 
          items={displayTickets} 
          onViewAll={() => router.push('/helpdesk')}
        />
      </div>

      <PublishAnnouncementModal 
        isOpen={showPublishModal} 
        onClose={() => {
          setShowPublishModal(false);
          setAnnToBeEdited(null);
        }}
        onSuccess={() => fetchData()}
        editingItem={annToBeEdited}
      />

      <ConfirmModal 
        isOpen={!!annToBeDeleted}
        onClose={() => setAnnToBeDeleted(null)}
        onConfirm={processDeleteAnnouncement}
        loading={isDeletingAnn}
        variant="danger"
        title="Delete Announcement"
        message={`Are you sure you want to delete "${annToBeDeleted?.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={processApproval}
        loading={confirmLoading}
        title={confirmModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
        message={`Are you sure you want to ${confirmModal.action} this ${confirmModal.item?.type} request from ${confirmModal.item?.employee_name}?`}
        variant={confirmModal.action === 'approve' ? 'success' : 'danger'}
        confirmText={confirmModal.action === 'approve' ? 'Approve' : 'Reject'}
        showReasonInput={true}
        reasonValue={rejectionReason}
        onReasonChange={setRejectionReason}
        reasonPlaceholder="Please provide a reason for rejection..."
      />

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
