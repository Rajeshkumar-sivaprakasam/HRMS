import React from 'react';
import { Icon, Heading, Text } from '@/components';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  height?: string | number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'box', 
  title, 
  description, 
  action,
  height = '160px'
}) => {
  return (
    <div className={styles.emptyState} style={{ height }}>
      <div className={styles.iconWrapper}>
        <Icon name={icon as any} size={20} />
      </div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};
