'use client';
import React, { useState, useRef, useCallback } from 'react';
import styles from './Tabs.module.scss';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'underline' | 'pills';
  lazy?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  items, activeTab, onChange, orientation = 'horizontal', variant = 'underline',
  lazy = false, className, style,
}) => {
  const [internalActive, setInternalActive] = useState(items[0]?.id || '');
  const tabListRef = useRef<HTMLDivElement>(null);
  const currentActive = activeTab ?? internalActive;

  const handleSelect = useCallback((id: string) => {
    setInternalActive(id);
    onChange?.(id);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    let targetIndex: number | null = null;

    switch (e.key) {
      case nextKey: e.preventDefault(); targetIndex = (index + 1) % items.length; break;
      case prevKey: e.preventDefault(); targetIndex = (index - 1 + items.length) % items.length; break;
      case 'Home': e.preventDefault(); targetIndex = 0; break;
      case 'End': e.preventDefault(); targetIndex = items.length - 1; break;
    }

    if (targetIndex !== null) {
      // Skip disabled
      while (items[targetIndex]?.disabled && targetIndex !== index) {
        targetIndex = e.key === prevKey || e.key === 'Home'
          ? (targetIndex + 1) % items.length
          : (targetIndex - 1 + items.length) % items.length;
      }
      const tabs = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs?.[targetIndex]?.focus();
      if (!items[targetIndex]?.disabled) handleSelect(items[targetIndex].id);
    }
  };

  const tabList = (
    <div
      ref={tabListRef}
      className={[styles.tabList, styles[orientation], variant === 'pills' && styles.pills].filter(Boolean).join(' ')}
      role="tablist"
      aria-orientation={orientation}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          className={[styles.tab, currentActive === item.id && styles.active].filter(Boolean).join(' ')}
          role="tab"
          aria-selected={currentActive === item.id}
          aria-controls={`tabpanel-${item.id}`}
          id={`tab-${item.id}`}
          tabIndex={currentActive === item.id ? 0 : -1}
          disabled={item.disabled}
          onClick={() => !item.disabled && handleSelect(item.id)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );

  const activeItem = items.find(i => i.id === currentActive);
  const panelContent = lazy ? activeItem?.content : items.map(item => (
    <div
      key={item.id}
      role="tabpanel"
      id={`tabpanel-${item.id}`}
      aria-labelledby={`tab-${item.id}`}
      hidden={currentActive !== item.id}
      className={styles.panel}
    >
      {item.content}
    </div>
  ));

  if (orientation === 'vertical') {
    return (
      <div className={[styles.wrapper, styles.verticalLayout, className].filter(Boolean).join(' ')} style={style} data-testid="tabs">
        {tabList}
        <div className={styles.content}>
          {lazy ? (
            <div role="tabpanel" id={`tabpanel-${currentActive}`} aria-labelledby={`tab-${currentActive}`} className={styles.panel}>
              {activeItem?.content}
            </div>
          ) : panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} style={style} data-testid="tabs">
      {tabList}
      <div className={styles.content}>
        {lazy ? (
          <div role="tabpanel" id={`tabpanel-${currentActive}`} aria-labelledby={`tab-${currentActive}`} className={styles.panel}>
            {activeItem?.content}
          </div>
        ) : panelContent}
      </div>
    </div>
  );
};
