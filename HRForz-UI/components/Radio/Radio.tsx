import React from 'react';
import styles from './Radio.module.scss';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  className?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, disabled = false, className, style, ...props }, ref) => (
    <label className={[styles.wrapper, disabled && styles.disabled, className].filter(Boolean).join(' ')} style={style} data-testid="radio">
      <input ref={ref} type="radio" className={styles.input} disabled={disabled} {...props} />
      <span className={styles.circle} aria-hidden="true"><span className={styles.dot} /></span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
);
Radio.displayName = 'Radio';

export interface RadioGroupProps { label?: string; name: string; direction?: 'horizontal' | 'vertical'; children: React.ReactNode; className?: string; }
export const RadioGroup: React.FC<RadioGroupProps> = ({ label, name, direction = 'vertical', children, className }) => (
  <fieldset className={className} data-testid="radio-group" role="radiogroup" aria-label={label} style={{ border: 'none', padding: 0 }}>
    {label && <legend className={styles.groupLabel}>{label}</legend>}
    <div className={[styles.group, styles[direction]].join(' ')}>
      {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<RadioProps>, { name }) : child)}
    </div>
  </fieldset>
);
