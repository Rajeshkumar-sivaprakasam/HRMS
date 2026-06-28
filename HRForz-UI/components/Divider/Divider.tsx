import React from 'react';
import styles from './Divider.module.scss';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', label, className, style }) => {
  if (orientation === 'vertical') {
    return <div className={[styles.divider, styles.vertical, className].filter(Boolean).join(' ')} style={style} data-testid="divider" role="separator" aria-orientation="vertical" />;
  }

  if (label) {
    return (
      <div className={[styles.divider, styles.horizontal, styles.withLabel, className].filter(Boolean).join(' ')} style={style} data-testid="divider" role="separator">
        <span className={styles.label}>{label}</span>
      </div>
    );
  }

  return <hr className={[styles.divider, styles.horizontal, className].filter(Boolean).join(' ')} style={style} data-testid="divider" />;
};
