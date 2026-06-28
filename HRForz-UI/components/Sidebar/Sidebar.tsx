'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import styles from './Sidebar.module.scss';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
}

export interface SidebarSection {
  label?: string;       // e.g. "MY SPACE" — omit for no section header
  items: SidebarItem[];
}

export interface SidebarBrand {
  /** Single letter shown inside the gradient logo tile */
  letter: string;
  name: string;
  subtitle?: string;
}

export interface SidebarUser {
  name: string;
  role: string;
  /** Pre-computed initials — defaults to first 2 words' initials */
  initials?: string;
  /** CSS background for the avatar circle — defaults to brand gradient */
  avatarStyle?: React.CSSProperties;
}

export interface SidebarProps {
  /** Structured sections with optional labels */
  sections?: SidebarSection[];
  /** Flat list of items (used when sections is omitted) */
  items?: SidebarItem[];
  /** Brand block at the top */
  brand?: SidebarBrand;
  /** User footer */
  user?: SidebarUser;
  /** Logo node shown when `brand` is not provided */
  logo?: React.ReactNode;
  bottomItems?: SidebarItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({
  sections, items, brand, user, logo, bottomItems,
  collapsible = true, defaultCollapsed = false,
  className, style,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Normalise to sections
  const resolvedSections: SidebarSection[] = sections ?? (items ? [{ items }] : []);

  const renderItem = (item: SidebarItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isGroupOpen = openGroups.has(item.id);

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            className={[styles.item, item.active && styles.active].filter(Boolean).join(' ')}
            onClick={() => toggleGroup(item.id)}
            aria-expanded={isGroupOpen}
          >
            {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
            <span className={styles.itemLabel}>{item.label}</span>
            <svg
              className={[styles.itemChevron, isGroupOpen && styles.open].filter(Boolean).join(' ')}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <div className={[styles.children, isGroupOpen && styles.open].filter(Boolean).join(' ')}>
            {item.children!.map(child => (
              <Link
                key={child.id}
                href={child.href || '#'}
                className={[styles.item, child.active && styles.active].filter(Boolean).join(' ')}
                onClick={child.onClick}
              >
                {child.icon && <span className={styles.itemIcon}>{child.icon}</span>}
                <span className={styles.itemLabel}>{child.label}</span>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        className={[styles.item, item.active && styles.active].filter(Boolean).join(' ')}
        onClick={(e) => {
          if (item.onClick) {
            if (!item.href || item.href === '#') e.preventDefault();
            item.onClick();
          }
        }}
        title={collapsed ? item.label : undefined}
      >
        {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
        <span className={styles.itemLabel}>{item.label}</span>
        {item.badge !== undefined && (
          <span className={styles.itemBadge}>{item.badge}</span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={[styles.sidebar, collapsed && styles.collapsed, className].filter(Boolean).join(' ')}
      style={style}
      data-testid="sidebar"
    >
      {/* Brand block */}
      {brand ? (
        <div className={styles.brand}>
          <div className={styles.brandIcon}>{brand.letter}</div>
          <div className={styles.brandText}>
            <div className={styles.brandName}>{brand.name}</div>
            {brand.subtitle && <div className={styles.brandSub}>{brand.subtitle}</div>}
          </div>
          {collapsible && (
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? t('common.expand_sidebar') : t('common.collapse_sidebar')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.header}>
          {!collapsed && logo && <div className={styles.logo}>{logo}</div>}
          {collapsible && (
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? t('common.expand_sidebar') : t('common.collapse_sidebar')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Nav sections */}
      <nav className={styles.nav} role="navigation">
        <div className={styles.navMain}>
          {resolvedSections.map((section, si) => (
            <React.Fragment key={si}>
              {section.label && (
                <div className={styles.section}>{section.label}</div>
              )}
              {section.items.map(renderItem)}
            </React.Fragment>
          ))}
        </div>

        {bottomItems && bottomItems.length > 0 && (
          <div className={styles.navBottom}>
            {bottomItems.map(renderItem)}
          </div>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className={styles.footer}>
          <div className={styles.footerAvatar} style={user.avatarStyle}>
            {user.initials ?? getInitials(user.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.footerName}>{user.name}</div>
            <div className={styles.footerRole}>{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
};
