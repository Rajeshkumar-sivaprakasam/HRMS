'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { DataTable, Button, Modal, Input, Badge, Icon, Select, Toggle, Textarea, Alert, Spinner, ConfirmDialog } from '@/components';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import { apiService } from '@/app/core/services/api-service';
import { useTranslation } from '@/lib/i18n';
import styles from '../(shell)/settings/settings.module.scss';

interface DropdownItem {
  id: string | number;
  name?: string;
  label?: string;
  code?: string;
  value?: string;
  slug?: string;
  text?: string;
  display_name?: string;
  [key: string]: any;
}

const DropdownTable = ({
  endpoint,
  crudEndpoint,
  title,
  description,
  isEditable = false,
  secondField,
  hasActiveToggle = false,
}: {
  endpoint: string;
  crudEndpoint?: string;
  title: string;
  description: string;
  isEditable?: boolean;
  secondField?: { name: string; label: string; placeholder: string; required?: boolean };
  hasActiveToggle?: boolean;
}) => {
  const { t } = useTranslation();
  const crud = crudEndpoint || endpoint;
  const sf = secondField || { name: 'code', label: t('settings.field_code'), placeholder: 'e.g. ENG', required: true };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DropdownItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ name: '', [sf.name]: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DropdownItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(() => {
    const secondCol = secondField
      ? {
          id: secondField.name,
          header: secondField.label,
          accessor: (row: DropdownItem) => (
            <span style={{ color: '#64748b', fontSize: 13 }}>{row[secondField.name] || '-'}</span>
          ),
          sortable: true,
        }
      : {
          id: 'code',
          header: t('settings.field_code'),
          accessor: (row: DropdownItem) => {
            const code = row.code || row.slug || (row.value !== row.id ? row.value : null);
            const isGuid = typeof code === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
            return (
              <code style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                {(!isGuid && code) ? code : '-'}
              </code>
            );
          },
          sortable: true,
        };

    return [
      {
        id: 'name',
        header: t('settings.field_name'),
        accessor: (row: DropdownItem) => (
          <span style={{ fontWeight: 500 }}>{row.name || row.label || row.text || row.display_name || 'N/A'}</span>
        ),
        sortable: true,
      },
      secondCol,
    ];
  }, [secondField, t]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', [sf.name]: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DropdownItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || item.label || '',
      [sf.name]: item[sf.name] || item.code || item.value || '',
      is_active: item.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item: DropdownItem) => setDeleteTarget(item);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiService.delete(`${crud}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = editingItem && hasActiveToggle
        ? formData
        : { name: formData.name, [sf.name]: formData[sf.name] };
      if (editingItem) {
        await apiService.put(`${crud}/${editingItem.id}`, payload);
      } else {
        await apiService.post(crud, payload);
      }
      setIsModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowActions = isEditable ? [
    { id: 'edit', label: t('common.edit'), icon: 'edit' as const, onClick: (row: DropdownItem) => handleOpenEdit(row) },
    { id: 'delete', label: t('common.delete'), icon: 'trash' as const, danger: true, onClick: (row: DropdownItem) => handleDelete(row) },
  ] : [];

  const toolbarActions = isEditable ? [
    { id: 'add', label: t('common.add'), icon: 'plus' as const, variant: 'primary' as const, onClick: handleOpenAdd },
  ] : [];

  return (
    <div className={styles.tableCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
            {isEditable && <Badge color="success" size="sm">Editable</Badge>}
          </div>
          <span style={{ color: '#64748b', fontSize: 13 }}>{description}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <DataTable<DropdownItem>
          key={refreshKey}
          columns={columns as any}
          apiConfig={{
            url: endpoint,
            method: 'GET',
            transformParams: () => ({}),

          }}
          rowActions={rowActions}
          toolbarActions={toolbarActions}
          pageSize={5}
          searchable
          emptyMessage={t('common.no_data')}
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        message={`${t('common.are_you_sure')} "${deleteTarget?.name || deleteTarget?.label}"?`}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `${t('common.edit')} ${title.slice(0, -1)}` : `${t('common.add')} ${title.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
          <Input
            label={t('settings.field_name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Engineering"
          />
          {sf.name === 'code' ? (
            <Input
              label={sf.label}
              value={formData[sf.name] || ''}
              onChange={(e) => setFormData({ ...formData, [sf.name]: e.target.value })}
              required={sf.required !== false}
              placeholder={sf.placeholder}
            />
          ) : (
            <Textarea
              label={sf.label}
              value={formData[sf.name] || ''}
              onChange={(e) => setFormData({ ...formData, [sf.name]: e.target.value })}
              placeholder={sf.placeholder}
              rows={3}
            />
          )}
          {hasActiveToggle && editingItem && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Toggle
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span style={{ fontSize: 13 }}>{t('settings.active')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {editingItem ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const HolidayTable = ({ endpoint, title, description, isEditable }: any) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    holiday_date: '',
    holiday_type_id: '',
    description: '',
    is_optional: false,
    work_location_id: '' as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [holidayTypes, setHolidayTypes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const fetchDropdowns = async () => {
      try {
        const [locRes, typeRes]: any[] = await Promise.all([
          apiService.get<any>(API_ENDPOINTS.DROPDOWNS.WORK_LOCATIONS),
          apiService.get<any>(API_ENDPOINTS.DROPDOWNS.HOLIDAY_TYPES),
        ]);
        const locs = locRes.response?.data || locRes.data || locRes.response || [];
        const types = typeRes.response?.data || typeRes.data || typeRes.response || [];
        setWorkLocations(Array.isArray(locs) ? locs : []);
        setHolidayTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        console.error('Failed to fetch dropdowns', err);
      }
    };
    fetchDropdowns();
  }, [isModalOpen]);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res: any = await apiService.get<any>(endpoint);
        const data = res.response?.data || res.data || res.response || [];
        setHolidays(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setApiError(err.message || 'Failed to load holidays');
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, [endpoint, refreshKey]);

  const columns = useMemo(() => [
    {
      id: 'name',
      header: t('settings.holiday_name'),
      accessor: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span>,
      sortable: true
    },
    {
      id: 'date',
      header: t('common.date'),
      accessor: (row: any) => <span>{new Date(row.holiday_date).toLocaleDateString()}</span>,
      sortable: true
    },
    {
      id: 'type',
      header: t('common.type'),
      accessor: (row: any) => <Badge color="info" size="sm">{row.holiday_type_name || row.holiday_type_id}</Badge>,
      sortable: true,
    },
    {
      id: 'optional',
      header: t('settings.optional'),
      accessor: (row: any) => row.is_optional ? <Badge color="warning" size="sm">Yes</Badge> : <Badge color="neutral" size="sm">No</Badge>
    },
    {
      id: 'location',
      header: t('settings.work_location'),
      accessor: (row: any) => {
        const found = workLocations.find(l => l.id === row.work_location_id);
        const locationName = row.work_location_name || found?.label || found?.name;
        return <span>{locationName || 'Global'}</span>;
      }
    }
  ], [workLocations, t]);

  const buildPayload = () => ({
    name: formData.name,
    holiday_date: formData.holiday_date,
    holiday_type_id: formData.holiday_type_id,
    description: formData.description,
    is_optional: formData.is_optional,
    ...(formData.work_location_id ? { work_location_id: formData.work_location_id } : {}),
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await apiService.put(`${endpoint}/${editingItem.id}`, buildPayload());
      } else {
        await apiService.post(endpoint, buildPayload());
      }
      setIsModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      holiday_date: '',
      holiday_type_id: '',
      description: '',
      is_optional: false,
      work_location_id: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      holiday_date: item.holiday_date || '',
      holiday_type_id: item.holiday_type_id || '',
      description: item.description || '',
      is_optional: !!item.is_optional,
      work_location_id: item.work_location_id || null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item: any) => setDeleteTarget(item);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiService.delete(`${endpoint}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
            {isEditable && <Badge color="success" size="sm">Editable</Badge>}
          </div>
          <span style={{ color: '#64748b', fontSize: 13 }}>{description}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {apiError && (
          <Alert variant="error" title="Failed to load holidays" style={{ margin: '16px 0' }}>
            {apiError}
          </Alert>
        )}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner size="md" />
          </div>
        )}
        {!apiError && !loading && (
          <DataTable<any>
            columns={columns as any}
            data={holidays}
            rowActions={isEditable ? [
              { id: 'edit', label: t('common.edit'), icon: 'edit' as const, onClick: handleOpenEdit },
              { id: 'delete', label: t('common.delete'), icon: 'trash' as const, danger: true, onClick: handleDelete },
            ] : []}
            toolbarActions={isEditable ? [
              { id: 'add', label: t('common.add'), icon: 'plus' as const, variant: 'primary' as const, onClick: handleOpenAdd },
            ] : []}
            pageSize={5}
            searchable
            emptyMessage={t('common.no_data')}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        message={`${t('common.are_you_sure')} "${deleteTarget?.name}"?`}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `${t('common.edit')} ${t('settings.holiday_name')}` : `${t('common.add')} ${t('settings.holiday_name')}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          <Input
            label={t('settings.holiday_name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder={t('settings.holiday_name_placeholder')}
          />
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <Input
                label={t('common.date')}
                type="date"
                value={formData.holiday_date}
                onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label={t('common.type')}
                value={formData.holiday_type_id}
                onChange={(val) => setFormData({ ...formData, holiday_type_id: val as string })}
                options={holidayTypes.map(ht => ({ label: ht.name || ht.label, value: ht.id }))}
              />
            </div>
          </div>
          <Select
            label={`${t('settings.work_location')} (${t('settings.optional')})`}
            value={formData.work_location_id ?? ''}
            onChange={(val) => setFormData({ ...formData, work_location_id: (val as string) || null })}
            options={[
              { label: 'Global / All Locations', value: '' },
              ...workLocations.map(l => ({ label: l.label || l.name, value: l.id }))
            ]}
            clearable
          />
          <Textarea
            label={t('common.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief details about the holiday..."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Toggle
              checked={formData.is_optional}
              onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
            />
            <span style={{ fontSize: 13 }}>{t('settings.holiday_optional_label')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {editingItem ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


const AccountTypeTable = ({ endpoint, crudEndpoint, title, description: desc, isEditable }: any) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(() => [
    { id: 'name', header: t('settings.field_name'), accessor: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span>, sortable: true },
    { id: 'code', header: t('settings.field_code'), accessor: (row: any) => row.code
      ? <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{row.code}</code>
      : <span style={{ color: '#94a3b8' }}>-</span>, sortable: true },
    { id: 'description', header: t('common.description'), accessor: (row: any) => <span style={{ color: '#64748b', fontSize: 13 }}>{row.description || '-'}</span> },
    { id: 'status', header: t('common.status'), accessor: (row: any) => <Badge color={row.is_active ? 'success' : 'neutral'} size="sm">{row.is_active ? t('status.active') : t('status.inactive')}</Badge> },
  ], [t]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', description: '', is_active: true });
    setIsModalOpen(true);
  };
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ name: item.name || '', code: item.code || '', description: item.description || '', is_active: item.is_active !== false });
    setIsModalOpen(true);
  };
  const handleDelete = (item: any) => setDeleteTarget(item);
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiService.delete(`${crudEndpoint}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name: formData.name, code: formData.code || null, description: formData.description || null, is_active: formData.is_active };
      if (editingItem) await apiService.put(`${crudEndpoint}/${editingItem.id}`, payload);
      else await apiService.post(crudEndpoint, payload);
      setIsModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
            {isEditable && <Badge color="success" size="sm">Editable</Badge>}
          </div>
          <span style={{ color: '#64748b', fontSize: 13 }}>{desc}</span>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <DataTable<any>
          key={refreshKey}
          columns={columns as any}
          apiConfig={{
            url: endpoint,
            method: 'GET',
            transformParams: () => ({}),

          }}
          rowActions={isEditable ? [
            { id: 'edit', label: t('common.edit'), icon: 'edit' as const, onClick: handleOpenEdit },
            { id: 'delete', label: t('common.delete'), icon: 'trash' as const, danger: true, onClick: handleDelete },
          ] : []}
          toolbarActions={isEditable ? [{ id: 'add', label: t('common.add'), icon: 'plus' as const, variant: 'primary' as const, onClick: handleOpenAdd }] : []}
          pageSize={5} searchable emptyMessage={t('common.no_data')}
        />
      </div>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} loading={isDeleting}
        message={`${t('common.are_you_sure')} "${deleteTarget?.name}"?`} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `${t('common.edit')} ${title}` : `${t('common.add')} ${title}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0' }}>
          <Input label={t('settings.field_name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Savings Account" />
          <Input label={`${t('settings.field_code')} (${t('settings.optional')})`} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. SAV" />
          <Textarea label={`${t('common.description')} (${t('settings.optional')})`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows={3} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
            <span style={{ fontSize: 13 }}>{t('settings.active')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>{editingItem ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const LeavePlanTable = ({ endpoint, crudEndpoint, title, description: desc, isEditable }: any) => {
  const { t } = useTranslation();
  const emptyEntry = () => ({ type: '', days: '' as string | number });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ country: '', description: '', is_active: true });
  const [entries, setEntries] = useState([emptyEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setApiError(null);
      try {
        const res: any = await apiService.get(endpoint);
        const d = res.response?.data || res.data || res.response || [];
        setPlans(Array.isArray(d) ? d : []);
      } catch (err: any) { setApiError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [endpoint, refreshKey]);

  const columns = useMemo(() => [
    { id: 'country', header: t('settings.field_country'), accessor: (row: any) => <span style={{ fontWeight: 500 }}>{row.country}</span>, sortable: true },
    { id: 'leave_types', header: t('settings.leave_allocations'), accessor: (row: any) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {Object.entries(row.leave_types || {}).map(([lt, d]) => (
          <Badge key={lt} color="info" size="sm">{lt}: {d as number} {(d as number) === 1 ? 'Day' : 'Days'}</Badge>
        ))}
      </div>
    )},
    { id: 'description', header: t('common.description'), accessor: (row: any) => <span style={{ color: '#64748b', fontSize: 13 }}>{row.description || '-'}</span> },
    { id: 'status', header: t('common.status'), accessor: (row: any) => <Badge color={row.is_active ? 'success' : 'neutral'} size="sm">{row.is_active ? t('status.active') : t('status.inactive')}</Badge> },
  ], [t]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ country: '', description: '', is_active: true });
    setEntries([emptyEntry()]);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ country: item.country || '', description: item.description || '', is_active: item.is_active !== false });
    setEntries(Object.entries(item.leave_types || {}).map(([type, days]) => ({ type, days: days as number })));
    setIsModalOpen(true);
  };
  const handleDelete = (item: any) => setDeleteTarget(item);
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiService.delete(`${crudEndpoint}/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  const updateEntry = (i: number, field: 'type' | 'days', val: string) =>
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addEntry = () => setEntries(prev => [...prev, emptyEntry()]);
  const removeEntry = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const leave_types = Object.fromEntries(
      entries.filter(e => e.type.trim()).map(e => [e.type.toUpperCase().trim(), Number(e.days) || 0])
    );
    if (!Object.keys(leave_types).length) { alert('Add at least one leave type.'); return; }
    setIsSubmitting(true);
    try {
      const payload = { country: formData.country, description: formData.description || null, is_active: formData.is_active, leave_types };
      if (editingItem) await apiService.put(`${crudEndpoint}/${editingItem.id}`, payload);
      else await apiService.post(crudEndpoint, payload);
      setIsModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
            {isEditable && <Badge color="success" size="sm">Editable</Badge>}
          </div>
          <span style={{ color: '#64748b', fontSize: 13 }}>{desc}</span>
        </div>
      </div>
      <div className={styles.tableContainer}>
        {apiError && <Alert variant="error" title="Failed to load" style={{ margin: '16px 0' }}>{apiError}</Alert>}
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size="md" /></div>}
        {!apiError && !loading && (
          <DataTable<any>
            columns={columns as any} data={plans}
            rowActions={isEditable ? [
              { id: 'edit', label: t('common.edit'), icon: 'edit' as const, onClick: handleOpenEdit },
              { id: 'delete', label: t('common.delete'), icon: 'trash' as const, danger: true, onClick: handleDelete },
            ] : []}
            toolbarActions={isEditable ? [{ id: 'add', label: t('common.add'), icon: 'plus' as const, variant: 'primary' as const, onClick: handleOpenAdd }] : []}
            pageSize={5} searchable emptyMessage={t('common.no_data')}
          />
        )}
      </div>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} loading={isDeleting}
        message={`${t('common.are_you_sure')} "${deleteTarget?.country}"?`} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `${t('common.edit')} ${title}` : `${t('common.add')} ${title}`} size="md">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0' }}>
          <Input label={t('settings.field_country')} value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required placeholder="e.g. India" />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Leave Type Allocations</span>
              <Button type="button" variant="secondary" size="sm" onClick={addEntry}>+ Add Type</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 2 }}>
                    <Input label={i === 0 ? 'Leave Type Code' : ''} value={entry.type} onChange={e => updateEntry(i, 'type', e.target.value)} placeholder="e.g. CL, SL, PL" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input label={i === 0 ? 'Days' : ''} type="number" value={String(entry.days)} onChange={e => updateEntry(i, 'days', e.target.value)} placeholder="12" />
                  </div>
                  {entries.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(i)} style={{ marginBottom: 2 }}>
                      <Icon name="trash" size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Textarea label={`${t('common.description')} (${t('settings.optional')})`} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief notes about this leave plan..." rows={2} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
            <span style={{ fontSize: 13 }}>{t('settings.active')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>{editingItem ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default function SettingsSection() {
  const { t } = useTranslation();
  const [activeMain, setActiveMain] = useState<'config' | 'defaults'>('defaults');
  const [activeSub, setActiveSub] = useState('leave-types');

  const CONFIG_ITEMS = [
    { id: 'departments', label: t('settings.tab_departments'), icon: 'building', endpoint: API_ENDPOINTS.DROPDOWNS.DEPARTMENTS, isEditable: true, desc: t('settings.desc_departments') },
    { id: 'designations', label: t('settings.tab_designations'), icon: 'briefcase', endpoint: API_ENDPOINTS.DROPDOWNS.DESIGNATIONS, isEditable: true, desc: t('settings.desc_designations') },
    { id: 'work-locations', label: t('settings.tab_work_locations'), icon: 'map-pin', endpoint: API_ENDPOINTS.DROPDOWNS.WORK_LOCATIONS, isEditable: true, desc: t('settings.desc_work_locations') },
    { id: 'holidays', label: t('settings.tab_holidays'), icon: 'calendar', endpoint: API_ENDPOINTS.HOLIDAYS, isEditable: true, desc: t('settings.desc_holidays') },
    {
      id: 'holiday-types', label: t('settings.tab_holiday_types'), icon: 'tag', isEditable: true,
      endpoint: API_ENDPOINTS.DROPDOWNS.HOLIDAY_TYPES,
      crudEndpoint: API_ENDPOINTS.HOLIDAY_TYPES,
      desc: t('settings.desc_holiday_types'),
      secondField: { name: 'description', label: t('common.description'), placeholder: 'Brief description of this holiday type' },
      hasActiveToggle: true,
    },
    { id: 'salary-structures', label: t('settings.tab_salary_structures'), icon: 'wallet', endpoint: API_ENDPOINTS.DROPDOWNS.SALARY_STRUCTURES, isEditable: true, desc: t('settings.desc_salary_structures') },
    { id: 'helpdesk-categories', label: t('settings.tab_helpdesk_categories'), icon: 'ticket', endpoint: API_ENDPOINTS.DROPDOWNS.HELPDESK_CATEGORIES, isEditable: true, desc: t('settings.desc_helpdesk_categories') },
    { id: 'account-types', label: t('settings.tab_account_types'), icon: 'credit-card', endpoint: API_ENDPOINTS.ACCOUNT_TYPES, crudEndpoint: API_ENDPOINTS.ACCOUNT_TYPES, isEditable: true, desc: t('settings.desc_account_types') },
    { id: 'leave-plans', label: t('settings.tab_leave_plans'), icon: 'calendar', endpoint: API_ENDPOINTS.LEAVE_PLANS, crudEndpoint: API_ENDPOINTS.LEAVE_PLANS, isEditable: true, desc: t('settings.desc_leave_plans') },
  ];

  const DEFAULT_ITEMS = [
    { id: 'leave-types', label: t('settings.tab_leave_types'), icon: 'calendar', endpoint: API_ENDPOINTS.DROPDOWNS.LEAVE_TYPES, isEditable: false, desc: t('settings.desc_leave_types') },
    { id: 'gender', label: t('settings.tab_gender'), icon: 'users', endpoint: API_ENDPOINTS.DROPDOWNS.GENDER, isEditable: false, desc: t('settings.desc_gender') },
    { id: 'employment-types', label: t('settings.tab_employment_types'), icon: 'list', endpoint: API_ENDPOINTS.DROPDOWNS.EMPLOYMENT_TYPES, isEditable: false, desc: t('settings.desc_employment_types') },
    { id: 'employee-statuses', label: t('settings.tab_employee_statuses'), icon: 'activity', endpoint: API_ENDPOINTS.DROPDOWNS.EMPLOYEE_STATUSES, isEditable: false, desc: t('settings.desc_employee_statuses') },
    { id: 'work-location-types', label: t('settings.tab_work_location_types'), icon: 'home', endpoint: API_ENDPOINTS.DROPDOWNS.WORK_LOCATION_TYPES, isEditable: false, desc: t('settings.desc_work_location_types') },
    { id: 'permission-types', label: t('settings.tab_permission_types'), icon: 'shield', endpoint: API_ENDPOINTS.DROPDOWNS.PERMISSION_TYPES, isEditable: false, desc: t('settings.desc_permission_types') },
    { id: 'tax-regimes', label: t('settings.tab_tax_regimes'), icon: 'file-text', endpoint: API_ENDPOINTS.DROPDOWNS.TAX_REGIMES, isEditable: false, desc: t('settings.desc_tax_regimes') },
    { id: 'payment-modes', label: t('settings.tab_payment_modes'), icon: 'wallet', endpoint: API_ENDPOINTS.DROPDOWNS.PAYMENT_MODES, isEditable: false, desc: t('settings.desc_payment_modes') },
    { id: 'revision-types', label: t('settings.tab_revision_types'), icon: 'refresh', endpoint: API_ENDPOINTS.DROPDOWNS.REVISION_TYPES, isEditable: false, desc: t('settings.desc_revision_types') },
  ];

  const currentItems = activeMain === 'config' ? CONFIG_ITEMS : DEFAULT_ITEMS;
  const activeItem = useMemo(() =>
    currentItems.find(i => i.id === activeSub) || currentItems[0],
    [activeSub, currentItems]
  );

  const handleMainChange = (id: 'config' | 'defaults') => {
    setActiveMain(id);
    const firstItem = id === 'config' ? CONFIG_ITEMS[0] : DEFAULT_ITEMS[0];
    setActiveSub(firstItem.id);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Toggle */}
      <div className={styles.topNav}>
        <button
          className={[styles.navItem, activeMain === 'defaults' && styles.active].join(' ')}
          onClick={() => handleMainChange('defaults')}
        >
          {t('settings.nav_system_defaults')}
        </button>
        <button
          className={[styles.navItem, activeMain === 'config' && styles.active].join(' ')}
          onClick={() => handleMainChange('config')}
        >
          {t('settings.nav_configuration')}
        </button>
      </div>

      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.categoryGroup}>
            <span className={styles.groupLabel}>
              {activeMain === 'config' ? t('settings.group_company_settings') : t('settings.group_master_data')}
            </span>
            {currentItems.map(item => (
              <button
                key={item.id}
                className={[styles.sideTab, activeSub === item.id && styles.active].join(' ')}
                onClick={() => setActiveSub(item.id)}
              >
                <Icon name={item.icon as any} size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className={styles.contentArea}>
          {activeItem.id === 'holidays' ? (
            <HolidayTable
              endpoint={activeItem.endpoint}
              title={activeItem.label}
              description={activeItem.desc}
              isEditable={activeItem.isEditable}
            />
          ) : activeItem.id === 'account-types' ? (
            <AccountTypeTable
              endpoint={activeItem.endpoint}
              crudEndpoint={(activeItem as any).crudEndpoint}
              title={activeItem.label}
              description={activeItem.desc}
              isEditable={activeItem.isEditable}
            />
          ) : activeItem.id === 'leave-plans' ? (
            <LeavePlanTable
              endpoint={activeItem.endpoint}
              crudEndpoint={(activeItem as any).crudEndpoint}
              title={activeItem.label}
              description={activeItem.desc}
              isEditable={activeItem.isEditable}
            />
          ) : (
            <DropdownTable
              endpoint={activeItem.endpoint}
              crudEndpoint={(activeItem as any).crudEndpoint}
              title={activeItem.label}
              description={activeItem.desc}
              isEditable={activeItem.isEditable}
              secondField={(activeItem as any).secondField}
              hasActiveToggle={(activeItem as any).hasActiveToggle}
            />
          )}
        </main>
      </div>
    </div>
  );
}
