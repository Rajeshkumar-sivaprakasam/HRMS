'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/lib/i18n';
import styles from './Drawer.module.scss';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right' | 'bottom';
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen, onClose, title, position = 'right', closeOnBackdrop = true,
  children, className, style,
}) => {
  const { t } = useTranslation();
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <>
      <div className={styles.backdrop} onClick={closeOnBackdrop ? onClose : undefined} data-testid="drawer-backdrop" />
      <div
        className={[styles.drawer, styles[position], className].filter(Boolean).join(' ')}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="drawer"
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.close} onClick={onClose} aria-label={t('common.close_drawer')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
};
