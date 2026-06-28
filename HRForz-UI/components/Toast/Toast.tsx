'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import styles from './Toast.module.scss';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';
type ToastPosition = 'topRight' | 'topLeft' | 'topCenter' | 'bottomRight' | 'bottomLeft' | 'bottomCenter';

interface ToastItem { id: string; variant: ToastVariant; title?: string; message: string; duration?: number; }
interface ToastContextValue { addToast: (toast: Omit<ToastItem, 'id'>) => void; removeToast: (id: string) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);
export const useToast = () => { const ctx = useContext(ToastContext); if (!ctx) throw new Error('useToast must be used within ToastProvider'); return ctx; };

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  error: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warning: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

export interface ToastProviderProps { children: React.ReactNode; position?: ToastPosition; }
export const ToastProvider: React.FC<ToastProviderProps> = ({ children, position = 'topRight' }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    setToasts(prev => [...prev, { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }, []);
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className={[styles.container, styles[position]].join(' ')} data-testid="toast-container" aria-live="polite">
        {toasts.map(t => <ToastItem key={t.id} {...t} onDismiss={() => removeToast(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<ToastItem & { onDismiss: () => void }> = ({ variant, title, message, duration = 5000, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => { setExiting(true); setTimeout(onDismiss, 300); }, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [duration, onDismiss]);

  const handleDismiss = () => { setExiting(true); setTimeout(onDismiss, 300); };

  return (
    <div className={[styles.toast, exiting && styles.exiting].filter(Boolean).join(' ')} data-testid="toast" role="alert">
      <span className={[styles.icon, styles[variant]].join(' ')}>{icons[variant]}</span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>
      <button className={styles.dismiss} onClick={handleDismiss} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
};

/** Standalone Toast for Storybook demo */
export interface ToastProps { variant?: ToastVariant; title?: string; message: string; className?: string; style?: React.CSSProperties; }
export const Toast: React.FC<ToastProps> = ({ variant = 'info', title, message, className, style }) => (
  <div className={[styles.toast, className].filter(Boolean).join(' ')} style={{ ...style, position: 'relative', animation: 'none' }} data-testid="toast" role="alert">
    <span className={[styles.icon, styles[variant]].join(' ')}>{icons[variant]}</span>
    <div className={styles.content}>{title && <div className={styles.title}>{title}</div>}<div className={styles.message}>{message}</div></div>
  </div>
);
