'use client';
import React from 'react';
import styles from './Timeline.module.scss';

export interface TimelineItem {
  id: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  status?: 'default' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  active?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={[styles.timeline, className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <div key={item.id} className={[styles.item, item.active && styles.active].filter(Boolean).join(' ')}>
          <div className={styles.line} />
          <div className={[styles.dot, styles[item.status || 'default'], item.active && styles.activeDot].filter(Boolean).join(' ')}>
            {item.icon ? item.icon : <div className={styles.innerDot} />}
          </div>
          <div className={styles.contentWrapper}>
            <div className={styles.header}>
              <div className={styles.title}>{item.title}</div>
              {item.subtitle && <div className={styles.subtitle}>{item.subtitle}</div>}
            </div>
            {item.content && <div className={styles.body}>{item.content}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
