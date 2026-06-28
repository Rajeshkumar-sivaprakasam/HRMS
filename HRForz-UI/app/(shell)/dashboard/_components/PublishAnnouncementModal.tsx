import React, { useState } from 'react';
import { Modal, Button, Icon, Heading, useToast, Input, Select, Textarea, Checkbox } from '@/components';
import styles from './PublishAnnouncementModal.module.scss';
import { dashboardApi } from '@/lib/api';

interface PublishAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: any;
}

export const PublishAnnouncementModal: React.FC<PublishAnnouncementModalProps> = ({ 
  isOpen, onClose, onSuccess, editingItem 
}) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    category: 'policy',
    title: '',
    message: '',
    audience: 'all',
    publishTime: 'now',
    isPinned: false
  });

  React.useEffect(() => {
    if (editingItem) {
      setFormData({
        category: editingItem.type || 'policy',
        title: editingItem.title || '',
        message: editingItem.content || '', // Use content from editingItem if available
        audience: 'all',
        publishTime: 'now',
        isPinned: editingItem.is_pinned || false
      });
    } else {
      setFormData({
        category: 'policy',
        title: '',
        message: '',
        audience: 'all',
        publishTime: 'now',
        isPinned: false
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      addToast({ variant: 'error', title: 'Error', message: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.message,
        target_audience: formData.audience,
        target_department_id: null, // Hardcoded for now as per sample
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days expiry
        is_pinned: formData.isPinned,
        is_published: true
      };

      if (editingItem) {
        await dashboardApi.updateAnnouncement(editingItem.id, payload);
        addToast({ variant: 'success', title: 'Success', message: 'Announcement updated successfully!' });
      } else {
        await dashboardApi.publishAnnouncement(payload);
        addToast({ variant: 'success', title: 'Success', message: 'Announcement published successfully!' });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to publish announcement:', error);
      addToast({ variant: 'error', title: 'Error', message: 'Failed to publish announcement.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish announcement" size="md">
      <div className={styles.container}>
        <p className={styles.subtitle}>Compose a new announcement and choose who sees it.</p>

        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <div className={styles.categoryGrid}>
            {['policy', 'event', 'hiring', 'general'].map(cat => (
              <button
                key={cat}
                type="button"
                className={`${styles.catBtn} ${formData.category === cat ? styles.active : ''}`}
                onClick={() => setFormData({ ...formData, category: cat })}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Title"
          placeholder="e.g. Updated Leave Policy effective June 1"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />

        <Textarea
          label="Message"
          placeholder="Write the full announcement message..."
          value={formData.message}
          onChange={e => setFormData({ ...formData, message: e.target.value })}
        />

        <div className={styles.row}>
          <Select
            label="Audience"
            options={[{ value: 'all', label: 'All employees' }, { value: 'dept', label: 'Department' }]}
            value={formData.audience}
            onChange={val => setFormData({ ...formData, audience: val as string })}
            style={{ flex: 1 }}
          />
          <Select
            label="Publish"
            options={[{ value: 'now', label: 'Now' }, { value: 'scheduled', label: 'Scheduled' }]}
            value={formData.publishTime}
            onChange={val => setFormData({ ...formData, publishTime: val as string })}
            style={{ flex: 1 }}
          />
        </div>

        <div className={styles.pinBox}>
          <Checkbox
            checked={formData.isPinned}
            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
            label={
              <div className={styles.pinLabel}>
                <strong>Pin to top of dashboard</strong>
                <span>Pinned items stay visible until unpinned.</span>
              </div>
            }
          />
          <Icon name="star" size={16} color={formData.isPinned ? '#f59e0b' : '#cbd5e1'} />
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            <Icon name={editingItem ? "check" : "plus"} size={14} /> {editingItem ? "Update" : "Publish"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
