'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Checkbox, Button, Text } from '@/components';
import { holidaysApi, Holiday } from '@/lib/api';
import { dropdownsApi } from '@/lib/api';
import { useToast } from '@/components/Toast/Toast';

interface HolidayModalProps {
  isOpen: boolean;
  holiday?: Holiday | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function HolidayModal({ isOpen, holiday, onClose, onSuccess }: HolidayModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [holidayTypes, setHolidayTypes] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    holiday_date: '',
    holiday_type_id: '',
    description: '',
    is_optional: false,
    work_location_id: '',
  });

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name,
        holiday_date: holiday.holiday_date,
        holiday_type_id: holiday.holiday_type_id,
        description: holiday.description || '',
        is_optional: holiday.is_optional || false,
        work_location_id: holiday.work_location_id || '',
      });
    } else {
      setFormData({
        name: '',
        holiday_date: '',
        holiday_type_id: '',
        description: '',
        is_optional: false,
        work_location_id: '',
      });
    }
  }, [holiday, isOpen]);

  useEffect(() => {
    if (isOpen && holidayTypes.length === 0) {
      dropdownsApi.getHolidayTypes?.().then((res: any) => {
        const types = res?.response?.data ?? res?.response ?? [];
        setHolidayTypes(Array.isArray(types) ? types : []);
      }).catch(() => {});

      dropdownsApi.getWorkLocations?.().then((res: any) => {
        const locs = res?.response?.data ?? res?.response ?? [];
        setWorkLocations(Array.isArray(locs) ? locs : []);
      }).catch(() => {});
    }
  }, [isOpen, holidayTypes.length]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Holiday name is required';
    if (!formData.holiday_date) newErrors.holiday_date = 'Holiday date is required';
    if (!formData.holiday_type_id) newErrors.holiday_type_id = 'Holiday type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        holiday_date: formData.holiday_date,
        holiday_type_id: formData.holiday_type_id,
        description: formData.description || undefined,
        is_optional: formData.is_optional,
        ...(formData.work_location_id ? { work_location_id: formData.work_location_id } : {}),
      };

      if (holiday?.id) {
        await holidaysApi.update(holiday.id, payload);
        addToast({ variant: 'success', title: 'Success', message: 'Holiday updated successfully!' });
      } else {
        await holidaysApi.create(payload as any);
        addToast({ variant: 'success', title: 'Success', message: 'Holiday created successfully!' });
      }

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: error.message || 'Failed to save holiday' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', holiday_date: '', holiday_type_id: '', description: '', is_optional: false, work_location_id: '' });
    setErrors({});
    onClose();
  };

  const footer = (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
      <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {holiday ? 'Update' : 'Create'} Holiday
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={holiday ? 'Edit Holiday' : 'Add Holiday'} footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
        <Input
          label="Holiday Name"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            setErrors({ ...errors, name: '' });
          }}
          required
          error={errors.name}
        />

        <Input
          label="Holiday Date"
          type="date"
          value={formData.holiday_date}
          onChange={(e) => {
            setFormData({ ...formData, holiday_date: e.target.value });
            setErrors({ ...errors, holiday_date: '' });
          }}
          required
          error={errors.holiday_date}
        />

        <Select
          label="Holiday Type"
          value={formData.holiday_type_id}
          onChange={(e) => {
            setFormData({ ...formData, holiday_type_id: e.target.value });
            setErrors({ ...errors, holiday_type_id: '' });
          }}
          options={holidayTypes.map((t: any) => ({ label: t.name, value: t.id }))}
          required
          error={errors.holiday_type_id}
        />

        <Select
          label="Work Location (Optional)"
          value={formData.work_location_id}
          onChange={(e) => setFormData({ ...formData, work_location_id: e.target.value })}
          options={[{ label: 'All Locations', value: '' }, ...workLocations.map((l: any) => ({ label: l.name, value: l.id }))]}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Optional description"
        />

        <Checkbox
          label="Optional Holiday"
          checked={formData.is_optional}
          onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
        />
      </div>
    </Modal>
  );
}
