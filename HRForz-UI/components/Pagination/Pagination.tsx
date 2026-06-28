'use client';
import React from 'react';
import styles from './Pagination.module.scss';
import { useTranslation } from '@/lib/i18n';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  /** Total item count — enables "X–Y of Z" range display */
  totalItems?: number;
  itemsPerPage?: number;
  showItemsPerPage?: boolean;
  onItemsPerPageChange?: (n: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
  style?: React.CSSProperties;
}

function getPageNumbers(current: number, total: number, siblings: number): (number | 'ellipsis')[] {
  const range = (s: number, e: number) => Array.from({ length: e - s + 1 }, (_, i) => s + i);
  const totalNumbers = siblings * 2 + 5;
  if (total <= totalNumbers) return range(1, total);

  const left  = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, total - 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (left > 2)       pages.push('ellipsis');
  pages.push(...range(left, right));
  if (right < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
);

export const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, onPageChange, siblingCount = 1,
  totalItems, itemsPerPage = 10,
  showItemsPerPage = false, onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className, style,
}) => {
  const { t } = useTranslation();
  const pages = getPageNumbers(currentPage, totalPages, siblingCount);

  const rangeStart = totalItems !== undefined ? (currentPage - 1) * itemsPerPage + 1 : null;
  const rangeEnd   = totalItems !== undefined ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <nav
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      style={style}
      data-testid="pagination"
      aria-label={t('common.pagination')}
    >
      {/* Left — rows per page */}
      {showItemsPerPage ? (
        <div className={styles.perPage}>
          <span>{t('common.rows_per_page')}</span>
          <select
            className={styles.perPageSelect}
            value={itemsPerPage}
            onChange={e => onItemsPerPageChange?.(Number(e.target.value))}
            aria-label={t('common.rows_per_page')}
          >
            {itemsPerPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      ) : (
        <div />
      )}

      {/* Right — range info + page nav */}
      <div className={styles.nav}>
        {rangeStart !== null && (
          <span className={styles.info}>
            {rangeStart}–{rangeEnd} {t('common.of')} {totalItems}
          </span>
        )}

        <button
          className={styles.button}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t('common.previous_page')}
        >
          <ChevronLeft />
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              className={[styles.button, p === currentPage && styles.active].filter(Boolean).join(' ')}
              onClick={() => onPageChange(p)}
              aria-label={`${t('common.page')} ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className={styles.button}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t('common.next_page')}
        >
          <ChevronRight />
        </button>
      </div>
    </nav>
  );
};
