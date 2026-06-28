import React from 'react';
import styles from './Tag.module.scss';

export interface TagProps {
  children: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'error';
  icon?: React.ReactNode;
  dismissible?: boolean;
  clickable?: boolean;
  onDismiss?: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Tag: React.FC<TagProps> = ({ children, color = 'default', icon, dismissible, clickable, onDismiss, onClick, className, style }) => {
  const classes = [styles.tag, color !== 'default' && styles[color], clickable && styles.clickable, className].filter(Boolean).join(' ');
  return (
    <span className={classes} style={style} onClick={clickable ? onClick : undefined} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} data-testid="tag">
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
      {dismissible && (
        <button className={styles.dismiss} onClick={(e) => { e.stopPropagation(); onDismiss?.(); }} aria-label="Remove tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </span>
  );
};
