import React from 'react';
import styles from './ProgressBar.module.scss';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  indeterminate?: boolean;
  striped?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value = 0, 
  max = 100, 
  label, 
  showValue = false, 
  indeterminate = false, 
  striped = false, 
  className, 
  style 
}) => {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = Math.round((clampedValue / max) * 100);

  return (
    <div 
      className={[styles.wrapper, className].filter(Boolean).join(' ')} 
      style={style}
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      {(label || showValue) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && !indeterminate && <span className={styles.value}>{percentage}%</span>}
        </div>
      )}
      <div className={styles.track}>
        {indeterminate ? (
          <div className={[styles.indicator, styles.indeterminate, striped && styles.striped].filter(Boolean).join(' ')} />
        ) : (
          <div 
            className={[styles.indicator, striped && styles.striped].filter(Boolean).join(' ')} 
            style={{ width: `${percentage}%` }} 
          />
        )}
      </div>
    </div>
  );
};
