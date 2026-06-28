import React from 'react';
import styles from './Breadcrumb.module.scss';

export interface BreadcrumbItem { label: string; href?: string; }

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  truncate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const defaultSeparator = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
);

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = defaultSeparator, truncate = false, className, style }) => (
  <nav aria-label="Breadcrumb" className={className} style={style} data-testid="breadcrumb">
    <ol className={styles.breadcrumb}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={i} className={styles.item}>
            {i > 0 && <span className={styles.separator} aria-hidden="true">{separator}</span>}
            {isLast ? (
              <span className={styles.current} aria-current="page">
                <span className={truncate ? styles.truncated : undefined}>{item.label}</span>
              </span>
            ) : (
              <a href={item.href || '#'} className={styles.link}>
                <span className={truncate ? styles.truncated : undefined}>{item.label}</span>
              </a>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
