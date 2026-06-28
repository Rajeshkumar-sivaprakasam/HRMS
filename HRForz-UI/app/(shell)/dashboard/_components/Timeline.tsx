import React from 'react';
import { Card } from '@/components';
import styles from './Timeline.module.scss';

interface TimelineItem {
  id: string;
  type: 'clock_in' | 'clock_out';
  time: string;
  status: 'completed' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <Card className={styles.timelineCard}>
      <h3 className={styles.title}>Today's timeline</h3>
      
      <div className={styles.timelineList}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.timelineItem}>
            <div className={styles.leftLine}>
              <div className={`${styles.iconCircle} ${styles[item.type]} ${styles[item.status]}`}>
                {item.type === 'clock_in' ? (
                   <span className={styles.icon}>▶</span>
                ) : (
                   <span className={styles.icon}>⏹</span>
                )}
              </div>
              {index < items.length - 1 && <div className={styles.line}></div>}
            </div>
            <div className={styles.content}>
              <span className={styles.label}>
                {item.type === 'clock_in' ? 'Clock-in' : `Clock-out${item.status === 'pending' ? ' (pending)' : ''}`}
              </span>
              <span className={styles.time}>{item.status === 'pending' ? '—' : item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
