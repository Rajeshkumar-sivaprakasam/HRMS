'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import styles from './Textarea.module.scss';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
  className?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, maxLength, showCharCount = false, autoResize = false, className, style, id, value, onChange, required, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
    const charCount = typeof value === 'string' ? value.length : 0;

    const handleResize = useCallback(() => {
      const el = internalRef.current;
      if (el && autoResize) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [autoResize]);

    useEffect(() => { handleResize(); }, [value, handleResize]);

    const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }, [ref]);

    const textareaClasses = [styles.textarea, error && styles.error, autoResize && styles.autoResize].filter(Boolean).join(' ');

    return (
      <div className={[styles.wrapper, required && styles.required, className].filter(Boolean).join(' ')} style={style} data-testid="textarea">
        {label && <label htmlFor={textareaId} className={styles.label}>{label}</label>}
        <div className={styles.textareaWrapper}>
          <textarea ref={setRefs} id={textareaId} className={textareaClasses} value={value} onChange={onChange}
            maxLength={maxLength} aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined} {...props} />
        </div>
        <div className={styles.footer}>
          {error ? <span id={`${textareaId}-error`} className={styles.errorText} role="alert">{error}</span>
            : helperText ? <span id={`${textareaId}-helper`} className={styles.helperText}>{helperText}</span>
            : <span />}
          {showCharCount && (
            <span className={[styles.charCount, maxLength && charCount > maxLength ? styles.exceeded : ''].filter(Boolean).join(' ')}>
              {charCount}{maxLength ? `/${maxLength}` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
