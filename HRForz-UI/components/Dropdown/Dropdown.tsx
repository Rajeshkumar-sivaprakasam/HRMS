'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Dropdown.module.scss';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: DropdownItem[];
}

export interface DropdownDivider { type: 'divider'; }
export interface DropdownGroup { type: 'group'; label: string; items: DropdownItem[]; }
export type DropdownContent = DropdownItem | DropdownDivider | DropdownGroup;

export interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownContent[];
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'left', className, style }) => {
  const [open, setOpen] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const renderItem = (item: DropdownItem) => {
    if (item.children && item.children.length > 0) {
      return (
        <div key={item.id} className={styles.submenuWrapper} onMouseEnter={() => setHoveredSubmenu(item.id)} onMouseLeave={() => setHoveredSubmenu(null)}>
          <button className={styles.item} disabled={item.disabled}>
            {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
            <span className={styles.itemLabel}>{item.label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          {hoveredSubmenu === item.id && (
            <div className={styles.submenu}>
              {item.children.map(child => renderItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button key={item.id} className={[styles.item, item.danger && styles.danger].filter(Boolean).join(' ')}
        onClick={() => { item.onClick?.(); setOpen(false); }} disabled={item.disabled}>
        {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
        <span className={styles.itemLabel}>{item.label}</span>
        {item.shortcut && <span className={styles.itemShortcut}>{item.shortcut}</span>}
      </button>
    );
  };

  const renderContent = (content: DropdownContent, i: number) => {
    if ('type' in content) {
      if (content.type === 'divider') return <div key={`d-${i}`} className={styles.divider} />;
      if (content.type === 'group') return (
        <div key={`g-${i}`}>
          <div className={styles.groupLabel}>{content.label}</div>
          {content.items.map(renderItem)}
        </div>
      );
    }
    return renderItem(content as DropdownItem);
  };

  return (
    <div ref={wrapperRef} className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style} data-testid="dropdown" onKeyDown={handleKeyDown}>
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div className={[styles.menu, align === 'right' && styles.right].filter(Boolean).join(' ')} role="menu">
          {items.map((item, i) => renderContent(item, i))}
        </div>
      )}
    </div>
  );
};
