import React from 'react';
import styles from './Toggle.module.scss';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, size = 'md', disabled = false, className, style, ...props }, ref) => (
    <label className={[styles.wrapper, disabled && styles.disabled, className].filter(Boolean).join(' ')} style={style} data-testid="toggle">
      <input ref={ref} type="checkbox" className={styles.input} disabled={disabled} role="switch" {...props} />
      <span className={[styles.track, styles[size]].join(' ')} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
);
Toggle.displayName = 'Toggle';
