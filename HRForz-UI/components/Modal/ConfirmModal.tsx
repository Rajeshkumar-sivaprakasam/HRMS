import React from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Textarea } from '../Textarea/Textarea';
import { Heading } from '../Typography/Typography';
import styles from './Modal.module.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'success';
  loading?: boolean;
  showReasonInput?: boolean;
  reasonValue?: string;
  onReasonChange?: (val: string) => void;
  reasonPlaceholder?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  showReasonInput = false,
  reasonValue = '',
  onReasonChange,
  reasonPlaceholder = 'Enter reason...'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className={styles.confirmContent} style={{ padding: '24px', textAlign: 'center' }}>
        <Heading level="h3" style={{ marginBottom: 12 }}>{title}</Heading>
        <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>{message}</div>
        
        {showReasonInput && (
          <div style={{ marginBottom: 24, textAlign: 'left' }}>
            <Textarea
              placeholder={reasonPlaceholder}
              value={reasonValue}
              onChange={(e) => onReasonChange?.(e.target.value)}
              error={!reasonValue && (variant === 'danger' || variant === 'primary') ? 'Reason is required' : undefined}
              autoResize
              rows={3}
            />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm}
            loading={loading}
            disabled={showReasonInput && variant === 'danger' && !reasonValue}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
