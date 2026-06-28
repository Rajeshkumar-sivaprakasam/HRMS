'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Typography, Icon, ProgressBar, Spinner, DataTable } from '@/components';
import { leavesApi, holidaysApi, LeaveRequest, LeaveBalance, Holiday, LeaveStatus } from '@/lib/api';
import { useToast } from '@/components/Toast/Toast';
import { useTranslation } from '@/lib/i18n';
import { ApplyLeaveModal } from '../(shell)/leave/_components/ApplyLeaveModal';
import { HolidayModal } from '../(shell)/leave/_components/HolidayModal';
import styles from '../(shell)/leave/leave.module.scss';

type LeaveStatusFilter = LeaveStatus | 'all';

interface ListingRequestBody {
  filter: {
    status?: LeaveStatus | null;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    size: number;
  };
  paginationFlag: boolean;
}

const LEAVE_TYPE_NAMES: Record<string, string> = {
  'CL': 'Casual Leave',
  'SL': 'Sick Leave',
  'LOP': 'Loss of Pay',
  'WFH': 'Work From Home',
};

const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string; progress: string }> = {
  'CL': { bg: '#f0fdf4', text: '#166534', progress: '#16a34a' },
  'SL': { bg: '#fef3c7', text: '#92400e', progress: '#f59e0b' },
  'LOP': { bg: '#fee2e2', text: '#991b1b', progress: '#dc2626' },
  'WFH': { bg: '#eff6ff', text: '#1e40af', progress: '#3b82f6' },
};

const STATUS_STYLES: Record<LeaveStatusFilter, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  approved: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#e5e7eb', text: '#374151' },
  all: { bg: '#f3f4f6', text: '#374151' },
};

const HR_TABS = ['My Leaves', 'All Requests', 'Holidays'];

export default function LeaveSection() {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [role, setRole] = useState('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // State for employee view
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // State for HR view
  const [hrTab, setHrTab] = useState<string>('My Leaves');
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [allRequestsTotal, setAllRequestsTotal] = useState(0);

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    const storedRole = localStorage.getItem('hrforz_role') || 'employee';
    const storedEmployeeId = localStorage.getItem('hrforz_employee_id') || '';
    setRole(storedRole);
    setEmployeeId(storedEmployeeId);
  }, []);

  const isHRAdmin = useMemo(() => role === 'hr_admin', [role]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await leavesApi.getBalances(employeeId, currentYear);
      const data = res?.response?.data ?? res?.response ?? [];
      setBalances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch balances', error);
    }
  }, [employeeId, currentYear]);

  // Fetch employee's requests
  const fetchRequests = useCallback(async (page: number) => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const payload: ListingRequestBody = {
        filter: {
          ...(statusFilter !== 'all' && { status: statusFilter as LeaveStatus }),
          sortBy: 'applied_on',
          sortOrder: 'desc',
        },
        pagination: { page, size: pageSize },
        paginationFlag: true,
      };

      const res = await leavesApi.list(payload);
      const data = res?.response?.data ?? res?.response?.data ?? [];
      const total = res?.response?.meta?.totalRecords ?? res?.response?.totalRecords ?? 0;
      setRequests(Array.isArray(data) ? data : []);
      setTotalRecords(total);
    } catch (error) {
      console.error('Failed to fetch requests', error);
      addToast({ variant: 'error', title: 'Error', message: 'Failed to load leave requests' });
    } finally {
      setLoading(false);
    }
  }, [employeeId, statusFilter, pageSize, addToast]);

  // Fetch all requests (HR)
  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    try {
      const payload: ListingRequestBody = {
        filter: { sortBy: 'applied_on', sortOrder: 'desc' },
        pagination: { page: 1, size: 50 },
        paginationFlag: true,
      };
      const res = await leavesApi.list(payload);
      const data = res?.response?.data ?? res?.response?.data ?? [];
      const total = res?.response?.meta?.totalRecords ?? res?.response?.totalRecords ?? 0;
      setAllRequests(Array.isArray(data) ? data : []);
      setAllRequestsTotal(total);
    } catch (error) {
      console.error('Failed to fetch all requests', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch holidays
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await holidaysApi.list({ year: currentYear });
      const data = res?.response?.data ?? res?.response ?? [];
      setHolidays(Array.isArray(data) ? data.sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()) : []);
    } catch (error) {
      console.error('Failed to fetch holidays', error);
    }
  }, [currentYear]);

  // Initial load
  useEffect(() => {
    if (!employeeId) return;
    fetchBalances();
    fetchRequests(1);
    fetchHolidays();
    setCurrentPage(1);
  }, [employeeId, fetchBalances, fetchRequests, fetchHolidays]);

  useEffect(() => {
    fetchRequests(1);
    setCurrentPage(1);
  }, [statusFilter, fetchRequests]);

  useEffect(() => {
    if (isHRAdmin && hrTab === 'All Requests') {
      fetchAllRequests();
    }
  }, [isHRAdmin, hrTab, fetchAllRequests]);

  // Handlers
  const handleApplyLeaveSuccess = () => {
    setApplyModalOpen(false);
    fetchRequests(1);
    fetchBalances();
    setCurrentPage(1);
  };

  const handleHolidaySuccess = () => {
    setHolidayModalOpen(false);
    setSelectedHoliday(null);
    fetchHolidays();
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await leavesApi.action(id, { status: 'approved' });
      addToast({ variant: 'success', title: 'Success', message: 'Leave approved' });
      isHRAdmin ? fetchAllRequests() : fetchRequests(currentPage);
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: error.message || 'Failed to approve' });
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await leavesApi.action(id, { status: 'rejected', rejection_reason: 'Rejected by HR' });
      addToast({ variant: 'success', title: 'Success', message: 'Leave rejected' });
      isHRAdmin ? fetchAllRequests() : fetchRequests(currentPage);
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: error.message || 'Failed to reject' });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidaysApi.delete(id);
      addToast({ variant: 'success', title: 'Success', message: 'Holiday deleted' });
      fetchHolidays();
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: error.message || 'Failed to delete' });
    }
  };

  // Status tabs built with t() at render time
  const STATUS_TABS: { id: LeaveStatusFilter; label: string }[] = [
    { id: 'all', label: t('status.all') },
    { id: 'pending', label: t('status.pending') },
    { id: 'approved', label: t('status.approved') },
    { id: 'rejected', label: t('status.rejected') },
    { id: 'cancelled', label: t('status.cancelled') },
  ];

  // HR tab display labels
  const HR_TAB_LABELS: Record<string, string> = {
    'My Leaves': t('leave.my_leaves'),
    'All Requests': t('leave.all_requests'),
    'Holidays': t('leave.holidays'),
  };

  // Render balance cards
  const renderBalanceCards = () => (
    <div className={styles.balanceCardsContainer}>
      {balances.map((balance) => {
        const color = LEAVE_TYPE_COLORS[balance.leave_type] || { bg: '#f3f4f6', text: '#374151', progress: '#6b7280' };
        const percentage = balance.entitled > 0 ? (balance.taken / balance.entitled) * 100 : 0;

        return (
          <div key={balance.leave_type} className={styles.balanceCard} style={{ backgroundColor: color.bg }}>
            <div className={styles.leaveTypeLabel} style={{ color: color.text }}>
              {LEAVE_TYPE_NAMES[balance.leave_type]}
            </div>
            <div className={styles.balanceRow}>
              <div className={styles.balanceValue}>
                {balance.taken}
                <span className={styles.sub}>/ {balance.entitled}</span>
              </div>
              <div className={styles.statusText} style={{ color: color.text }}>
                {balance.available > 0 ? `${balance.available.toFixed(1)} left` : t('common.used')}
              </div>
            </div>
            <ProgressBar value={Math.min(percentage, 100)} color={color.progress} height={4} />
          </div>
        );
      })}
    </div>
  );

  // Render employee my leaves view
  const renderMyLeavesView = () => (
    <>
      {renderBalanceCards()}

      <div className={styles.contentArea}>
        <div className={styles.requestsCard}>
          <div className={styles.cardTitle}>{t('leave.my_requests')}</div>

          <div className={styles.tabBar}>
            <div className={styles.tabs}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${statusFilter === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Spinner size="sm" />
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <Typography color="secondary">{t('leave.no_requests')}</Typography>
            </div>
          ) : (
            <>
              <table className={styles.requestsTable}>
                <thead>
                  <tr>
                    <th>{t('common.type')}</th>
                    <th>{t('leave.duration')}</th>
                    <th>{t('leave.date_range')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{LEAVE_TYPE_NAMES[req.leave_type] || req.leave_type}</td>
                      <td>{req.duration_type === 'full_day' ? t('leave.full_day') : req.duration_type === 'first_half' ? t('leave.first_half') : t('leave.second_half')} ({req.days_count})</td>
                      <td>{new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[req.status]}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <div className={styles.actionButtons}>
                            <button onClick={() => {
                              // Handle cancel
                              leavesApi.cancel(req.id, 'Cancelled by employee').then(() => {
                                addToast({ variant: 'success', title: 'Success', message: 'Leave cancelled' });
                                fetchRequests(currentPage);
                              }).catch((err) => {
                                addToast({ variant: 'error', title: 'Error', message: err.message || 'Failed to cancel' });
                              });
                            }}>{t('common.cancel')}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalRecords > pageSize && (
                <div className={styles.paginationContainer}>
                  <div className={styles.pageInfo}>
                    {t('common.showing')} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} {t('common.of')} {totalRecords}
                  </div>
                  <div className={styles.pageControls}>
                    <button disabled={currentPage === 1} onClick={() => { setCurrentPage(currentPage - 1); fetchRequests(currentPage - 1); }}>
                      {t('common.previous')}
                    </button>
                    <button disabled={currentPage * pageSize >= totalRecords} onClick={() => { setCurrentPage(currentPage + 1); fetchRequests(currentPage + 1); }}>
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.summaryPanel}>
          <Typography variant="h3" className={styles.summaryTitle}>{t('leave.year_summary')}</Typography>

          <div className={styles.donutWrap}>
            <div className={styles.summaryStats}>
              <div className={styles.mainStat}>
                {balances.reduce((sum, b) => sum + b.available, 0).toFixed(1)}
                <span className={styles.label}>{t('leave.days_available')}</span>
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.stat}>
                <div className={styles.value}>{balances.reduce((sum, b) => sum + b.taken, 0)}</div>
                <div className={styles.label}>{t('common.used')}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.value}>{balances.reduce((sum, b) => sum + b.carried_forward, 0)}</div>
                <div className={styles.label}>{t('leave.carry_forward')}</div>
              </div>
            </div>
          </div>

          <div className={styles.upcomingList}>
            <Typography weight="semibold" className={styles.listTitle}>{t('leave.upcoming_holidays')}</Typography>
            {holidays.filter(h => new Date(h.holiday_date) >= new Date()).slice(0, 5).length === 0 ? (
              <div className={styles.emptyMessage}>{t('leave.no_upcoming_holidays')}</div>
            ) : (
              holidays
                .filter(h => new Date(h.holiday_date) >= new Date())
                .slice(0, 5)
                .map((holiday) => (
                  <div key={holiday.id} className={styles.holidayItem}>
                    <p className={styles.holidayName}>{holiday.name}</p>
                    <p className={styles.holidayDate}>{new Date(holiday.holiday_date).toLocaleDateString()}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Render HR all requests view
  const renderAllRequestsView = () => (
    <div className={styles.requestsCard}>
      <div className={styles.cardTitle}>{t('leave.all_leave_requests')}</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Spinner size="sm" />
        </div>
      ) : allRequests.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography color="secondary">{t('leave.no_requests')}</Typography>
        </div>
      ) : (
        <table className={styles.requestsTable}>
          <thead>
            <tr>
              <th>{t('common.employee')}</th>
              <th>{t('common.type')}</th>
              <th>{t('leave.duration')}</th>
              <th>{t('leave.date_range')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {allRequests.map((req) => (
              <tr key={req.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{req.employee_name || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{req.employee_code || req.employee_id}</div>
                </td>
                <td>{LEAVE_TYPE_NAMES[req.leave_type]}</td>
                <td>{req.days_count}</td>
                <td>{new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[req.status]}`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </td>
                <td>
                  {req.status === 'pending' && (
                    <div className={styles.actionButtons}>
                      <button onClick={() => handleApproveLeave(req.id)}>{t('common.approve')}</button>
                      <button className={styles.danger} onClick={() => handleRejectLeave(req.id)}>{t('common.reject')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Render holidays view
  const renderHolidaysView = () => (
    <div className={styles.requestsCard}>
      <div className={styles.holidayHeader}>
        <Typography variant="h3" className={styles.cardTitle} style={{ margin: 0 }}>{`${t('leave.holidays')} ${currentYear}`}</Typography>
        {isHRAdmin && (
          <button onClick={() => { setSelectedHoliday(null); setHolidayModalOpen(true); }} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {t('leave.add_holiday')}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Spinner size="sm" />
        </div>
      ) : holidays.length === 0 ? (
        <div className={styles.emptyState}>
          <Typography color="secondary">{t('leave.no_holidays')}</Typography>
        </div>
      ) : (
        <table className={styles.holidayTable}>
          <thead>
            <tr>
              <th>{t('leave.holiday_name')}</th>
              <th>{t('common.date')}</th>
              <th>{t('common.type')}</th>
              <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => (
              <tr key={holiday.id}>
                <td>{holiday.name}</td>
                <td>{new Date(holiday.holiday_date).toLocaleDateString()}</td>
                <td>{holiday.holiday_type_name || 'N/A'}</td>
                <td>
                  {isHRAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => { setSelectedHoliday(holiday); setHolidayModalOpen(true); }}
                        style={{ padding: '4px 8px', fontSize: '12px', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        style={{ padding: '4px 8px', fontSize: '12px', background: 'white', border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <Typography variant="h2">{t('leave.title')}</Typography>
          <Typography variant="body2" color="secondary" as="p">{t('leave.subtitle')}</Typography>
        </div>
        <Button variant="primary" onClick={() => setApplyModalOpen(true)}>
          <Icon name="plus" size={16} style={{ marginRight: 8 }} />
          {t('leave.apply_leave')}
        </Button>
      </div>

      {isHRAdmin && (
        <div className={styles.hrTabBar}>
          {HR_TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.pillTab} ${hrTab === tab ? styles.active : ''}`}
              onClick={() => setHrTab(tab)}
            >
              {HR_TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      {hrTab === 'All Requests' && isHRAdmin && renderAllRequestsView()}
      {hrTab === 'Holidays' && renderHolidaysView()}
      {(hrTab === 'My Leaves' || !isHRAdmin) && renderMyLeavesView()}

      <ApplyLeaveModal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} onSuccess={handleApplyLeaveSuccess} />
      <HolidayModal isOpen={holidayModalOpen} holiday={selectedHoliday} onClose={() => { setHolidayModalOpen(false); setSelectedHoliday(null); }} onSuccess={handleHolidaySuccess} />
    </>
  );
}
