'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label, options, value, onChange, placeholder = 'Select...', multiple = false,
  searchable = false, clearable = false, disabled = false, error, helperText,
  className, style, required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = multiple ? (Array.isArray(value) ? value : []) : (typeof value === 'string' ? value : '');

  const filteredOptions = options.filter(o => !search || o.label.toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(filteredOptions.map(o => o.group).filter(Boolean))];

  const handleSelect = useCallback((optValue: string) => {
    if (multiple) {
      const arr = Array.isArray(selected) ? selected : [];
      const next = arr.includes(optValue) ? arr.filter(v => v !== optValue) : [...arr, optValue];
      onChange?.(next);
    } else {
      onChange?.(optValue);
      setIsOpen(false);
    }
    setSearch('');
  }, [multiple, selected, onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
  };

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter': case ' ':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, filteredOptions.length - 1)); if (!isOpen) setIsOpen(true); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Escape': setIsOpen(false); break;
    }
  };

  const getDisplayText = () => {
    if (multiple && Array.isArray(selected) && selected.length > 0) return null; // use tags
    if (!multiple && selected) return options.find(o => o.value === selected)?.label;
    return null;
  };

  const displayText = getDisplayText();
  const hasTags = multiple && Array.isArray(selected) && selected.length > 0;
  const hasValue = multiple ? (Array.isArray(selected) && selected.length > 0) : !!selected;

  const renderOptions = (opts: SelectOption[]) => opts.map((opt, i) => (
    <div key={opt.value}
      className={[styles.option, (Array.isArray(selected) ? selected.includes(opt.value) : selected === opt.value) && styles.selected, focusedIndex === i && styles.focused, opt.disabled && styles.disabled].filter(Boolean).join(' ')}
      role="option" aria-selected={Array.isArray(selected) ? selected.includes(opt.value) : selected === opt.value}
      onClick={() => !opt.disabled && handleSelect(opt.value)}
      onMouseEnter={() => setFocusedIndex(i)}>
      <span>{opt.label}</span>
      {(Array.isArray(selected) ? selected.includes(opt.value) : selected === opt.value) && (
        <span className={styles.checkmark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      )}
    </div>
  ));

  return (
    <div ref={wrapperRef} className={[styles.wrapper, className, required && styles.required].filter(Boolean).join(' ')} style={style} data-testid="select">
      {label && <label className={styles.label}>{label}</label>}
      <div className={[styles.trigger, isOpen && styles.open, error && styles.error, disabled && styles.disabled].filter(Boolean).join(' ')}
        role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)} onKeyDown={handleKeyDown}>
        {hasTags ? (
          <div className={styles.tags}>
            {(selected as string[]).map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <span key={v} className={styles.tag}>
                  {opt?.label}
                  <button className={styles.tagRemove} onClick={(e) => { e.stopPropagation(); handleSelect(v); }} aria-label={`Remove ${opt?.label}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <span className={[styles.triggerText, !displayText && styles.placeholder].filter(Boolean).join(' ')}>
            {displayText || placeholder}
          </span>
        )}
        {clearable && hasValue && <button className={styles.clearBtn} onClick={handleClear} aria-label="Clear selection"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
        <span className={[styles.chevron, isOpen && styles.rotated].filter(Boolean).join(' ')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-multiselectable={multiple}>
          {searchable && <input ref={searchRef} className={styles.searchInput} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setFocusedIndex(0); }} onClick={e => e.stopPropagation()} />}
          {groups.length > 0 ? groups.map(g => (
            <div key={g} className={styles.optionGroup}>
              <div className={styles.groupLabel}>{g}</div>
              {renderOptions(filteredOptions.filter(o => o.group === g))}
            </div>
          )) : filteredOptions.length > 0 ? renderOptions(filteredOptions) : <div className={styles.noOptions}>No options found</div>}
        </div>
      )}
      {error && <span className={styles.errorText} role="alert">{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};
