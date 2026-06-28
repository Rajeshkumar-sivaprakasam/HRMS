'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Typography, Button, Icon, Modal, Input, Select, Textarea, DataTable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import { helpdeskApi, type HelpdeskTicket, type TicketPriority, type TicketStatus } from '@/lib/api';
import type { DataTableColumn } from '@/components';
import styles from '../(shell)/helpdesk/helpdesk.module.scss';

// ── Status / priority display config ─────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: '#1d4ed8', bg: '#dbeafe' },
  in_progress: { label: 'In progress', color: '#c2410c', bg: '#ffedd5' },
  resolved:    { label: 'Resolved',    color: '#15803d', bg: '#dcfce7' },
  closed:      { label: 'Closed',      color: '#64748b', bg: '#f1f5f9' },
};

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#dc2626',
  medium: '#d97706',
  low:    '#94a3b8',
};

type TabId = 'all' | TicketStatus;

const TABS: { id: TabId; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'open',        label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved',    label: 'Resolved' },
  { id: 'closed',      label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1)    return 'Just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffHours < 24)  return `${diffHours}h ago`;
  if (diffDays === 1)  return 'Yesterday';
  if (diffDays < 30)   return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function HelpdeskSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab]   = useState<TabId>('all');
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [catDropdownOpen, setCatDropdownOpen]   = useState(false);
  const [tableKey, setTableKey]     = useState(0);

  // Raise ticket form
  const [raiseOpen, setRaiseOpen]     = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formCatId, setFormCatId]     = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('medium');
  const [formDesc, setFormDesc]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // View ticket detail
  const [viewTicket, setViewTicket] = useState<HelpdeskTicket | null>(null);

  const catDropdownRef = useRef<HTMLDivElement>(null);
  const categoriesLoaded = useRef(false);

  // ── Load categories lazily when the raise-ticket dialog opens ───────────────

  useEffect(() => {
    if (!raiseOpen || categoriesLoaded.current) return;
    categoriesLoaded.current = true;
    helpdeskApi.categories()
      .then((res: any) => {
        const list = Array.isArray(res?.response) ? res.response : [];
        setCategories(list.map((c: any) => ({ value: c.id, label: c.name })));
      })
      .catch(() => {});
  }, [raiseOpen]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── DataTable API config ────────────────────────────────────────────────────

  const apiConfig = useMemo(() => ({
    url: API_ENDPOINTS.HELPDESK.LIST,
    method: 'POST' as const,
    transformParams: ({ page, pageSize, search }: { page: number; pageSize: number; search: string }) => ({
      filter: {
        sortBy:    'created_at',
        sortOrder: 'desc',
        ...(activeTab !== 'all' ? { status: activeTab }             : {}),
        ...(activeCategoryId    ? { category_id: activeCategoryId } : {}),
        ...(search              ? { search }                        : {}),
      },
      pagination:     { page, size: pageSize },
      paginationFlag: true,
    }),
    mapResponse: (res: any) => ({
      data:  res?.response?.data ?? (Array.isArray(res?.response) ? res.response : []),
      total: res?.response?.meta?.totalRecords ?? res?.response?.totalRecords ?? res?.response?.total ?? res?.response?.count ?? 0,
    }),
  }), [activeTab, activeCategoryId]);

  // ── Column definitions ──────────────────────────────────────────────────────

  const columns = useMemo<DataTableColumn<HelpdeskTicket>[]>(() => [
    {
      id: 'ticket',
      header: t('helpdesk.ticket'),
      minWidth: '300px',
      accessor: (row) => (
        <div className={styles.ticketCell}>
          <span className={styles.ticketNum}>#{row.ticket_number}</span>
          <span className={styles.ticketTitle}>{row.subject}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: t('helpdesk.category'),
      width: '160px',
      accessor: (row) => (
        <span className={styles.categoryBadge}>{row.category_name ?? '—'}</span>
      ),
    },
    {
      id: 'priority',
      header: t('helpdesk.priority'),
      width: '120px',
      accessor: (row) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_COLOR[row.priority] ?? '#94a3b8' }}>
          {row.priority}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      width: '140px',
      accessor: (row) => {
        const cfg = STATUS_CFG[row.status] ?? STATUS_CFG.closed;
        return (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: cfg.color, background: cfg.bg,
            padding: '3px 10px', borderRadius: 9999,
            whiteSpace: 'nowrap',
          }}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: 'updated_at',
      header: t('common.date'),
      width: '120px',
      accessor: (row) => (
        <span className={styles.updatedText}>{formatRelativeTime(row.updated_at)}</span>
      ),
    },
    {
      id: '_chevron',
      header: '',
      width: '48px',
      align: 'right',
      accessor: (row) => (
        <button
          className={styles.chevronBtn}
          onClick={(e) => { e.stopPropagation(); setViewTicket(row); }}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      ),
    },
  ], [t]);

  // ── Raise ticket handlers ───────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormSubject('');
    setFormCatId('');
    setFormPriority('medium');
    setFormDesc('');
    setSubmitError('');
  }, []);

  const handleRaiseClose = useCallback(() => {
    setRaiseOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!formSubject.trim() || !formCatId || !formDesc.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      await helpdeskApi.create({
        subject:     formSubject.trim(),
        category_id: formCatId,
        priority:    formPriority,
        description: formDesc.trim(),
      });
      handleRaiseClose();
      setTableKey(k => k + 1);
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to raise ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formSubject, formCatId, formPriority, formDesc, handleRaiseClose]);

  const activeCategoryLabel = categories.find(c => c.value === activeCategoryId)?.label;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Typography variant="h2" className={styles.pageTitle}>{t('helpdesk.title')}</Typography>
          <Typography as="p" className={styles.pageSubtitle}>{t('helpdesk.subtitle')}</Typography>
        </div>
        <Button
          variant="primary"
          iconLeft={<Icon name="plus" size={16} />}
          onClick={() => setRaiseOpen(true)}
        >
          {t('helpdesk.raise_ticket')}
        </Button>
      </div>

      {/* ── Tickets card ── */}
      <Card className={styles.card}>

        {/* Tab bar */}
        <div className={styles.tabBar}>
          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category dropdown filter */}
          <div ref={catDropdownRef} style={{ position: 'relative' }}>
            <button
              className={`${styles.filterBtn} ${activeCategoryId ? styles.filterBtnActive : ''}`}
              onClick={() => setCatDropdownOpen(o => !o)}
            >
              <Icon name="filter" size={14} />
              {activeCategoryLabel ?? 'Category'}
            </button>
            {catDropdownOpen && (
              <div className={styles.categoryDropdown}>
                <button
                  className={`${styles.categoryOption} ${!activeCategoryId ? styles.categoryOptionActive : ''}`}
                  onClick={() => { setActiveCategoryId(''); setCatDropdownOpen(false); }}
                >
                  All categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    className={`${styles.categoryOption} ${activeCategoryId === cat.value ? styles.categoryOptionActive : ''}`}
                    onClick={() => { setActiveCategoryId(cat.value); setCatDropdownOpen(false); }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket table */}
        <DataTable<HelpdeskTicket>
          key={`${activeTab}:${activeCategoryId}:${tableKey}`}
          columns={columns}
          apiConfig={apiConfig}
          searchable
          pageSize={10}
          emptyMessage={t('helpdesk.no_tickets')}
        />
      </Card>

      {/* ── Raise Ticket Modal ── */}
      <Modal
        isOpen={raiseOpen}
        onClose={handleRaiseClose}
        title="Raise a ticket"
        size="md"
      >
        <div className={styles.formGrid}>
          <Input
            label={t('helpdesk.subject')}
            placeholder={t('helpdesk.subject_placeholder')}
            value={formSubject}
            onChange={e => setFormSubject(e.target.value)}
            required
          />
          <div className={styles.formRow}>
            <Select
              label={t('helpdesk.category')}
              options={categories}
              value={formCatId}
              onChange={val => setFormCatId(val as string)}
              placeholder="Select category"
              required
            />
            <Select
              label={t('helpdesk.priority')}
              options={PRIORITY_OPTIONS}
              value={formPriority}
              onChange={val => setFormPriority(val as TicketPriority)}
            />
          </div>
          <Textarea
            label={t('helpdesk.description')}
            placeholder={t('helpdesk.description_placeholder')}
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            rows={4}
            required
          />
          {submitError && (
            <p className={styles.errorText}>{submitError}</p>
          )}
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={handleRaiseClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {t('helpdesk.submit_ticket')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── View Ticket Modal ── */}
      <Modal
        isOpen={!!viewTicket}
        onClose={() => setViewTicket(null)}
        title={viewTicket ? `Ticket #${viewTicket.ticket_number}` : ''}
        size="md"
      >
        {viewTicket && (
          <div className={styles.detailGrid}>

            {/* Subject */}
            <div>
              <p className={styles.detailLabel}>{t('helpdesk.subject')}</p>
              <p className={styles.detailValue}>{viewTicket.subject}</p>
            </div>

            {/* Status / Priority / Category */}
            <div className={styles.detailMeta}>
              <div>
                <p className={styles.detailLabel}>{t('common.status')}</p>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: STATUS_CFG[viewTicket.status]?.color ?? '#64748b',
                  background: STATUS_CFG[viewTicket.status]?.bg ?? '#f1f5f9',
                  padding: '3px 10px', borderRadius: 9999,
                }}>
                  {STATUS_CFG[viewTicket.status]?.label ?? viewTicket.status}
                </span>
              </div>
              <div>
                <p className={styles.detailLabel}>{t('helpdesk.priority')}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: PRIORITY_COLOR[viewTicket.priority] ?? '#64748b', margin: 0 }}>
                  {viewTicket.priority}
                </p>
              </div>
              <div>
                <p className={styles.detailLabel}>{t('helpdesk.category')}</p>
                <p className={styles.detailValue}>{viewTicket.category_name ?? '—'}</p>
              </div>
            </div>

            {/* Description */}
            {viewTicket.description && (
              <div>
                <p className={styles.detailLabel}>{t('helpdesk.description')}</p>
                <div className={styles.descriptionBox}>{viewTicket.description}</div>
              </div>
            )}

            {/* Dates */}
            <div className={styles.detailMetaPair}>
              <div>
                <p className={styles.detailLabel}>{t('common.date')}</p>
                <p className={styles.detailValue}>{fmtDate(viewTicket.created_at)}</p>
              </div>
              <div>
                <p className={styles.detailLabel}>{t('helpdesk.last_updated')}</p>
                <p className={styles.detailValue}>{formatRelativeTime(viewTicket.updated_at)}</p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setViewTicket(null)}>{t('common.close')}</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
