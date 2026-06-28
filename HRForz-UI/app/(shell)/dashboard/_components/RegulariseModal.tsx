'use client';

import React, { useState } from 'react';
import { Modal, Input, Textarea, Button, Icon, Text, useToast } from '@/components';
import { dashboardApi } from '@/lib/api';

interface RegulariseModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecordId: string;
  defaultClockIn?: string;
  defaultClockOut?: string;
  onSuccess?: () => void;
}

export const RegulariseModal: React.FC<RegulariseModalProps> = ({
  isOpen,
  onClose,
  attendanceRecordId,
  defaultClockIn = '',
  defaultClockOut = '',
  onSuccess,
}) => {
  const [clockIn, setClockIn] = useState(defaultClockIn);
  const [clockOut, setClockOut] = useState(defaultClockOut);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ clockIn?: string; reason?: string; general?: string }>({});
  const { addToast } = useToast();

  // Sync state with props when modal opens or defaults change
  React.useEffect(() => {
    if (isOpen) {
      setClockIn(defaultClockIn);
      setClockOut(defaultClockOut);
    }
  }, [isOpen, defaultClockIn, defaultClockOut]);

  const handleSubmit = async () => {
    const newErrors: { clockIn?: string; reason?: string } = {};
    
    if (!clockIn.trim()) {
      newErrors.clockIn = 'This field is required';
    }
    
    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for regularisation.';
    }

    if (reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters long.';
    }

    if (!attendanceRecordId) {
      setErrors({ general: 'Could not find an attendance record for today. Please try again or contact support.' });
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const formatTime = (time: string) => {
        if (!time) return null;
        if (time.split(':').length === 2) return `${time}:00`;
        return time;
      };

      const payload = {
        attendance_record_id: attendanceRecordId,
        requested_clock_in: formatTime(clockIn),
        requested_clock_out: formatTime(clockOut),
        reason: reason,
      };

      await dashboardApi.createRegularisation(payload);

      addToast({ variant: 'success', title: 'Success', message: 'Regularisation request submitted successfully!' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Regularisation failed:', err);
      setErrors({ general: err.message || 'Failed to submit regularisation request.' });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        Submit Request
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Regularisation"
      footer={footer}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: -8 }}>
        <Text variant="body2">
          Request to update your attendance for today. Please provide the correct times and a reason for the change.
        </Text>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Requested Clock-in"
            type="time"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            required
            error={errors.clockIn}
          />
          <Input
            label="Requested Clock-out"
            type="time"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
          />
        </div>

        <Textarea
          label="Reason for Regularisation"
          placeholder="e.g. Forgot to clock in, technical issue, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={4}
          error={errors.reason || errors.general}
        />
      </div>
    </Modal>
  );
};
