'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './DataTable.module.scss';
import { useTableEngine } from './useTableEngine';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_CURRENCY } from './constants';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Dropdown } from '../Dropdown/Dropdown';
import { useTranslation } from '@/lib/i18n';
import type { DropdownContent } from '../Dropdown/Dropdown';
import type { IconName } from '../Icon/Icon';
import type { DataTableProps, DataTableColumn, RowAction, StatusState, StatusStateResolver } from './types';

// ─── Pagination helper ────────────────────────────────────────────────────────

function getPageNumbers(totalPages: number, current: number): (number | '...')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
  if (current <= 2) return [0, 1, 2, '...', totalPages - 1];
  if (current >= totalPages - 3) return [0, '...', totalPages - 3, totalPages - 2, totalPages - 1];
  return [0, '...', current - 1, current, current + 1, '...', totalPages - 1];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CLS: Record<StatusState, string> = {
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  error: styles.statusError,
  info: styles.statusInfo,
  default: styles.statusDefault,
};

function resolveStatus<T>(
  resolver: StatusStateResolver<T> | undefined,
  value: unknown,
  row: T,
): StatusState {
  if (!resolver) return 'default';
  if (typeof resolver === 'function') return resolver(value, row);
  return resolver;
}

function StatusBadge({ value, state }: { value: string; state: StatusState }) {
  return (
    <span className={[styles.statusBadge, STATUS_CLS[state] ?? styles.statusDefault].join(' ')}>
      {value}
    </span>
  );
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function renderCell<T extends object>(col: DataTableColumn<T>, row: T): React.ReactNode {
  if (col.accessor) return col.accessor(row);
  if (col.valueFormatter) return col.valueFormatter(row);

  const raw = col.field ? (row as Record<string, unknown>)[col.field] : undefined;

  if (col.cellType === 'status' || col.cellType === 'badge') {
    const state = resolveStatus(col.statusStateResolver, raw, row);
    return <StatusBadge value={raw != null ? String(raw) : '—'} state={state} />;
  }
  if (col.cellType === 'date' && raw) {
    try { return new Date(String(raw)).toLocaleDateString(); } catch { /* fall through */ }
  }
  if (col.cellType === 'datetime' && raw) {
    try { return new Date(String(raw)).toLocaleString(); } catch { /* fall through */ }
  }
  if ((col.cellType === 'currency' || col.cellType === 'amount') && raw != null) {
    const n = Number(raw);
    if (!isNaN(n)) return `${DEFAULT_CURRENCY}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return raw != null ? String(raw) : '—';
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActionsCell<T extends object>({
  actions, row,
}: { actions: RowAction<T>[]; row: T }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = actions.filter(a => a.onState?.(row)?.visible !== false);
  if (visible.length === 0) return null;

  const inline = visible.length <= 2 ? visible : visible.slice(0, 1);
  const menu = visible.length > 2 ? visible.slice(1) : [];

  return (
    <div className={styles.rowActions} ref={wrapRef}>
      {inline.map(action => {
        const state = action.onState?.(row);
        return (
          <button
            key={action.id}
            className={[styles.actionBtn, action.danger ? styles.actionDanger : ''].filter(Boolean).join(' ')}
            disabled={state?.disabled}
            title={action.label}
            onClick={e => { e.stopPropagation(); action.onClick(row); }}
            type="button"
          >
            {action.icon
              ? <Icon name={action.icon as IconName} size="sm" />
              : <span className={styles.actionLabel}>{action.label}</span>}
          </button>
        );
      })}
      {menu.length > 0 && (
        <div className={styles.moreWrap}>
          <button
            className={styles.actionBtn}
            title="More actions"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            type="button"
          >
            <Icon name="dots-vertical" size="sm" />
          </button>
          {open && (
            <div className={styles.moreMenu} role="menu">
              {menu.map(action => {
                const state = action.onState?.(row);
                return (
                  <button
                    key={action.id}
                    className={[styles.moreMenuItem, action.danger ? styles.moreMenuItemDanger : ''].filter(Boolean).join(' ')}
                    disabled={state?.disabled}
                    role="menuitem"
                    type="button"
                    onClick={e => { e.stopPropagation(); setOpen(false); action.onClick(row); }}
                  >
                    {action.icon && <Icon name={action.icon as IconName} size="sm" />}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir?: 'asc' | 'desc' }) {
  if (!active) return <Icon name="chevron-up" size="xs" color="#94a3b8" />;
  return dir === 'asc'
    ? <Icon name="chevron-up" size="xs" />
    : <Icon name="chevron-down" size="xs" />;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className={styles.skeletonRow} aria-hidden="true">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className={styles.td}>
          <span className={styles.skeletonCell} style={{ width: `${50 + (i * 17) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DataTable<T>({
  columns: allColumns,
  data,
  apiConfig,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  selectable,
  searchable,
  striped,
  hoverable = true,
  rowActions,
  toolbarActions,
  loading: externalLoading,
  emptyMessage = 'No data available',
  onSelectionChange,
  isServerSidePagination = false,
  onPageChange,
  showTableHeader = true,
  showPagination = true,
  dataKey,
  exportable,
  exportOptions,
  onExport,
  className,
  style,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const columns = allColumns.filter(c => !c.hidden);
  const hasActions = rowActions && rowActions.length > 0;

  const engine = useTableEngine<T>({
    data,
    apiConfig,
    columns,
    initialPageSize,
    isServerSidePagination,
    dataKey,
  });

  const isLoading = externalLoading || engine.loading;
  const safeTotal = engine.total ?? 0;
  const safePageSize = engine.pageSize || initialPageSize;
  const totalPages = safeTotal > 0 ? Math.ceil(safeTotal / safePageSize) : 0;

  const pageNumbers = getPageNumbers(totalPages, engine.page);
  const firstItem = safeTotal === 0 ? 0 : engine.page * safePageSize + 1;
  const lastItem = Math.min((engine.page + 1) * safePageSize, safeTotal);

  // Notify parent of selection changes
  const prevSelected = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!onSelectionChange) return;
    const prev = prevSelected.current;
    if (prev.size === engine.selected.size && [...engine.selected].every(i => prev.has(i))) return;
    prevSelected.current = engine.selected;
    onSelectionChange(engine.rows.filter((row, i) => {
      const key = dataKey ? (row as any)[dataKey] : i;
      return engine.selected.has(key);
    }));
  }, [engine.selected, engine.rows, onSelectionChange, dataKey]);

  useEffect(() => {
    onPageChange?.(engine.page, engine.pageSize);
  }, [engine.page, engine.pageSize, onPageChange]);

  const colCount = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style} data-testid="data-table">

      {/* ── Toolbar ── */}
      {(searchable || (toolbarActions && toolbarActions.length > 0) || exportable) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrap}>
              <Icon name="search" size="sm" color="#94a3b8" />
              <input
                className={styles.searchInput}
                type="text"
                placeholder={t('common.search')}
                value={engine.search}
                onChange={e => engine.setSearch(e.target.value)}
                aria-label="Search table"
              />
              {engine.search && (
                <button className={styles.searchClear} onClick={() => engine.setSearch('')} type="button" aria-label="Clear search">
                  <Icon name="x-circle" size="sm" color="#94a3b8" />
                </button>
              )}
            </div>
          )}
          <div className={styles.toolbarActions}>
            {exportable && (
              <Dropdown
                align="right"
                trigger={
                  <Button variant="ghost" size="sm">
                    <Icon name="download" size="sm" />
                    {t('common.export')}
                  </Button>
                }
                items={(exportOptions || [
                  { id: 'csv', label: t('common.export_csv'), icon: 'file-text' },
                  { id: 'excel', label: t('common.export_excel'), icon: 'file' },
                  { id: 'pdf', label: t('common.export_pdf'), icon: 'file' },
                ]).map(opt => ({
                  id: opt.id,
                  label: opt.label,
                  icon: opt.icon ? <Icon name={opt.icon as IconName} size="sm" /> : undefined,
                  onClick: () => onExport?.(opt.id),
                }))}
              />
            )}
            {toolbarActions && toolbarActions.length > 0 && (
              <>
                {toolbarActions.map(action => (
                  <Button
                    key={action.id}
                    variant={action.variant ?? 'secondary'}
                    size="sm"
                    onClick={action.onClick}
                  >
                    {action.icon && <Icon name={action.icon as IconName} size="sm" />}
                    {action.label}
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table} role="grid">
          {showTableHeader && (
            <thead className={styles.thead}>
              <tr>
                {selectable && (
                  <th className={[styles.th, styles.checkboxCol].join(' ')}>
                    <input
                      type="checkbox"
                      checked={engine.allSelected}
                      onChange={engine.toggleAll}
                      disabled={isLoading || engine.rows.length === 0}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.id}
                    className={[styles.th, col.sortable && styles.sortable].filter(Boolean).join(' ')}
                    style={{ width: col.width, minWidth: col.minWidth, textAlign: col.align ?? 'left' }}
                    onClick={() => col.sortable && engine.setSort(col.field ?? col.id)}
                    aria-sort={engine.sort?.key === (col.field ?? col.id)
                      ? (engine.sort.dir === 'asc' ? 'ascending' : 'descending')
                      : undefined}
                  >
                    <span className={styles.thInner}>
                      {col.header}
                      {col.sortable && (
                        <SortIcon
                          active={engine.sort?.key === (col.field ?? col.id)}
                          dir={engine.sort?.key === (col.field ?? col.id) ? engine.sort?.dir : undefined}
                        />
                      )}
                    </span>
                  </th>
                ))}
                {hasActions && (
                  <th className={[styles.th, styles.actionsCol].join(' ')}>{t('common.actions')}</th>
                )}
              </tr>
            </thead>
          )}
          <tbody>
            {isLoading ? (
              Array.from({ length: engine.pageSize }).map((_, i) => (
                <SkeletonRow key={i} colCount={colCount} />
              ))
            ) : engine.rows.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={colCount}>
                  <Icon name="search" size="lg" color="#cbd5e1" />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              engine.rows.map((row, idx) => {
                const isRowSelected = dataKey ? engine.selected.has((row as any)[dataKey]) : engine.selected.has(idx);
                return (
                  <tr
                    key={idx}
                    className={[
                      styles.tr,
                      hoverable && styles.hoverable,
                      striped && idx % 2 !== 0 && styles.striped,
                      isRowSelected && styles.selected,
                      selectable && styles.selectable,
                    ].filter(Boolean).join(' ')}
                    onClick={selectable ? () => engine.toggleRow(row, idx) : undefined}
                    aria-selected={selectable ? isRowSelected : undefined}
                  >
                    {selectable && (
                      <td className={[styles.td, styles.checkboxCol].join(' ')}>
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => engine.toggleRow(row, idx)}
                          onClick={e => e.stopPropagation()}
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </td>
                    )}
                  {columns.map(col => (
                    <td
                      key={col.id}
                      className={styles.td}
                      style={{ textAlign: col.align ?? 'left' }}
                    >
                      {renderCell(col as DataTableColumn<object>, row as object)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className={[styles.td, styles.actionsCol].join(' ')}>
                      <RowActionsCell actions={rowActions as RowAction<object>[]} row={row as object} />
                    </td>
                  )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      {showPagination && (
        <div className={styles.footer}>
          {/* LEFT: rows-per-page selector */}
          <div className={styles.pageSizeWrap}>
            <label className={styles.pageSizeLabel} htmlFor="dt-page-size">{t('common.rows_per_page')}</label>
            <select
              id="dt-page-size"
              className={styles.pageSizeSelect}
              value={engine.pageSize}
              onChange={e => engine.setPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* RIGHT: record count + page navigation */}
          <div className={styles.footerRight}>
            <span className={styles.info}>
              {safeTotal === 0
                ? t('common.no_data')
                : `${firstItem}–${lastItem} ${t('common.of')} ${safeTotal}`}
            </span>

            {totalPages > 0 && (
              <div className={styles.pagination} role="navigation" aria-label="Pagination">
                <button
                  className={styles.pageBtn}
                  onClick={() => engine.setPage(engine.page - 1)}
                  disabled={engine.page === 0 || isLoading}
                  aria-label="Previous page"
                  type="button"
                >
                  <Icon name="chevron-left" size="sm" />
                </button>

                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className={[styles.pageBtn, styles.ellipsis].join(' ')}>
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={[styles.pageBtn, engine.page === p && styles.active].filter(Boolean).join(' ')}
                      onClick={() => engine.setPage(p as number)}
                      disabled={isLoading}
                      aria-label={`Page ${(p as number) + 1}`}
                      aria-current={engine.page === p ? 'page' : undefined}
                      type="button"
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}

                <button
                  className={styles.pageBtn}
                  onClick={() => engine.setPage(engine.page + 1)}
                  disabled={engine.page >= totalPages - 1 || isLoading}
                  aria-label="Next page"
                  type="button"
                >
                  <Icon name="chevron-right" size="sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
