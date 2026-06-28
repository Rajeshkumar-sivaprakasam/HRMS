'use client';
import React, { useEffect, useState } from 'react';
import { Card, Typography, Icon, Badge, Spinner, Modal, Button } from '@/components';
import { notificationsApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import styles from '../(shell)/notifications/notifications.module.scss';

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  type: string;
  is_read: boolean;
}

export default function NotificationsSection() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res: any = await notificationsApi.list(false);
      const data = res.response?.data || res.data || res.response || [];
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotifClick = async (n: Notification) => {
    setSelectedNotif(n);
    setIsModalOpen(true);

    if (!n.is_read) {
      // Optimistic update - move BEFORE await
      setNotifications(prev => prev.map(item =>
        item.id === n.id ? { ...item, is_read: true } : item
      ));

      try {
        await notificationsApi.markAsRead(n.id);
      } catch (err) {
        console.error('Failed to mark as read', err);
        // Rollback if needed
        setNotifications(prev => prev.map(item =>
          item.id === n.id ? { ...item, is_read: false } : item
        ));
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIconConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'leave_approved':
      case 'permission_approved':
      case 'success':
        return { icon: 'check-circle', color: '#10b981', bg: '#f0fdf4' };
      case 'payslip_released':
      case 'info':
        return { icon: 'file-text', color: '#3b82f6', bg: '#eff6ff' };
      case 'warning':
        return { icon: 'alert-circle', color: '#f59e0b', bg: '#fffbeb' };
      case 'error':
        return { icon: 'x-circle', color: '#ef4444', bg: '#fef2f2' };
      default:
        return { icon: 'bell', color: '#64748b', bg: '#f8fafc' };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Typography variant="h2">{t('notifications.title')}</Typography>
          <Badge color="primary" variant="subtle" size="lg">
            {notifications.filter(n => !n.is_read).length} {t('notifications.unread')}
          </Badge>
        </div>
        {notifications.some(n => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            {t('notifications.mark_all_read')}
          </Button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="bell" size={48} color="#cbd5e1" className={styles.emptyIcon} />
            <Typography color="secondary">{t('notifications.all_caught_up')}</Typography>
          </div>
        ) : (
          notifications.map((n) => {
            const config = getIconConfig(n.type);
            return (
              <div
                key={n.id}
                className={[styles.notifItem, n.is_read && styles.read].join(' ')}
                onClick={() => handleNotifClick(n)}
              >
                <div className={styles.iconBox} style={{ backgroundColor: config.bg }}>
                  <Icon name={config.icon} size={20} color={config.color} />
                </div>
                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <span className={styles.notifTitle}>{n.title}</span>
                    <span className={styles.time}>{formatTime(n.created_at)}</span>
                  </div>
                  <Typography as="p" className={styles.message}>{n.body}</Typography>
                </div>
                {!n.is_read && <div className={styles.unreadDot} />}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedNotif?.title || t('notifications.notification_details')}
        size="md"
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div
              className={styles.modalIcon}
              style={{ backgroundColor: getIconConfig(selectedNotif?.type || '').bg }}
            >
              <Icon
                name={getIconConfig(selectedNotif?.type || '').icon}
                size={24}
                color={getIconConfig(selectedNotif?.type || '').color}
              />
            </div>
            <div className={styles.modalMeta}>
              <Typography weight="bold" size="lg">{selectedNotif?.title}</Typography>
              <Typography size="sm" color="secondary">
                {selectedNotif && new Date(selectedNotif.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </Typography>
            </div>
          </div>
          <div className={styles.modalBody}>
            <Typography>{selectedNotif?.body}</Typography>
          </div>
          <div className={styles.modalFooter}>
            <Button variant="primary" fullWidth onClick={() => setIsModalOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
