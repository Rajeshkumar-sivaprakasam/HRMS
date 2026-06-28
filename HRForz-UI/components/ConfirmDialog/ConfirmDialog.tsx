'use client';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { useTranslation } from '@/lib/i18n';
import styles from './ConfirmDialog.module.scss';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ICONS = {
  danger: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const { t } = useTranslation();
  const defaultTitles = { 
    danger: t('common.delete_confirmation'), 
    warning: t('common.are_you_sure'), 
    info: t('common.confirm_action') 
  };

  const finalConfirmLabel = confirmLabel === 'Confirm' ? t('common.confirm') : confirmLabel;
  const finalCancelLabel = cancelLabel === 'Cancel' ? t('common.cancel') : cancelLabel;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
      title={title ?? defaultTitles[variant]}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {finalCancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {finalConfirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={`${styles.iconWrap} ${styles[variant]}`}>
          {ICONS[variant]}
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
};
