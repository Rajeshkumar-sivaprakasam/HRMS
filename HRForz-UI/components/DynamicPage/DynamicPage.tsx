'use client';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './DynamicPage.module.scss';
import { DataTable } from '../DataTable/DataTable';
import { Drawer } from '../Drawer/Drawer';
import { Button } from '../Button/Button';
import { FnDynamicFields } from '@/app/shared/components/fn-dynamic-fields/FnDynamicFields';
import { Skeleton } from '../Skeleton/Skeleton';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { useToast } from '../Toast/Toast';
import { useTranslation } from '@/lib/i18n';
import { apiService } from '@/app/core/services/api-service';
import type {
  DynamicPageProps,
  DynamicPageField,
  DynamicPageColumn,
  DynamicPageFormConfig,
  SidebarMode,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialValues(fields: DynamicPageField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of fields) {
    values[f.name] = f.fieldType === 'checkbox' ? false : '';
  }
  return values;
}

function validateFields(
  fields: DynamicPageField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.required && (v === '' || v === null || v === undefined)) {
      errors[f.name] = `${f.label} is required`;
    }
  }
  return errors;
}

function detectChanges(
  fields: DynamicPageField[],
  formValues: Record<string, unknown>,
  original: Record<string, unknown>,
): boolean {
  for (const f of fields) {
    if (toInputString(formValues[f.name]) !== toInputString(original[f.name])) return true;
  }
  return false;
}

function formatDateTime(val: unknown): string {
  if (!val) return 'N/A';
  if (typeof val === 'string' || typeof val === 'number') {
    try { return new Date(val).toLocaleString(); } catch { return String(val); }
  }
  return 'N/A';
}

function toDisplayString(val: unknown): string {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') return String(val);
  return JSON.stringify(val);
}

function toInputString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

function resolveCellContent(col: DynamicPageColumn, row: Record<string, unknown>): React.ReactNode {
  if (col.valueFormatter) return col.valueFormatter(row);
  if (col.field) return toDisplayString(row[col.field]);
  return '—';
}

function resolveSidebarFields(mode: SidebarMode, form: DynamicPageFormConfig): DynamicPageField[] {
  if (mode === 'filter') return form.filter.map(f => ({ ...f, readOnly: false }));
  const base = form.crud;
  if (['add', 'addnew'].includes(mode)) {
    return base.filter(f => !f.addExcludeField).map(f => ({ ...f, readOnly: false }));
  }
  if (['edit', 'editnew'].includes(mode)) {
    return base.map(f => ({ ...f, readOnly: f.editDisabled ? true : f.readOnly }));
  }
  return base;
}

function selectBaseFields(mode: SidebarMode, form: DynamicPageFormConfig): DynamicPageField[] {
  if (mode === 'filter') return form.filter;
  if (['add', 'addnew'].includes(mode)) return form.crud.filter(f => !f.addExcludeField);
  return form.crud;
}

// ─── ViewCellButton ───────────────────────────────────────────────────────────

function ViewCellButton({ col, row, onView }: Readonly<{
  col: DynamicPageColumn;
  row: Record<string, unknown>;
  onView: (row: Record<string, unknown>) => void;
}>) {
  return (
    <button className={styles.cellLink} type="button" onClick={() => onView(row)}>
      {resolveCellContent(col, row)}
    </button>
  );
}

function makeViewAccessor(
  col: DynamicPageColumn,
  onView: (row: Record<string, unknown>) => void,
): (row: Record<string, unknown>) => React.ReactNode {
  return (row) => React.createElement(ViewCellButton, { col, row, onView });
}

// ─── DynamicPage ──────────────────────────────────────────────────────────────

export function DynamicPage({
  config,
  onAction,
  onSubmit,
  onFilter,
  onExport,
  onActionSuccess,
  className,
  style,
}: Readonly<DynamicPageProps>) {
  const { t } = useTranslation();
  const {
    pageHeader,
    table,
    form,
    sideBarOptions,
    viewConfig,
    hasSideBarView = true,
    payloadTransformer,
    canEdit = true,
  } = config;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('add');
  const [viewMode, setViewMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Record<string, unknown> | null>(null);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sidebarFields = useMemo(
    () => resolveSidebarFields(sidebarMode, form),
    [sidebarMode, form],
  );

  const sidebarHeader = useMemo(() => {
    if (viewMode && sidebarMode === 'view') {
      const pageTitle = sideBarOptions.additionalHeader ?? table.pageTitle ?? '';
      return sideBarOptions.header.view ?? `View ${pageTitle}`;
    }
    return sideBarOptions.header[sidebarMode] ?? '';
  }, [viewMode, sidebarMode, sideBarOptions, table.pageTitle]);

  const openSidebar = useCallback((mode: SidebarMode, row?: Record<string, unknown>) => {
    setSidebarMode(mode);
    setSelectedRow(row ?? null);
    setViewMode(false);
    setViewData(null);
    setFormErrors({});
    setIsLoadingView(false);

    const fields = selectBaseFields(mode, form);

    if (mode === 'filter') {
      setFormValues({ ...buildInitialValues(fields), ...filterValues });
    } else if (['edit', 'editnew'].includes(mode) && row) {
      const rowPayload = row.payload as Record<string, unknown> | undefined;
      setFormValues({ ...buildInitialValues(fields), ...(rowPayload ?? row) });
    } else {
      setFormValues(buildInitialValues(fields));
    }

    setSidebarOpen(true);
  }, [form, filterValues]);

  const openViewSidebar = useCallback((row: Record<string, unknown>) => {
    setViewData(row);
    setViewMode(true);
    setSidebarMode('view');
    setSelectedRow(row);
    setFormErrors({});
    setSidebarOpen(true);
  }, []);

  const handleActionClick = useCallback((
    row: Record<string, unknown>,
    actionName: string,
    isNavigate?: boolean,
  ) => {
    onAction?.(row, actionName);
    if (isNavigate) return;

    const name = actionName.toLowerCase();

    if (name === 'view') {
      if (hasSideBarView) openViewSidebar(row);
      return;
    }

    if (name === 'delete') {
      setRowToDelete(row);
      setDeleteConfirmOpen(true);
      return;
    }

    const isAdd = ['add', 'addnew'].includes(name);
    let hasFormFields: boolean;
    if (isAdd) {
      hasFormFields = form.crud.some(f => !f.addExcludeField);
    } else if (name === 'filter') {
      hasFormFields = form.filter.length > 0;
    } else {
      hasFormFields = form.crud.length > 0;
    }

    if (['add', 'addnew', 'edit', 'editnew', 'filter'].includes(name) && hasFormFields) {
      openSidebar(name as SidebarMode, row);
    }
  }, [form, hasSideBarView, onAction, openSidebar, openViewSidebar]);

  const visibleColumns = useMemo(() => {
    return table.columns.map(col => {
      if (col.cellAction !== 'view') return col;
      return { ...col, accessor: makeViewAccessor(col, openViewSidebar) };
    });
  }, [table.columns, openViewSidebar]);

  const mappedRowActions = useMemo(() => {
    if (table.rowActions?.length) {
      const restricted = new Set(['edit', 'delete', 'editnew', 'add']);
      return table.rowActions.map(action => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        danger: action.danger,
        onClick: (row: Record<string, unknown>) =>
          handleActionClick(row, action.name, action.isNavigate),
        onState: (row: Record<string, unknown>) => {
          const isRestricted = restricted.has(action.name);
          const baseVisible = isRestricted ? canEdit : true;
          const custom = action.onState?.(row);
          const rowVisible = isRestricted && 'allowEdit' in row
            ? (row.allowEdit as boolean) ?? true
            : true;
          const computedVisible = baseVisible && rowVisible;
          return {
            visible: custom?.visible === undefined ? computedVisible : computedVisible && custom.visible,
            disabled: custom?.disabled ?? false,
          };
        },
      }));
    }
    return undefined;
  }, [table.rowActions, canEdit, handleActionClick]);

  const handleToolbarClick = useCallback((name: string, isNavigate?: boolean) => {
    if (isNavigate) return;
    const lname = name.toLowerCase();
    if (['add', 'addnew'].includes(lname) && form.crud.some(f => !f.addExcludeField)) {
      openSidebar(lname as SidebarMode);
    } else if (lname === 'filter' && form.filter.length > 0) {
      openSidebar('filter');
    }
  }, [form, openSidebar]);

  const mappedToolbarActions = useMemo(() => {
    if (!table.toolbarActions?.length) return undefined;
    return table.toolbarActions.map(action => ({
      id: action.id,
      label: action.label,
      icon: action.icon,
      variant: action.variant ?? ('secondary' as const),
      onClick: () => {
        onAction?.({}, action.name);
        handleToolbarClick(action.name, action.isNavigate);
      },
    }));
  }, [table.toolbarActions, onAction, handleToolbarClick]);

  const handleFieldChange = useCallback((name: string, val: unknown) => {
    setFormValues(prev => ({ ...prev, [name]: val }));
    if (formErrors[name]) {
      setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  }, [formErrors]);

  const handleFormSubmit = useCallback(async () => {
    const errors = validateFields(sidebarFields, formValues);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    const isEdit = ['edit', 'editnew'].includes(sidebarMode);
    const rowPayload = selectedRow?.payload as Record<string, unknown> | undefined;
    const original = rowPayload ?? selectedRow ?? {};
    const shouldProceed = !isEdit || detectChanges(sidebarFields, formValues, original);

    if (shouldProceed) {
      const data = payloadTransformer ? payloadTransformer(formValues) : formValues;
      setIsSubmitting(true);
      try {
        await onSubmit?.(sidebarMode, data, selectedRow ?? undefined);
        setSidebarOpen(false);
        setFormValues({});
        onActionSuccess?.({ res: null, row: selectedRow });
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [sidebarFields, formValues, sidebarMode, selectedRow, payloadTransformer, onSubmit, onActionSuccess]);

  const handleFormCancel = useCallback(() => {
    setSidebarOpen(false);
    setFormValues({});
    setFormErrors({});
  }, []);

  const handleFilterApply = useCallback(() => {
    const payload = payloadTransformer ? payloadTransformer(formValues) : formValues;
    setFilterValues(formValues);
    onFilter?.(payload);
    setSidebarOpen(false);
  }, [formValues, payloadTransformer, onFilter]);

  const handleClearFilters = useCallback(() => {
    const initial = buildInitialValues(form.filter);
    setFormValues(initial);
    setFilterValues({});
    onFilter?.({});
  }, [form.filter, onFilter]);

  const handleConfirmDelete = useCallback(async () => {
    if (!rowToDelete || !table.deleteUrl) return;

    setIsDeleting(true);
    try {
      const id = (rowToDelete.id || rowToDelete.employee_id) as string;
      const url = typeof table.deleteUrl === 'function' ? table.deleteUrl(id) : table.deleteUrl;

      await apiService.delete(url);
      showToast(table.deleteMessage || 'Deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      onActionSuccess?.({ res: null, row: rowToDelete });
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [rowToDelete, table.deleteUrl, table.deleteMessage, showToast, onActionSuccess]);

  // ── Sidebar content ───────────────────────────────────────────────────────
  const isFilterMode = sidebarMode === 'filter';

  let sidebarContent: React.ReactNode;
  if (isLoadingView) {
    sidebarContent = (
      <div className={styles.skeletonList}>
        {['a', 'b', 'c', 'd', 'e', 'f'].map(k => (
          <div key={k} className={styles.skeletonField}>
            <Skeleton variant="text" width="40%" height="1rem" style={{ marginBottom: 6 }} />
            <Skeleton variant="text" width="100%" height="0.875rem" />
          </div>
        ))}
      </div>
    );
  } else if (viewMode && sidebarMode === 'view') {
    sidebarContent = (
      <div className={styles.viewMode}>
        {(viewConfig?.keys ?? []).map((key) => {
          const isFunc = typeof key === 'function';
          const label = isFunc
            ? (key as (r: Record<string, unknown>) => { label: string; value: unknown })(viewData ?? {})?.label ?? ''
            : key;
          const value = isFunc
            ? (key as (r: Record<string, unknown>) => { label: string; value: unknown })(viewData ?? {})?.value
            : viewData?.[key];
          return (
            <div key={label} className={styles.viewField}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{toDisplayString(value)}</span>
            </div>
          );
        })}
        <div className={styles.viewField}>
          <span className={styles.fieldLabel}>{t('common.last_modified_by')}</span>
          <span className={styles.fieldValue}>{toDisplayString(viewData?.lastModifiedBy)}</span>
        </div>
        <div className={styles.viewField}>
          <span className={styles.fieldLabel}>{t('common.last_modified_on')}</span>
          <span className={styles.fieldValue}>{formatDateTime(viewData?.lastModifiedOn)}</span>
        </div>
      </div>
    );
  } else {
    sidebarContent = (
      <div className={styles.sidebarForm}>
        <FnDynamicFields
          fields={sidebarFields}
          formValues={formValues}
          formErrors={formErrors}
          onChange={handleFieldChange}
        />
        <div className={styles.formActions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={isFilterMode ? handleClearFilters : handleFormCancel}
          >
            {isFilterMode ? t('common.clear_filters') : t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isSubmitting}
            onClick={isFilterMode ? handleFilterApply : handleFormSubmit}
          >
            {isFilterMode ? t('common.apply_filters') : t('common.save')}
          </Button>
        </div>
      </div>
    );
  }

  const { 
    columns: _cols, 
    rowActions: _rows, 
    toolbarActions: _tools, 
    apiConfig: _api, 
    data: _data, 
    pageTitle, 
    deleteUrl, 
    deleteMessage, 
    ...restTableProps 
  } = table;

  return (
    <div className={[styles.page, className].filter(Boolean).join(' ')} style={style}>
      {pageHeader && <h1 className={styles.pageHeader}>{pageHeader}</h1>}

      <DataTable
        {...restTableProps}
        columns={visibleColumns as any}
        data={table.data as any}
        apiConfig={
          table.apiConfig
            ? {
                ...table.apiConfig,
                params: {
                  ...table.apiConfig.params,
                  filter: {
                    ...((table.apiConfig.params?.filter as any) || {}),
                    ...filterValues,
                  },
                },
              }
            : undefined
        }
        rowActions={mappedRowActions as any}
        toolbarActions={mappedToolbarActions}
        onExport={onExport}
        emptyMessage={`No ${table.pageTitle ?? 'records'} found`}
      />

      <Drawer
        isOpen={sidebarOpen}
        onClose={handleFormCancel}
        title={sidebarHeader}
        position="right"
        closeOnBackdrop={!isSubmitting}
      >
        {sidebarContent}
      </Drawer>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Confirmation"
        message={table.deleteMessage || 'Are you sure you want to delete this record?'}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
