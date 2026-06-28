import React from 'react';

export type CellType = 'text' | 'status' | 'badge' | 'date' | 'datetime' | 'currency' | 'amount';

export type StatusState = 'success' | 'warning' | 'error' | 'info' | 'default';
export type StatusStateResolver<T = Record<string, unknown>> =
  StatusState | ((value: unknown, row: T) => StatusState);

export interface DataTableColumn<T = Record<string, unknown>> {
  id: string;
  header: string;
  field?: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  cellType?: CellType;
  valueFormatter?: (row: T) => React.ReactNode;
  statusStateResolver?: StatusStateResolver<T>;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface RowAction<T = Record<string, unknown>> {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: (row: T) => void;
  onState?: (row: T) => { visible?: boolean; disabled?: boolean };
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick: () => void;
}

export interface ApiConfig<T = Record<string, unknown>> {
  url: string;
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  dataKey?: string;
  mapResponse?: (res: unknown) => { data: T[]; total: number };
  transformParams?: (params: { page: number; pageSize: number; search: string; sort: SortState | null; isServerSidePagination?: boolean }) => any;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface ExportOption {
  id: string;
  label: string;
  icon?: string;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data?: T[];
  apiConfig?: ApiConfig<T>;
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  dataKey?: string;
  searchable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction[];
  loading?: boolean;
  emptyMessage?: string;
  onSelectionChange?: (rows: T[]) => void;
  isServerSidePagination?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
  showTableHeader?: boolean;
  showPagination?: boolean;
  exportable?: boolean;
  exportOptions?: ExportOption[];
  onExport?: (format: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
