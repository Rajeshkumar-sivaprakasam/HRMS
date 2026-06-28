'use client';
import React, { useState } from 'react';
import styles from './Navbar.module.scss';
import { useTranslation } from '@/lib/i18n';

export interface NavLink { label: string; href?: string; active?: boolean; onClick?: () => void; }

export interface NavbarProps {
  logo?: React.ReactNode;
  links?: NavLink[];
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Navbar: React.FC<NavbarProps> = ({ logo, links = [], actions, className, style }) => {
  const { locale, setLocale } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className={[styles.navbar, className].filter(Boolean).join(' ')} style={style} data-testid="navbar" role="navigation">
        <div className={styles.left}>
          {logo && <div className={styles.logo}>{logo}</div>}
          <div className={styles.links}>
            {links.map((link, i) => (
              <a key={i} href={link.href || '#'} className={[styles.link, link.active && styles.active].filter(Boolean).join(' ')} onClick={link.onClick}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className={styles.right}>
          <select 
            value={locale} 
            onChange={(e) => setLocale(e.target.value)}
            className={styles.langSelector}
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          {actions}
          <button className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </nav>
      {links.length > 0 && (
        <div className={[styles.mobileMenu, mobileOpen && styles.open].filter(Boolean).join(' ')}>
          {links.map((link, i) => (
            <a key={i} href={link.href || '#'} className={[styles.mobileLink, link.active && styles.active].filter(Boolean).join(' ')}
              onClick={() => { link.onClick?.(); setMobileOpen(false); }}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
};
