'use client';
import React from 'react';
import styles from './FinanceCard.module.scss';

export interface FinanceCardProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'premium';
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  title,
  subtitle,
  variant = 'default',
  action,
  footer,
  children,
  className
}) => {
  return (
    <div className={[styles.card, styles[variant], className].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      <div className={styles.body}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};
