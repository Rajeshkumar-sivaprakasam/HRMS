'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Popover.module.scss';

export interface PopoverProps {
  content: React.ReactNode;
  trigger?: 'click' | 'hover';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  className?: string;
  style?: React.CSSProperties;
}

export const Popover: React.FC<PopoverProps> = ({ content, trigger = 'click', position = 'bottom', children, className, style }) => {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setVisible(false);
  }, []);

  useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger, handleClickOutside]);

  const hoverProps = trigger === 'hover' ? {
    onMouseEnter: () => { clearTimeout(timerRef.current); setVisible(true); },
    onMouseLeave: () => { timerRef.current = setTimeout(() => setVisible(false), 150); },
  } : {};

  const clickProps = trigger === 'click' ? {
    onClick: () => setVisible(!visible),
  } : {};

  return (
    <span ref={wrapperRef} className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style} data-testid="popover" {...hoverProps}>
      <span {...clickProps}>{children}</span>
      {visible && <div className={[styles.content, styles[position]].join(' ')} role="dialog">{content}</div>}
    </span>
  );
};
