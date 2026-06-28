// ─── Condition building blocks ────────────────────────────────────────────────

type ConditionValue = unknown | unknown[];

/**
 * Comparison operators for condition rules.
 *
 *  ==       exact match (or array includes)
 *  !=       not equal
 *  in       actual value is one of the expected array
 *  notIn    actual value is NOT in the expected array
 *  empty    field has no value (null / '' / [] / false)
 *  notEmpty field has a value
 *  gt/gte/lt/lte  numeric comparisons
 *  contains string contains substring, or array contains item
 */
export type ConditionOperator =
  | '==' | '!=' | 'in' | 'notIn'
  | 'empty' | 'notEmpty'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains';

/** A single field comparison */
export interface ConditionRule {
  /** Name of the field to check */
  dependsOn: string;
  /** Comparison operator. Defaults to '==' */
  op?: ConditionOperator;
  /** Value(s) to compare against. Not needed for 'empty' / 'notEmpty'. */
  value?: unknown | unknown[];
}

/** Multiple rules combined with AND / OR logic */
export interface ConditionGroup {
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
}

/** A single rule or a compound group */
export type ConditionExpr = ConditionRule | ConditionGroup;

// ─── Field condition (all dependency effects in one place) ────────────────────

export interface FieldCondition {
  // ── Legacy single-dependency shorthand (still fully supported) ──
  // Prefer the ConditionExpr form below for multi-field or operator-based conditions.
  dependsOn?: string;
  /** Show this field when dependsOn field equals this value */
  showWhen?: ConditionValue;
  /** Hide this field when dependsOn field equals this value */
  hideWhen?: ConditionValue;
  /** Enable this field when dependsOn field equals this value; otherwise disabled */
  enableWhen?: ConditionValue;
  /** Disable this field when dependsOn field equals this value */
  disableWhen?: ConditionValue;

  // ── Extended condition expressions (single rule or AND / OR group) ──
  /** Show when expression evaluates to true */
  show?: ConditionExpr;
  /** Hide when expression evaluates to true (takes precedence over show) */
  hide?: ConditionExpr;
  /** Enable when expression is true; field is disabled otherwise */
  enable?: ConditionExpr;
  /** Disable when expression is true */
  disable?: ConditionExpr;

  // ── Value effects ──
  /**
   * Clear this field's value when it transitions from visible → hidden.
   * Prevents stale hidden values from being submitted.
   */
  resetOnHide?: boolean;
  /**
   * Make this field required only when the expression evaluates to true.
   * Merges with (or overrides) the static `required` flag.
   */
  requiredWhen?: ConditionExpr;
  /**
   * Auto-set this field's value when a condition is met.
   * Rules are evaluated in order; the first matching rule wins.
   * Fires on every value change — useful for cascading pre-fills.
   */
  setValueWhen?: Array<{ when: ConditionExpr; value: unknown }>;
}

// ─── Validations ──────────────────────────────────────────────────────────────

export interface CustomValidator {
  key: string;
  validate: (value: unknown, formValues: Record<string, unknown>) => boolean;
  message: string;
}

export interface FieldValidations {
  email?: boolean | string;
  minLength?: number | { value: number; message?: string };
  maxLength?: number | { value: number; message?: string };
  min?: number | { value: number; message?: string };
  max?: number | { value: number; message?: string };
  pattern?: string | RegExp | { value: string | RegExp; message?: string };
  custom?: CustomValidator[];
}

// ─── Shared option type ───────────────────────────────────────────────────────

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Dynamically swap or filter options based on a condition.
 * The first matching entry in the array wins.
 * If no entry matches, fall back to the field's static `options`.
 */
export interface OptionsRule {
  when: ConditionExpr;
  options: FieldOption[];
}

// ─── Base ─────────────────────────────────────────────────────────────────────

interface BaseField {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  condition?: FieldCondition;
  validations?: FieldValidations;
  errors?: Record<string, string>;
  colSpan?: 1 | 2 | 3 | 4 | 'full';
  className?: string;
}

// ─── Field types ──────────────────────────────────────────────────────────────

export interface InputField extends BaseField {
  fieldType: 'FNInput';
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  prefix?: string;
  suffix?: string;
}

export interface TextareaField extends BaseField {
  fieldType: 'FNTextarea';
  rows?: number;
  autoResize?: boolean;
  showCharCount?: boolean;
}

export interface SelectField extends BaseField {
  fieldType: 'FNSelect';
  options: FieldOption[];
  /** Swap options based on form state — e.g. filter states by selected country */
  optionsMap?: OptionsRule[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}

export interface AutocompleteField extends BaseField {
  fieldType: 'FNAutocomplete';
  options: FieldOption[];
  /** Swap options based on form state */
  optionsMap?: OptionsRule[];
  multiple?: boolean;
  clearable?: boolean;
  allowCustomValue?: boolean;
  fetchUrl?: string | ((q: string) => string);
}

export interface CheckboxField extends BaseField {
  fieldType: 'FNCheckbox';
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  direction?: 'horizontal' | 'vertical';
}

export interface RadioField extends BaseField {
  fieldType: 'FNRadio';
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  direction?: 'horizontal' | 'vertical';
}

export interface SegmentedControlField extends BaseField {
  fieldType: 'FNSegmentedControl';
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export interface ToggleField extends BaseField {
  fieldType: 'FNToggle';
  size?: 'sm' | 'md' | 'lg';
}

/** Visual divider / section heading — not a form control */
export interface DividerField {
  fieldType: 'FNDivider';
  name: string;
  label?: string;
  variant?: 'heading' | 'subheading' | 'divider';
  colSpan?: 1 | 2 | 3 | 4 | 'full';
  condition?: FieldCondition;
}

/** Groups fields under a collapsible card section */
export interface FieldsetField {
  fieldType: 'FNFieldset';
  name: string;
  title?: string;
  fields: FormField[];
  colSpan?: 1 | 2 | 3 | 4 | 'full';
  condition?: FieldCondition;
}

/** Custom component for profile photo upload */
export interface ProfilePhotoField extends BaseField {
  fieldType: 'FNProfilePhoto';
}

export type FormField =
  | InputField
  | TextareaField
  | SelectField
  | AutocompleteField
  | CheckboxField
  | RadioField
  | SegmentedControlField
  | ToggleField
  | DividerField
  | FieldsetField
  | ProfilePhotoField;

// ─── FormRenderer props ───────────────────────────────────────────────────────

export interface FormRendererProps {
  schema: FormField[];
  defaultValues?: Record<string, unknown>;
  values?: Record<string, unknown>;
  onChange?: (name: string, value: unknown, formValues: Record<string, unknown>) => void;
  onSubmit?: (values: Record<string, unknown>) => void;
  onReset?: () => void;
  columns?: 1 | 2 | 3 | 4;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  showAllErrors?: boolean;
  hideActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ─── Engine return type ───────────────────────────────────────────────────────

export interface FormEngine {
  values: Record<string, unknown>;
  fieldErrors: Record<string, string>;
  allErrors: Record<string, Record<string, string>>;
  touched: Set<string>;
  visibilityMap: Record<string, boolean>;
  disabledMap: Record<string, boolean>;
  /** Effective required state per field (merges static required + requiredWhen) */
  requiredMap: Record<string, boolean>;
  /** Effective options per field (resolves optionsMap rules against current values) */
  resolvedOptions: Record<string, FieldOption[]>;
  isValid: boolean;
  submitAttempted: boolean;
  setValue: (name: string, value: unknown) => void;
  touchField: (name: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: () => void;
}
