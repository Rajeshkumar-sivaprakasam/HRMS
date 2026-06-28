'use client';

import React from 'react';
import { Card, Icon, Badge, Avatar, Button } from '@/components';
import styles from './HRWidgets.module.scss';
import { 
  WorkforceStats, AttendanceTrend, PendingApproval, 
  DeptHeadcount, HelpdeskTicket, Announcement, Holiday, Birthday 
} from '@/lib/types/dashboard';
import { EmptyState } from './EmptyState';

// --- Workforce Overview ---
export const WorkforceOverview: React.FC<{ stats: WorkforceStats }> = ({ stats }) => (
  <div className={styles.overviewGrid}>
    <div className={styles.metricCard}>
      <div className={`${styles.iconWrapper} ${styles.headcount}`}>
        <Icon name="users" size="md" />
      </div>
      <p className={styles.metricLabel}>Headcount</p>
      <h3 className={styles.metricValue}>{stats.headcount.total}</h3>
      <p className={`${styles.metricTrend} ${stats.headcount.diff_this_month >= 0 ? styles.positive : styles.neutral}`}>
        {stats.headcount.diff_this_month >= 0 ? `+${stats.headcount.diff_this_month}` : stats.headcount.diff_this_month} this month
      </p>
    </div>

    <div className={styles.metricCard}>
      <div className={`${styles.iconWrapper} ${styles.present}`}>
        <Icon name="check-circle" size="md" />
      </div>
      <p className={styles.metricLabel}>Present today</p>
      <h3 className={styles.metricValue}>{stats.present_today.count}/{stats.present_today.total}</h3>
      <p className={`${styles.metricTrend} ${styles.positive}`}>
        {stats.present_today.percentage}%
      </p>
    </div>

    <div className={styles.metricCard}>
      <div className={`${styles.iconWrapper} ${styles.onLeave}`}>
        <Icon name="calendar" size="md" />
      </div>
      <p className={styles.metricLabel}>On leave</p>
      <h3 className={styles.metricValue}>{stats.on_leave.total}</h3>
      <p className={`${styles.metricTrend} ${styles.neutral}`}>
        {stats.on_leave.sick} sick · {stats.on_leave.casual} casual
      </p>
    </div>
  </div>
);

// --- Attendance Pulse (Custom SVG Chart) ---
export const AttendancePulse: React.FC<{ data: AttendanceTrend[], stats?: any }> = ({ data, stats }) => {
  const width = 500;
  const height = 180;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const safeData = Array.isArray(data) ? data : [];
  
  if (safeData.length === 0) {
    return (
      <Card className={styles.widgetCard}>
        <div className={styles.header}>
          <h3 className={styles.title}>Attendance pulse</h3>
        </div>
        <EmptyState title="No attendance trend" description="Data will appear here once attendance records are processed." icon="activity" height={180} />
      </Card>
    );
  }

  const maxVal = Math.max(...safeData.map(d => Math.max(d.present || 0, d.late || 0, d.absent || 0)), 10);
  const yAxisMax = maxVal > 150 ? 200 : maxVal > 80 ? 100 : maxVal > 40 ? 50 : Math.ceil(maxVal / 5) * 5;
  
  const getX = (index: number) => padding + (index / (safeData.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => height - padding - (val / yAxisMax) * chartHeight;

  const presentPoints = safeData.map((d, i) => `${getX(i)},${getY(d.present)}`).join(' ');
  const latePoints = safeData.map((d, i) => `${getX(i)},${getY(d.late)}`).join(' ');
  const absentPoints = safeData.map((d, i) => `${getX(i)},${getY(d.absent)}`).join(' ');

  const areaPoints = ` ${getX(0)},${height - padding} ${presentPoints} ${getX(safeData.length - 1)},${height - padding}`;

  return (
    <Card className={styles.widgetCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>Attendance pulse</h3>
        <div className={styles.chartLegend}>
          <div className={`${styles.legendItem} ${styles.present}`}><span className={styles.dot} /> Present</div>
          <div className={`${styles.legendItem} ${styles.late}`}><span className={styles.dot} /> Late</div>
          <div className={`${styles.legendItem} ${styles.absent}`}><span className={styles.dot} /> Absent</div>
        </div>
      </div>
      
      <div className={styles.chartWrapper}>
        {(!data || data.length === 0) ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
            No attendance trend data available
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none">
            {/* Y Axis Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const v = Math.round(ratio * yAxisMax);
              return (
                <g key={ratio}>
                  <line x1={padding} y1={getY(v)} x2={width - padding} y2={getY(v)} stroke="#f1f5f9" strokeWidth="1" />
                  <text className={styles.chartLabel} x={padding - 5} y={getY(v) + 4} textAnchor="end">{v}</text>
                </g>
              );
            })}

            {/* Area under Present line */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <polyline points={areaPoints} fill="url(#areaGradient)" stroke="none" />

            {/* Lines */}
            <polyline points={presentPoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            <polyline points={latePoints} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points={absentPoints} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Dots on Present line */}
            {data.map((d, i) => (
              <circle key={i} cx={getX(i)} cy={getY(d.present)} r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
            ))}

            {/* X Axis Labels */}
            {data.map((d, i) => (
              i % 2 === 0 && (
                <text key={i} x={getX(i)} y={height - 2} textAnchor="middle" className={styles.chartLabel}>{d.date}</text>
              )
            ))}
          </svg>
        )}
      </div>

      <div className={styles.statsFooter}>
        <div className={styles.footerStat}>
          <span className={styles.fsLabel}>Avg in-time</span>
          <span className={styles.fsValue}>{stats?.avg_in_time ? stats.avg_in_time.slice(0, 5) : '09:18'} AM</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.fsLabel}>Avg work hrs</span>
          <span className={styles.fsValue}>{stats?.avg_work_hours || '8h 24m'}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.fsLabel}>Late arrivals</span>
          <span className={styles.fsValue} style={{ color: '#f59e0b' }}>{stats?.total_late_arrivals ?? 0}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.fsLabel}>Missed clock-out</span>
          <span className={styles.fsValue} style={{ color: '#ef4444' }}>{stats?.missed_clock_out_count ?? 0}</span>
        </div>
      </div>
    </Card>
  );
};

// --- Pending Approvals ---
export const PendingApprovals: React.FC<{ 
  items: PendingApproval[], 
  onAction?: (item: PendingApproval, action: 'approve' | 'reject') => void 
}> = ({ items, onAction }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Pending approvals <Badge variant="subtle" size="sm" color="primary" style={{ background: '#f5f3ff', color: '#7c3aed' }}>{Array.isArray(items) ? items.length : 0}</Badge></h3>
    </div>
    <div className={styles.approvalList}>
      {!Array.isArray(items) || items.length === 0 ? (
        <EmptyState title="All caught up" description="No pending approval requests to display." icon="check-circle" height={160} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.approvalItem}>
            <Avatar name={item.employee_name} src={item.avatar} className={styles.approvalAvatar} />
            <div className={styles.approvalContent}>
              <h4 className={styles.empName}>{item.employee_name}</h4>
              <p className={styles.reqDetails}>{item.type} · {item.duration} · {item.date}</p>
            </div>
            <div className={styles.actions}>
              <button 
                className={`${styles.actionBtn} ${styles.approve}`} 
                title="Approve"
                onClick={() => onAction?.(item, 'approve')}
              >
                <Icon name="check" size="sm" strokeWidth={3} />
              </button>
              <button 
                className={`${styles.actionBtn} ${styles.reject}`} 
                title="Reject"
                onClick={() => onAction?.(item, 'reject')}
              >
                <Icon name="x" size="sm" strokeWidth={3} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Department Headcount ---
export const DepartmentHeadcount: React.FC<{ departments: DeptHeadcount[] }> = ({ departments }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Headcount by department</h3>
      <Button variant="link" className={styles.viewAll}>Org chart <Icon name="chevron-right" size={14} /></Button>
    </div>
    <div className={styles.deptGrid}>
      {!Array.isArray(departments) || departments.length === 0 ? (
        <EmptyState title="No data available" description="Department distribution data is currently unavailable." icon="bar-chart" height={200} />
      ) : (
        departments.map(dept => (
          <div key={dept.name} className={styles.deptItem}>
            <div className={styles.deptHeader}>
              <span className={styles.deptName}>{dept.name}</span>
              <span className={styles.deptCount}>
                {dept.count}
                <span className={`${styles.deptDiff} ${dept.diff > 0 ? styles.plus : dept.diff < 0 ? styles.minus : styles.zero}`}>
                  {dept.diff > 0 ? `+${dept.diff}` : dept.diff === 0 ? '—' : dept.diff}
                </span>
              </span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(dept.count / (Math.max(...departments.map(d => d.count)) || 100)) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

// --- Bottom Widgets (Reused/Adapted) ---
export const HRAnnouncementsList: React.FC<{ 
  items: Announcement[], 
  onPublish: () => void,
  onEdit?: (item: Announcement) => void,
  onDelete?: (item: Announcement) => void
}> = ({ items, onPublish, onEdit, onDelete }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Recent announcements</h3>
      <Button variant="ghost" size="sm" onClick={onPublish} className={styles.publishBtn}>
        <Icon name="plus" size={14} /> Publish
      </Button>
    </div>
    <div className={styles.annList}>
      {!Array.isArray(items) || items.length === 0 ? (
        <EmptyState title="No announcements" description="You haven't published any announcements yet." icon="megaphone" height={200} />
      ) : (
        items.map(item => (
          <div key={item.id} className={styles.annItem}>
            <div className={styles.annType}>
              <span className={`${styles.typeBadge} ${styles[item.type] || styles.general}`}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
            </div>
            <div className={styles.annContent}>
              <h4 className={styles.annTitle}>{item.title}</h4>
              <p className={styles.annMeta}>By {item.author || 'HR Team'} · {item.time_ago || 'Recently'}</p>
            </div>
            <div className={styles.annActions}>
              <button 
                className={styles.editBtn} 
                title="Edit"
                onClick={() => onEdit?.(item)}
              >
                <Icon name="edit" size={16} />
              </button>
              <button 
                className={styles.deleteBtn} 
                title="Delete"
                onClick={() => onDelete?.(item)}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

export const HRHelpdeskTickets: React.FC<{ items: HelpdeskTicket[], onViewAll?: () => void }> = ({ items, onViewAll }) => (
  <Card className={styles.widgetCard}>
    <div className={styles.header}>
      <h3 className={styles.title}>Helpdesk tickets</h3>
      <Button variant="link" className={styles.viewAll} onClick={onViewAll}>All <Icon name="chevron-right" size={14} /></Button>
    </div>
    <div className={styles.approvalList}>
      {items.map(item => (
        <div key={item.id} className={styles.ticketItem}>
          <div className={styles.ticketTop}>
            <span className={styles.ticketId}>#{item.id} 
              <Badge size="sm" style={{ 
                background: item.priority === 'high' ? '#fee2e2' : item.priority === 'medium' ? '#ffedd5' : '#f1f5f9',
                color: item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#64748b'
              }}>{item.priority}</Badge>
            </span>
            <Button size="sm" variant="ghost" className={`${styles.statusBtn} ${item.status === 'In progress' ? styles.inProgress : ''}`}>
              {item.status}
            </Button>
          </div>
          <h4 className={styles.ticketTitle}>{item.title}</h4>
          <div className={styles.ticketMeta}>
            <span className={styles.requester}>Raised by {item.requester}</span>
          </div>
        </div>
      ))}
    </div>
  </Card>
);
