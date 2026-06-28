import React from 'react';
import { Card, Button, Heading } from '@/components';
import styles from './LeaveBalanceCard.module.scss';

interface LeaveItem {
  type: string;
  label: string;
  used: number;
  total: number;
  color: string;
}

interface LeaveBalanceCardProps {
  balances: LeaveItem[];
  onViewDetails?: () => void;
  onApply?: () => void;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ 
  balances, 
  onViewDetails,
  onApply 
}) => {
  return (
    <Card className={styles.leaveCard}>
      <div className={styles.header}>
        <Heading level="h4" className={styles.title}>Leave balance</Heading>
      </div>

      <div className={styles.balancesList}>
        {balances.map((item) => (
          <div key={item.type} className={styles.balanceItem}>
            <div className={styles.info}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.count}>
                <strong>{item.total - item.used}</strong> left
              </span>
            </div>
            <div className={styles.progressText}>{item.used} used of {item.total}</div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${(item.used / item.total) * 100}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" className={styles.applyBtn} onClick={onApply}>
        + Apply for leave
      </Button>
    </Card>
  );
};
