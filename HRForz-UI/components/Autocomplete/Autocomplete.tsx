'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styles from './Autocomplete.module.scss';
import { apiService } from '@/app/core/services/api-service';
import { useTranslation } from '@/lib/i18n';

export interface AutocompleteOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface AutocompleteProps {
  label?: string;
  /** Options can be AutocompleteOption or any raw object if fieldLabel/fieldValue are set */
  options?: any[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onInputChange?: (input: string) => void;
  placeholder?: string;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  allowCustomValue?: boolean;
  /** URL string or function returning URL. Response must have shape { data: AutocompleteOption[] } */
  fetchUrl?: string | ((query: string) => string);
  fetchDebounce?: number;
  loading?: boolean;
  noOptionsText?: string;
  filterOption?: (option: AutocompleteOption, input: string) => boolean;
  error?: string;
  helperText?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Custom mapping fields from Angular implementation */
  fieldLabel?: string;
  fieldValue?: string;
  codeWithDescription?: boolean;
}

const defaultFilter = (opt: AutocompleteOption, input: string) =>
  opt.label.toLowerCase().includes(input.toLowerCase());

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  options: rawOptions = [],
  value,
  onChange,
  onInputChange,
  placeholder,
  multiple = false,
  clearable = false,
  disabled = false,
  required = false,
  allowCustomValue = false,
  fetchUrl,
  fetchDebounce = 300,
  loading: loadingProp = false,
  noOptionsText,
  filterOption = defaultFilter,
  error,
  helperText,
  className,
  style,
  fieldLabel,
  fieldValue,
  codeWithDescription = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [fetchedRawOptions, setFetchedRawOptions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mapRawItem = useCallback((x: any, index: number): AutocompleteOption => {
    if (!x || typeof x !== 'object') {
      const str = String(x ?? '');
      return { value: str, label: str };
    }

    if (codeWithDescription) {
      const fVal = fieldValue ? x[fieldValue] : undefined;
      const fLab = fieldLabel ? x[fieldLabel] : undefined;
      const resolvedVal = fVal ?? x.id ?? x.categoryValue ?? x.value;
      const labelStr = `${fVal ?? ''} - ${fLab ?? ''}`;
      return {
        value: String(resolvedVal ?? `item-${index}`),
        label: labelStr,
        disabled: x.disabled,
        group: x.group,
      };
    }

    const resolvedVal = fieldValue ? x[fieldValue] : (x.value ?? x.id ?? x.categoryValue ?? x.name);
    const resolvedLab = fieldLabel ? x[fieldLabel] : (x.label ?? x.name ?? x.title ?? x.description ?? resolvedVal);

    return {
      value: String(resolvedVal ?? `item-${index}`),
      label: String(resolvedLab ?? `item-${index}`),
      disabled: x.disabled,
      group: x.group,
    };
  }, [fieldLabel, fieldValue, codeWithDescription]);

  const mappedOptions = useMemo(() => {
    if (!Array.isArray(rawOptions)) return [];
    return rawOptions.map((o, i) => mapRawItem(o, i));
  }, [rawOptions, mapRawItem]);

  const mappedFetchedOptions = useMemo(() => {
    if (!Array.isArray(fetchedRawOptions)) return [];
    return fetchedRawOptions.map((o, i) => mapRawItem(o, i));
  }, [fetchedRawOptions, mapRawItem]);

  const selected = multiple
    ? (Array.isArray(value) ? value : [])
    : (typeof value === 'string' ? value : '');

  const selectedLabel = useMemo(() => {
    if (multiple || !selected) return '';
    const match = mappedOptions.find(o => o.value === selected) ?? mappedFetchedOptions.find(o => o.value === selected);
    return match?.label ?? (allowCustomValue ? (selected as string) : '');
  }, [multiple, selected, mappedOptions, mappedFetchedOptions, allowCustomValue]);

  // Fetch from URL when query changes or on mount
  useEffect(() => {
    if (!fetchUrl) return;
    
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const path = typeof fetchUrl === 'function'
          ? fetchUrl(query)
          : query 
            ? `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`
            : fetchUrl;
        
        const json = await apiService.get<any>(path);
        console.log(`Autocomplete API (${fetchUrl}) response:`, json);

        let arr: any[] = [];
        // Support common API response structures
        if (Array.isArray(json)) arr = json;
        else if (Array.isArray(json?.data)) arr = json.data;
        else if (Array.isArray(json?.response)) arr = json.response; // Fixed: response is the array itself
        else if (Array.isArray(json?.response?.data)) arr = json.response.data;
        else if (Array.isArray(json?.data?.data)) arr = json.data.data;
        else if (Array.isArray(json?.result)) arr = json.result;
        else if (Array.isArray(json?.results)) arr = json.results;
        else if (Array.isArray(json?.items)) arr = json.items;
        else if (Array.isArray(json?.records)) arr = json.records;
        else if (Array.isArray(json?.data?.items)) arr = json.data.items;

        console.log(`Autocomplete (${fetchUrl}) found ${arr.length} options`);
        setFetchedRawOptions(arr);
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
        setFetchedRawOptions([]);
      } finally {
        setIsFetching(false);
      }
    };

    if (!query) {
      // Initial load: fetch immediately
      fetchData();
    } else {
      // Debounce searches
      clearTimeout(fetchTimer.current);
      fetchTimer.current = setTimeout(fetchData, fetchDebounce);
    }

    return () => clearTimeout(fetchTimer.current);
  }, [fetchUrl, query, fetchDebounce]);

  const visibleOptions = useMemo(() => {
    const baseList = fetchUrl ? mappedFetchedOptions : mappedOptions;
    
    // If we have a query, and it's not a remote fetch, we must filter locally.
    // If it's a remote fetch, the server usually filters, but local filtering 
    // acts as a safety net for fast typing or non-filtering APIs.
    if (!query) return baseList;
    
    // For fetched options, we only filter locally if the API didn't return a filtered list
    // (heuristic: if query is present but list is large, filter it)
    return baseList.filter(o => filterOption(o, query));
  }, [fetchUrl, mappedFetchedOptions, mappedOptions, query, filterOption]);

  const groups = useMemo(
    () => [...new Set(visibleOptions.map(o => o.group).filter(Boolean))] as string[],
    [visibleOptions]
  );

  const isSelected = useCallback(
    (v: string) => Array.isArray(selected) ? selected.includes(v) : selected === v,
    [selected]
  );

  const commitSelection = useCallback((optValue: string) => {
    if (multiple) {
      const arr = Array.isArray(selected) ? selected : [];
      const next = arr.includes(optValue) ? arr.filter(v => v !== optValue) : [...arr, optValue];
      onChange?.(next);
      setQuery('');
      onInputChange?.('');
      inputRef.current?.focus();
    } else {
      onChange?.(optValue);
      setQuery('');
      onInputChange?.('');
      setIsOpen(false);
    }
  }, [multiple, selected, onChange, onInputChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    setQuery('');
    onInputChange?.('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onInputChange?.(v);
    setIsOpen(true);
    setFocusedIndex(0);
  };

  const handleFocus = () => {
    if (!disabled) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setFocusedIndex(i => Math.min(i + 1, visibleOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && visibleOptions[focusedIndex] && !visibleOptions[focusedIndex].disabled) {
          commitSelection(visibleOptions[focusedIndex].value);
        } else if (allowCustomValue && query.trim()) {
          commitSelection(query.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Backspace':
        if (multiple && !query && Array.isArray(selected) && selected.length > 0) {
          onChange?.(selected.slice(0, -1));
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${focusedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  const isLoading = isFetching || loadingProp;
  const inputDisplay = multiple ? query : (isOpen ? query : (selectedLabel || query));
  const hasValue = multiple ? (Array.isArray(selected) && selected.length > 0) : !!selected;
  const showClear = clearable && hasValue && !disabled;

  const renderOption = (opt: AutocompleteOption, index: number) => (
    <div
      key={opt.value}
      data-idx={index}
      className={[
        styles.option,
        isSelected(opt.value) && styles.selected,
        focusedIndex === index && styles.focused,
        opt.disabled && styles.disabled,
      ].filter(Boolean).join(' ')}
      role="option"
      aria-selected={isSelected(opt.value)}
      aria-disabled={opt.disabled || undefined}
      // prevent input blur on mousedown, then select on click
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { if (!opt.disabled) commitSelection(opt.value); }}
      onMouseEnter={() => setFocusedIndex(index)}
    >
      <span className={styles.optionLabel}>{opt.label}</span>
      {isSelected(opt.value) && (
        <span className={styles.checkmark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={[styles.wrapper, className, required && styles.required].filter(Boolean).join(' ')}
      style={style}
      data-testid="autocomplete"
    >
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={[
          styles.control,
          isOpen && styles.open,
          error && styles.error,
          disabled && styles.disabled,
        ].filter(Boolean).join(' ')}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {multiple && Array.isArray(selected) && selected.map(v => {
          const opt = [...mappedOptions, ...mappedFetchedOptions].find(o => o.value === v);
          const labelText = opt?.label ?? v;
          return (
            <span key={v} className={styles.tag}>
              {labelText}
              <button
                type="button"
                className={styles.tagRemove}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => { e.stopPropagation(); commitSelection(v); }}
                aria-label={`Remove ${labelText}`}
                tabIndex={-1}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="autocomplete-listbox"
          className={styles.input}
          value={inputDisplay}
          placeholder={hasValue && !multiple && !isOpen ? '' : (placeholder ?? t('common.type_to_search'))}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />

        {isLoading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10" />
            </svg>
          </span>
        )}

        {showClear && (
          <button
            type="button"
            className={styles.clearBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            aria-label={t('common.clear_selection')}
            tabIndex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <span className={[styles.chevron, isOpen && styles.rotated].filter(Boolean).join(' ')} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          id="autocomplete-listbox"
          className={styles.dropdown}
          role="listbox"
          aria-multiselectable={multiple}
        >
          {isLoading ? (
            <div className={styles.statusRow}>{t('common.loading')}</div>
          ) : visibleOptions.length === 0 ? (
            <div className={styles.statusRow}>{noOptionsText ?? t('common.no_options')}</div>
          ) : groups.length > 0 ? (
            groups.map(g => {
              const groupOpts = visibleOptions.filter(o => o.group === g);
              return (
                <div key={g} className={styles.optionGroup}>
                  <div className={styles.groupLabel}>{g}</div>
                  {groupOpts.map(opt => renderOption(opt, visibleOptions.indexOf(opt)))}
                </div>
              );
            })
          ) : (
            visibleOptions.map((opt, i) => renderOption(opt, i))
          )}
        </div>
      )}

      {error && <span className={styles.errorText} role="alert">{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};
