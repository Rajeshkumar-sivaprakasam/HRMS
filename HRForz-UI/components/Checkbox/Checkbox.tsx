'use client';
import React, { useEffect, useRef } from 'react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, indeterminate = false, disabled = false, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const el = internalRef.current;
      if (el) el.indeterminate = indeterminate;
    }, [indeterminate]);

    const setRefs = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    return (
      <label className={[styles.wrapper, disabled && styles.disabled, className].filter(Boolean).join(' ')} style={style} data-testid="checkbox">
        <input ref={setRefs} type="checkbox" className={styles.input} disabled={disabled} aria-checked={indeterminate ? 'mixed' : undefined} {...props} />
        <span className={styles.box} aria-hidden="true">
          {indeterminate ? (
            <svg className={styles.indeterminateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ) : (
            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export interface CheckboxGroupProps { label?: string; direction?: 'horizontal' | 'vertical'; children: React.ReactNode; className?: string; }
export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, direction = 'vertical', children, className }) => (
  <div className={className} data-testid="checkbox-group" role="group" aria-label={label}>
    {label && <div className={styles.groupLabel}>{label}</div>}
    <div className={[styles.group, styles[direction]].join(' ')}>{children}</div>
  </div>
);
