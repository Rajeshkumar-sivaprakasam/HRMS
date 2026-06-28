'use client';
import React, { useState } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Label text */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error message — shows error state when set */
  error?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Icon/element before input */
  prefix?: React.ReactNode;
  /** Icon/element after input */
  suffix?: React.ReactNode;
  /** Show clear button */
  clearable?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional class names */
  className?: string;
  /** Callback when value is cleared */
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      prefix,
      suffix,
      clearable = false,
      required = false,
      fullWidth = true,
      className,
      type = 'text',
      value,
      onClear,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const wrapperClasses = [
      styles.wrapper,
      required && styles.required,
      className,
    ].filter(Boolean).join(' ');

    const inputClasses = [
      styles.input,
      styles[size],
      prefix && styles.hasPrefix,
      (suffix || isPassword || clearable) && styles.hasSuffix,
      error && styles.error,
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses} style={style} data-testid="input">
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {prefix && <span className={styles.prefix}>{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            required={required}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          )}
          {clearable && value && !isPassword && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={onClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
          {suffix && !isPassword && !clearable && <span className={styles.suffix}>{suffix}</span>}
        </div>
        {error && <span id={`${inputId}-error`} className={styles.errorText} role="alert">{error}</span>}
        {!error && helperText && <span id={`${inputId}-helper`} className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
