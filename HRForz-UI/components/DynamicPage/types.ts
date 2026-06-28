import type React from 'react';
import type { ApiConfig, DataTableProps } from '../DataTable/types';
import type { InputProps } from '../Input/Input';
import type { AutocompleteProps, AutocompleteOption } from '../Autocomplete/Autocomplete';
import type { TextareaProps } from '../Textarea/Textarea';

export type SidebarMode = 'add' | 'addnew' | 'edit' | 'editnew' | 'filter' | 'view';

export interface VisibilityCondition {
  dependsOn: string;
  showWhen?: unknown | unknown[];
  hideWhen?: unknown | unknown[];
}

export type DynamicPageSelectOption = AutocompleteOption;

export interface DynamicPageFieldCommon {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Excluded from the Add form */
  addExcludeField?: boolean;
  /** Makes the field read-only in Edit mode */
  editDisabled?: boolean;
  /** Visibility condition logic from Angular */
  visibilityCondition?: VisibilityCondition;
  /** Hidden flag */
  hidden?: boolean;
}

export type DynamicPageInputField = InputProps & DynamicPageFieldCommon & {
  fieldType: 'input';
};

export type DynamicPageAutocompleteField = AutocompleteProps & DynamicPageFieldCommon & {
  fieldType: 'autocomplete';
};

export type DynamicPageTextareaField = TextareaProps & DynamicPageFieldCommon & {
  fieldType: 'textarea';
};

export type DynamicPageCheckboxField = DynamicPageFieldCommon & {
  fieldType: 'checkbox';
  className?: string;
  style?: React.CSSProperties;
};

export type DynamicPageToggleField = DynamicPageFieldCommon & {
  fieldType: 'toggle';
  className?: string;
  style?: React.CSSProperties;
};

export type DynamicPageDateField = InputProps & DynamicPageFieldCommon & {
  fieldType: 'date';
};

export type DynamicPageField =
  | DynamicPageInputField
  | DynamicPageAutocompleteField
  | DynamicPageTextareaField
  | DynamicPageCheckboxField
  | DynamicPageToggleField
  | DynamicPageDateField;

export interface DynamicPageColumn {
  id: string;
  header: string;
  field?: string;
  accessor?: (row: Record<string, unknown>) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  cellType?: 'text' | 'status' | 'badge' | 'date' | 'datetime' | 'currency' | 'amount';
  valueFormatter?: (row: Record<string, unknown>) => React.ReactNode;
  statusStateResolver?: any;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Makes the cell clickable; 'view' opens the view sidebar */
  cellAction?: string;
}

export interface DynamicPageRowAction {
  id: string;
  /** Determines internal behavior: 'add' | 'edit' | 'editnew' | 'addnew' | 'delete' | 'view' | custom */
  name: string;
  label: string;
  icon?: string;
  danger?: boolean;
  url?: string | ((id: unknown) => string);
  isNavigate?: boolean;
  onState?: (row: Record<string, unknown>) => { visible?: boolean; disabled?: boolean };
}

export interface DynamicPageToolbarAction {
  id: string;
  name: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isNavigate?: boolean;
}

export interface DynamicPageTableConfig extends Omit<DataTableProps, 'columns' | 'rowActions' | 'toolbarActions'> {
  columns: DynamicPageColumn[];
  pageTitle?: string;
  rowActions?: DynamicPageRowAction[];
  toolbarActions?: DynamicPageToolbarAction[];
  deleteUrl?: string | ((id: string) => string);
  deleteMessage?: string;
}

export interface DynamicPageFormConfig {
  crud: DynamicPageField[];
  filter: DynamicPageField[];
}

export interface SideBarOptions {
  header: Partial<Record<SidebarMode, string>>;
  additionalHeader?: string;
}

export interface DynamicPageViewConfig {
  keys: Array<string | ((row: Record<string, unknown>) => { label: string; value: unknown })>;
}

export interface DynamicPageConfig {
  pageHeader?: string;
  table: DynamicPageTableConfig;
  form: DynamicPageFormConfig;
  sideBarOptions: SideBarOptions;
  viewConfig?: DynamicPageViewConfig;
  hasSideBarView?: boolean;
  payloadTransformer?: (values: Record<string, unknown>) => Record<string, unknown>;
  canEdit?: boolean;
}

export interface DynamicPageProps {
  config: DynamicPageConfig;
  onAction?: (row: Record<string, unknown>, actionName: string) => void;
  onSubmit?: (
    action: SidebarMode,
    values: Record<string, unknown>,
    row?: Record<string, unknown>,
  ) => Promise<void> | void;
  onFilter?: (values: Record<string, unknown>) => void;
  onExport?: (format: string) => void;
  onActionSuccess?: (result: { res: unknown; row: unknown }) => void;
  className?: string;
  style?: React.CSSProperties;
}
