'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { apiService } from '@/app/core/services/api-service';
import { DEFAULT_PAGE_SIZE } from './constants';
import type { DataTableColumn, ApiConfig, SortState } from './types';

interface FetchParams {
  page: number;
  pageSize: number;
  sort: SortState | null;
  search: string;
}

interface TableEngineOptions<T> {
  data?: T[];
  apiConfig?: ApiConfig<T>;
  columns: DataTableColumn<T>[];
  initialPageSize?: number;
  isServerSidePagination?: boolean;
  dataKey?: string;
}

export interface TableEngine<T> {
  rows: T[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  sort: SortState | null;
  search: string;
  selected: Set<any>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (key: string) => void;
  setSearch: (q: string) => void;
  toggleRow: (row: T, idx: number) => void;
  toggleAll: () => void;
  allSelected: boolean;
  reload: () => void;
}

function defaultMapResponse<T>(res: any, dataKey?: string): { data: T[]; total: number } {
  if (Array.isArray(res)) return { data: res as T[], total: res.length };
  if (!res) return { data: [], total: 0 };

  let data: T[] = [];
  let total = 0;

  // 1. Try custom dataKey first if provided
  if (dataKey) {
    const parts = dataKey.split('.');
    let current = res;
    for (const part of parts) {
      if (current && typeof current === 'object') current = current[part];
      else { current = undefined; break; }
    }
    if (Array.isArray(current)) data = current;
  }

  // 2. Fallback to common patterns if dataKey didn't yield an array
  if (data.length === 0) {
    const responseObj = res.response ?? res.data ?? res;
    if (Array.isArray(responseObj)) {
      data = responseObj;
    } else if (responseObj && typeof responseObj === 'object') {
      if (Array.isArray(responseObj.data)) data = responseObj.data;
      else if (Array.isArray(responseObj)) data = responseObj;
    }
  }

  // 3. Extract total
  const root = res.response ?? res.data ?? res;
  total = root?.meta?.totalRecords ?? 
          root?.totalRecords ?? 
          root?.total ?? 
          root?.totalCount ?? 
          root?.count ?? 
          data.length;

  return { 
    data: Array.isArray(data) ? data : [], 
    total: typeof total === 'number' ? total : (Array.isArray(data) ? data.length : 0) 
  };
}

export function useTableEngine<T>({
  data: localData,
  apiConfig,
  columns,
  initialPageSize = DEFAULT_PAGE_SIZE,
  isServerSidePagination = false,
  dataKey,
}: TableEngineOptions<T>): TableEngine<T> {
  const isServer = Boolean(apiConfig);

  const [fetchParams, setFetchParams] = useState<FetchParams>({
    page: 0, pageSize: initialPageSize, sort: null, search: '',
  });
  const [tick, setTick] = useState(0);
  const [displaySearch, setDisplaySearch] = useState('');
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  const [selected, setSelected] = useState<Set<any>>(new Set());

  // Stable ref for apiConfig to avoid re-running effect when object identity changes
  const apiConfigRef = useRef(apiConfig);
  useEffect(() => { apiConfigRef.current = apiConfig; });

  const lastUrl = useRef(apiConfig?.url);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Only trigger re-fetch on params change if server-side pagination is enabled
  const triggerParams = useMemo(() => {
    return isServerSidePagination ? fetchParams : null;
  }, [isServerSidePagination, fetchParams]);

  // Server-side fetch
  useEffect(() => {
    if (!isServer) return;
    const cfg = apiConfigRef.current;
    if (!cfg) return;

    let cancelled = false;
    setInternalLoading(true);

    const mapper = cfg.mapResponse ?? ((r) => defaultMapResponse<T>(r, cfg.dataKey));
    const method = cfg.method?.toLowerCase() === 'get' ? 'get' : 'post';
    
    let body: any;
    if (isServerSidePagination) {
      if (cfg.transformParams) {
        body = cfg.transformParams({
          page: fetchParams.page + 1,
          pageSize: fetchParams.pageSize,
          search: fetchParams.search,
          isServerSidePagination,
          sort: fetchParams.sort
        });
      } else {
        body = {
          ...cfg.params,
          filter: {
            search: fetchParams.search,
            isServerSidePagination: true,
            ...(cfg.params?.filter as any || {}),
            ...(fetchParams.sort ? { 
              sortColumn: fetchParams.sort.key, 
              sortType: fetchParams.sort.dir.toUpperCase() 
            } : {}),
          },
          pagination: {
            page: fetchParams.page + 1,
            size: fetchParams.pageSize
          },
        };
        // Ensure we don't have nested filter/pagination from the spread
        if (body.filter && (body.filter as any).filter) delete (body.filter as any).filter;
        if (body.filter && (body.filter as any).pagination) delete (body.filter as any).pagination;
      }
    } else {
      // body = {
      //   filter: {
      //     ...(fetchParams.search ? { searchKey: fetchParams.search } : {}),
      //     ...(fetchParams.sort ? { sortBy: fetchParams.sort.key, sortOrder: fetchParams.sort.dir } : {}),
      //     ...(cfg.params || {}),
      //   },
      //   pagination: {
      //     page: fetchParams.page + 1,
      //     size: fetchParams.pageSize,
      //   },
      //   paginationFlag: true,
      // };
      // Fetch once mode: No pagination or search params in the request
      // But we merge cfg.params which might contain defaults
      body = { ...cfg.params };
    }

    const request = method === 'get'
      ? apiService.get<any>(cfg.url, body, cfg.headers)
      : apiService.post<any>(cfg.url, body, cfg.headers);

    request
      .then(json => {
        if (cancelled) return;
        const { data, total } = mapper(json);
        setRows(data);
        setTotal(total);
      })
      .catch(() => { if (!cancelled) { setRows([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setInternalLoading(false); });

    return () => { cancelled = true; };
  // }, [isServer, fetchParams, tick, apiConfig?.url, JSON.stringify(apiConfig?.params)]);
  }, [isServer, isServerSidePagination, triggerParams, tick, apiConfig?.url, JSON.stringify(apiConfig?.params)]);



  // Client-side: filter + sort
  const clientFiltered = useMemo(() => {
    const dataSource = isServer ? rows : localData;
    if (!dataSource || (isServer && isServerSidePagination)) return isServer ? rows : (localData || []);
    
    const q = displaySearch.toLowerCase();
    let d: T[] = q
      ? dataSource.filter(row => {
          const rowObj = row as Record<string, unknown>;
          return Object.entries(rowObj).some(([key, val]) => 
            key !== 'id' && 
            (typeof val === 'string' || typeof val === 'number') && 
            String(val).toLowerCase().includes(q)
          );
        })
      : [...dataSource];

    if (fetchParams.sort) {
      const { key, dir } = fetchParams.sort;
      d.sort((a, b) => {
        const getVal = (row: any, k: string) => {
          let val = row[k];
          if (val === undefined || val === null) {
            if (k === 'name') val = row.label || row.text || row.display_name;
            if (k === 'code') val = row.slug || row.value;
          }
          return String(val ?? '');
        };
        const va = getVal(a, key);
        const vb = getVal(b, key);
        const cmp = va.localeCompare(vb, undefined, { numeric: true });
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return d;
  }, [isServer, isServerSidePagination, rows, localData, displaySearch, fetchParams.sort, columns]);

  const clientPage = useMemo(() => {
    if (isServer && isServerSidePagination) return [];
    const { page, pageSize } = fetchParams;
    return clientFiltered.slice(page * pageSize, (page + 1) * pageSize);
  }, [isServer, isServerSidePagination, clientFiltered, fetchParams]);

  const displayRows = isServer && isServerSidePagination ? rows : clientPage;
  const displayTotal = isServer && isServerSidePagination ? total : clientFiltered.length;

  const clearSelected = useCallback(() => setSelected(new Set()), []);

  const setPage = useCallback((page: number) => {
    setFetchParams(p => p.page === page ? p : { ...p, page });
    clearSelected();
  }, [clearSelected]);

  const setPageSize = useCallback((pageSize: number) => {
    setFetchParams(p => p.pageSize === pageSize ? p : { ...p, page: 0, pageSize });
    clearSelected();
  }, [clearSelected]);

  const setSort = useCallback((key: string) => {
    setFetchParams(p => {
      const nextSort: SortState = p.sort?.key === key && p.sort.dir === 'asc' 
        ? { key, dir: 'desc' } 
        : { key, dir: 'asc' };
      return { ...p, page: 0, sort: nextSort };
    });
    clearSelected();
  }, [clearSelected]);

  const setSearch = useCallback((q: string) => {
    setDisplaySearch(q);
    clearTimeout(debounceRef.current);
    
    if (!isServer || !isServerSidePagination) {
      setFetchParams(p => p.page === 0 && p.search === q ? p : { ...p, page: 0, search: q });
      clearSelected();
      return;
    }

    debounceRef.current = setTimeout(() => {
      setFetchParams(p => {
        if (p.search === q) return p;
        return { ...p, page: 0, search: q };
      });
      clearSelected();
    }, 500);
  }, [isServer, isServerSidePagination, clearSelected]);

  // Reset page when URL changes (excluding initial mount)
  useEffect(() => {
    if (apiConfig?.url && apiConfig.url !== lastUrl.current) {
      lastUrl.current = apiConfig.url;
      setFetchParams(p => ({ ...p, page: 0, search: '' }));
      setDisplaySearch('');
    }
  }, [apiConfig?.url]);

  const allSelected = displayRows.length > 0 && selected.size === displayRows.length;

  const toggleRow = useCallback((row: T, idx: number) => {
    const key = dataKey ? (row as any)[dataKey] : idx;
    setSelected(s => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, [dataKey]);

  const toggleAll = useCallback(() => {
    if (selected.size === displayRows.length) {
      setSelected(new Set());
    } else {
      const keys = displayRows.map((row, i) => dataKey ? (row as any)[dataKey] : i);
      setSelected(new Set(keys));
    }
  }, [displayRows, dataKey, selected.size]);

  const reload = useCallback(() => {
    setTick(t => t + 1);
  }, [setTick]);

  return {
    rows: displayRows,
    total: displayTotal,
    loading: internalLoading,
    page: fetchParams.page,
    pageSize: fetchParams.pageSize,
    sort: fetchParams.sort,
    search: displaySearch,
    selected,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    toggleRow,
    toggleAll,
    allSelected,
    reload,
  };
}
