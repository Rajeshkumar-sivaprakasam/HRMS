import React from 'react';
import { Button, Icon, Badge } from '@/components';
import styles from './AttendanceCard.module.scss';

interface AttendanceCardProps {
  date: string;
  currentTime: string;
  isClockedIn: boolean;
  workedTime: string;
  goalTime: string;
  progress: number;
  timeline: Array<{
    id: string;
    type: 'clock_in' | 'clock_out';
    time: string;
    status: 'completed' | 'pending';
  }>;
  onClockIn?: () => void;
  onClockOut?: () => void;
  onRegularise?: () => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  date,
  currentTime,
  isClockedIn,
  workedTime,
  goalTime,
  progress,
  timeline,
  onClockIn,
  onClockOut,
  onRegularise,
}) => {
  return (
    <div className={styles.attendanceCard}>
      <div className={styles.punchSection}>
        <div className={styles.header}>
          <span className={styles.todayText}>TODAY · {date}</span>
        </div>
        
        <div className={styles.mainInfo}>
          <div className={styles.clockContainer}>
            <span className={styles.time}>{currentTime}</span>
            <Badge 
              variant="subtle" 
              size="sm" 
              className={`${styles.statusBadge} ${isClockedIn ? styles.clockedIn : styles.clockedOut}`}
            >
              <span className={styles.dot}></span>
              {isClockedIn ? 'Clocked in' : 'Clocked out'}
            </Badge>
          </div>
          <div className={styles.workedInfo}>
            Worked {workedTime} of {goalTime} today
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%`, background: '#2f6df5' }}
            />
          </div>
        </div>

        <div className={styles.footerActions}>
          {isClockedIn ? (
            <Button variant="danger" className={styles.clockOutBtn} onClick={onClockOut}>
              <span className={styles.btnIcon}>⏹</span>
              Clock out
            </Button>
          ) : (
            <Button variant="primary" className={styles.clockInBtn} onClick={onClockIn}>
              <span className={styles.btnIcon}>▶</span>
              Clock in
            </Button>
          )}
          <Button variant="ghost" className={styles.regulariseBtn} onClick={onRegularise}>
            <Icon name="edit" size={16} />
            Regularise
          </Button>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.timelineSection}>
        <h3 className={styles.timelineTitle}>Today's timeline</h3>
        <div className={styles.timelineList}>
          {timeline.map((item, index) => (
            <div 
              key={item.id} 
              className={styles.timelineItem}
            >
              <div className={styles.timelineIconContainer}>
                <div className={`${styles.iconCircle} ${styles[item.type]} ${styles[item.status]}`}>
                  {item.type === 'clock_in' ? '▷' : '□'}
                </div>
                {index < timeline.length - 1 && <div className={styles.timelineLine}></div>}
              </div>
              <div className={styles.timelineContent}>
                <span className={styles.label}>
                  {item.type === 'clock_in' ? 'Clock-in' : `Clock-out${item.status === 'pending' ? ' (pending)' : ''}`}
                </span>
                <span className={styles.time}>{item.status === 'pending' ? '—' : item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
