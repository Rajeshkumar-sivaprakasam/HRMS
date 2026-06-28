import React from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'card' | 'row';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', width, height, className, style }) => (
  <div 
    className={[styles.skeleton, styles[variant], className].filter(Boolean).join(' ')} 
    style={{ width, height, ...style }}
    data-testid="skeleton"
    aria-hidden="true"
  />
);
