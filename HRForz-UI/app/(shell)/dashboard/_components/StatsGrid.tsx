import React from 'react';
import { Card } from '@/components';
import styles from './StatsGrid.module.scss';

interface StatItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    label: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

const StatCard: React.FC<StatItemProps> = ({ label, value, subValue, trend }) => (
  <Card className={styles.statCard}>
    <div className={styles.label}>{label}</div>
    <div className={styles.valueRow}>
      <span className={styles.value}>{value}</span>
      {trend && (
        <span className={`${styles.trend} ${styles[trend.type]}`}>
          {trend.label}
        </span>
      )}
    </div>
    {subValue && <div className={styles.subValue}>{subValue}</div>}
  </Card>
);

interface StatsGridProps {
  stats: {
    thisMonth: { days: number; diff_label: string };
    avgHours: { hours: string; status: string; target: string };
    lopDays: number;
    pending: { total: number; breakdown: string };
  };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className={styles.grid}>
      <StatCard 
        label="This month" 
        value={`${stats.thisMonth.days}d`} 
        trend={{ label: stats.thisMonth.diff_label, type: 'positive' }}
        subValue="Working days attended"
      />
      <StatCard 
        label="Avg work hours" 
        value={stats.avgHours.hours} 
        trend={{ label: stats.avgHours.status, type: 'positive' }}
        subValue={`Target ${stats.avgHours.target}`}
      />
      <StatCard 
        label="LOP days" 
        value={stats.lopDays} 
        subValue="No loss of pay this cycle"
      />
      <StatCard 
        label="Pending requests" 
        value={stats.pending.total} 
        subValue={stats.pending.breakdown}
      />
    </div>
  );
};
