'use client';
import React, { useState } from 'react';
import styles from './Avatar.module.scss';

export interface AvatarProps {
  src?: string; alt?: string; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string; style?: React.CSSProperties;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function colorClass(name: string): string {
  const code = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return `c${code % 7}` as string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', className, style }) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = src && !imgError;
  const avatarColorClass = !hasImage && name ? styles[colorClass(name)] : undefined;
  return (
    <span className={[styles.avatar, styles[size], avatarColorClass, className].filter(Boolean).join(' ')} style={style} data-testid="avatar" role="img" aria-label={alt || name || 'Avatar'}>
      {src && !imgError ? <img className={styles.image} src={src} alt={alt || name || 'Avatar'} onError={() => setImgError(true)} />
        : name ? getInitials(name) : (
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      )}
    </span>
  );
};

export interface AvatarGroupProps { max?: number; size?: AvatarProps['size']; children: React.ReactNode; className?: string; }
export const AvatarGroup: React.FC<AvatarGroupProps> = ({ max = 5, size = 'md', children, className }) => {
  const items = React.Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div className={[styles.group, className].filter(Boolean).join(' ')} data-testid="avatar-group">
      {overflow > 0 && <span className={[styles.avatar, styles[size], styles.overflow].join(' ')}>+{overflow}</span>}
      {visible.reverse().map((child, i) => React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size, key: i }) : child)}
    </div>
  );
};
