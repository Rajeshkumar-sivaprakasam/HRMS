'use client';
import React, { useState, useRef, useCallback } from 'react';
import styles from './Tooltip.module.scss';

export interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  arrow?: boolean;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', delay = 200, arrow = true, children, className }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} data-testid="tooltip">
      {children}
      {visible && (
        <span className={[styles.tooltip, styles[position]].join(' ')} role="tooltip">
          {content}
          {arrow && <span className={styles.arrow} />}
        </span>
      )}
    </span>
  );
};
