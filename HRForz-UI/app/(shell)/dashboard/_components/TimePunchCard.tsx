import React from 'react';
import { Card, Button, Icon, Badge } from '@/components';
import styles from './TimePunchCard.module.scss';

interface TimePunchCardProps {
  date: string;
  currentTime: string;
  isClockedIn: boolean;
  workedTime: string;
  goalTime: string;
  progress: number;
  onClockOut?: () => void;
  onRegularise?: () => void;
}

export const TimePunchCard: React.FC<TimePunchCardProps> = ({
  date,
  currentTime,
  isClockedIn,
  workedTime,
  goalTime,
  progress,
  onClockOut,
  onRegularise,
}) => {
  return (
    <Card className={styles.timePunchCard}>
      <div className={styles.header}>
        <span className={styles.todayText}>TODAY · {date}</span>
      </div>
      
      <div className={styles.mainInfo}>
        <div className={styles.clockContainer}>
          <span className={styles.time}>{currentTime}</span>
          <Badge 
            variant="success" 
            size="sm" 
            className={styles.statusBadge}
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
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className={styles.footerActions}>
        <Button 
          variant="error" 
          className={styles.clockOutBtn}
          onClick={onClockOut}
        >
          <Icon name="logout" size={16} style={{ marginRight: 8 }} />
          Clock out
        </Button>
        <Button 
          variant="outline" 
          className={styles.regulariseBtn}
          onClick={onRegularise}
        >
          <Icon name="settings" size={16} style={{ marginRight: 8 }} />
          Regularise
        </Button>
      </div>
    </Card>
  );
};
