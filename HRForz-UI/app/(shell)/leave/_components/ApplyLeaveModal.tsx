'use client';
import React, { useState } from 'react';
import { Drawer, Input, Select, Textarea, Button, Text } from '@/components';
import { leavesApi, LeaveType, LeaveDurationType } from '@/lib/api';
import { useToast } from '@/components/Toast/Toast';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'CL', label: 'Casual Leave' },
  { value: 'SL', label: 'Sick Leave' },
  { value: 'LOP', label: 'Loss of Pay' },
  { value: 'WFH', label: 'Work From Home' },
];

const DURATION_TYPES: { value: LeaveDurationType; label: string }[] = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'first_half', label: 'First Half' },
  { value: 'second_half', label: 'Second Half' },
];

export function ApplyLeaveModal({ isOpen, onClose, onSuccess }: ApplyLeaveModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    leave_type: 'CL' as LeaveType,
    duration_type: 'full_day' as LeaveDurationType,
    from_date: '',
    to_date: '',
    reason: '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.from_date) newErrors.from_date = 'From date is required';
    if (!formData.to_date) newErrors.to_date = 'To date is required';
    if (formData.from_date && formData.to_date && new Date(formData.to_date) < new Date(formData.from_date)) {
      newErrors.to_date = 'To date must be >= from date';
    }
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';
    if (formData.reason.trim().length < 5) newErrors.reason = 'Reason must be at least 5 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await leavesApi.apply(formData);
      addToast({ variant: 'success', title: 'Success', message: 'Leave applied successfully!' });
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: error.message || 'Failed to apply leave' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ leave_type: 'CL', duration_type: 'full_day', from_date: '', to_date: '', reason: '' });
    setErrors({});
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Apply for Leave" position="right" style={{ width: 400 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0', height: '100%' }}>
        <Select
          label="Leave Type"
          value={formData.leave_type}
          onChange={(e) => {
            setFormData({ ...formData, leave_type: e.target.value as LeaveType });
            setErrors({ ...errors, leave_type: '' });
          }}
          options={LEAVE_TYPES.map((t) => ({ label: t.label, value: t.value }))}
          required
        />

        <Select
          label="Duration"
          value={formData.duration_type}
          onChange={(e) => {
            setFormData({ ...formData, duration_type: e.target.value as LeaveDurationType });
            setErrors({ ...errors, duration_type: '' });
          }}
          options={DURATION_TYPES.map((d) => ({ label: d.label, value: d.value }))}
          required
        />

        <Input
          label="From Date"
          type="date"
          value={formData.from_date}
          onChange={(e) => {
            setFormData({ ...formData, from_date: e.target.value });
            setErrors({ ...errors, from_date: '' });
          }}
          required
          error={errors.from_date}
        />

        <Input
          label="To Date"
          type="date"
          value={formData.to_date}
          onChange={(e) => {
            setFormData({ ...formData, to_date: e.target.value });
            setErrors({ ...errors, to_date: '' });
          }}
          required
          error={errors.to_date}
        />

        <Textarea
          label="Reason"
          value={formData.reason}
          onChange={(e) => {
            setFormData({ ...formData, reason: e.target.value });
            setErrors({ ...errors, reason: '' });
          }}
          rows={4}
          placeholder="Please explain your reason for leave (minimum 5 characters)"
          required
          error={errors.reason}
        />

        {errors.general && <Text color="danger" size="sm">{errors.general}</Text>}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 24 }}>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>Apply Leave</Button>
        </div>
      </div>
    </Drawer>
  );
}
