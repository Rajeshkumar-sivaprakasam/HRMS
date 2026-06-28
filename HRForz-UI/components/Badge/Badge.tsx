import React from 'react';
import styles from './Badge.module.scss';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'subtle';
  color?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'violet' | 'teal' | 'pink' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'subtle', color = 'neutral', size = 'md', dot = false, className, style }) => (
  <span className={[styles.badge, styles[variant], styles[color], styles[size], className].filter(Boolean).join(' ')} style={style} data-testid="badge">
    {dot && <span className={styles.dot} />}
    {children}
  </span>
);
