'use client';
import React, { useState, useMemo } from 'react';
import styles from './Table.module.scss';

export interface TableColumn<T = Record<string, unknown>> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  /** Show a 1px border + shadow wrapper (use when not inside a <Card>) */
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  /** Built-in pagination — set totalItems to enable the footer */
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (n: number) => void;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

function getAccessorValue<T>(row: T, accessor: TableColumn<T>['accessor']): React.ReactNode {
  if (typeof accessor === 'function') return accessor(row);
  return row[accessor] as React.ReactNode;
}

const ChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
);
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronsSort = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export function Table<T extends Record<string, unknown>>({
  columns, data,
  bordered = false,
  striped, hoverable = true, selectable,
  selectedRows: controlledSelected, onSelectionChange, onSort,
  totalItems, currentPage = 1, itemsPerPage = 5,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  onPageChange, onItemsPerPageChange,
  emptyMessage = 'No data available', className, style,
}: TableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<number>>(new Set());
  const [sortState, setSortState] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  const selected = controlledSelected ?? internalSelected;
  const setSelected = (s: Set<number>) => { setInternalSelected(s); onSelectionChange?.(s); };

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;
    const dir = sortState?.column === col.id && sortState.direction === 'asc' ? 'desc' : 'asc';
    setSortState({ column: col.id, direction: dir });
    onSort?.(col.id, dir);
  };

  const sortedData = useMemo(() => {
    if (!sortState) return data;
    const col = columns.find(c => c.id === sortState.column);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const va = getAccessorValue(a, col.accessor);
      const vb = getAccessorValue(b, col.accessor);
      const valA = typeof va === 'string' ? va : String(va ?? '');
      const valB = typeof vb === 'string' ? vb : String(vb ?? '');
      const cmp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortState.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sortState]);

  const allSelected = data.length > 0 && selected.size === data.length;
  const toggleAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(data.map((_, i) => i))); };
  const toggleRow = (idx: number) => { const next = new Set(selected); if (next.has(idx)) next.delete(idx); else next.add(idx); setSelected(next); };

  const showFooter = totalItems !== undefined && (onPageChange || onItemsPerPageChange);
  const totalPages = totalItems !== undefined ? Math.ceil(totalItems / itemsPerPage) : 0;
  const rangeStart = (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems ?? 0);

  return (
    <div
      className={[styles.wrapper, bordered && styles.bordered, className].filter(Boolean).join(' ')}
      style={style}
      data-testid="table"
    >
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {selectable && (
              <th className={[styles.th, styles.checkbox].join(' ')}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all rows" />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.id}
                className={[styles.th, col.sortable && styles.sortable].filter(Boolean).join(' ')}
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
                onClick={() => handleSort(col)}
              >
                {col.header}
                {col.sortable && (
                  <span className={[styles.sortIcon, sortState?.column === col.id && styles.active].filter(Boolean).join(' ')}>
                    {sortState?.column === col.id
                      ? sortState.direction === 'asc' ? <ChevronUp /> : <ChevronDown />
                      : <ChevronsSort />}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length + (selectable ? 1 : 0)}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={[
                  styles.tr,
                  hoverable && styles.hoverable,
                  striped && styles.striped,
                  selectable && styles.selectable,
                  selected.has(idx) && styles.selected,
                ].filter(Boolean).join(' ')}
                onClick={selectable ? () => toggleRow(idx) : undefined}
              >
                {selectable && (
                  <td className={[styles.td, styles.checkbox].join(' ')}>
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => toggleRow(idx)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select row ${idx + 1}`}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.id} className={styles.td} style={{ textAlign: col.align ?? 'left' }}>
                    {getAccessorValue(row, col.accessor)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showFooter && (
        <div className={styles.footer}>
          {/* Left — rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-500)' }}>
            <span>Rows per page</span>
            <select
              value={itemsPerPage}
              onChange={e => onItemsPerPageChange?.(Number(e.target.value))}
              style={{
                border: '1px solid var(--ink-200)',
                borderRadius: 7,
                padding: '4px 8px',
                fontSize: 13,
                background: 'white',
                color: 'var(--ink-800)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {itemsPerPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Right — range + page nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-500)', marginRight: 4 }}>
              {rangeStart}–{rangeEnd} of {totalItems}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              style={{
                width: 30, height: 30, borderRadius: 7,
                border: '1px solid var(--ink-200)', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1,
                color: 'var(--ink-600)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`e-${i}`} style={{ fontSize: 13, color: 'var(--ink-400)', padding: '0 2px' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange?.(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === currentPage ? 'page' : undefined}
                    style={{
                      minWidth: 30, height: 30, borderRadius: 7,
                      border: p === currentPage ? '1.5px solid var(--brand-500)' : '1px solid var(--ink-200)',
                      background: p === currentPage ? 'var(--brand-50)' : 'white',
                      color: p === currentPage ? 'var(--brand-700)' : 'var(--ink-600)',
                      fontWeight: p === currentPage ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              style={{
                width: 30, height: 30, borderRadius: 7,
                border: '1px solid var(--ink-200)', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
                color: 'var(--ink-600)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
