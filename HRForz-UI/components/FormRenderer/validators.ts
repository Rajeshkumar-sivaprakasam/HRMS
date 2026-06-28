import type {
  FormField, FieldCondition, FieldValidations, ConditionExpr, ConditionRule,
  FieldOption, OptionsRule,
  InputField, TextareaField, SelectField, AutocompleteField,
  CheckboxField, RadioField, ToggleField,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ControlField = InputField | TextareaField | SelectField | AutocompleteField | CheckboxField | RadioField | ToggleField;

function isControlField(f: FormField): f is ControlField {
  return f.fieldType !== 'FNDivider' && f.fieldType !== 'FNFieldset';
}

export function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    value === false
  );
}

function resolvePattern(raw: FieldValidations['pattern']): RegExp {
  if (!raw) return /(?:)/;
  if (raw instanceof RegExp) return raw;
  if (typeof raw === 'string') return new RegExp(raw);
  const v = raw.value;
  return v instanceof RegExp ? v : new RegExp(v);
}

function resolvePatternMessage(raw: FieldValidations['pattern'], override?: string): string {
  if (override) return override;
  if (raw && typeof raw === 'object' && !(raw instanceof RegExp) && 'message' in raw && raw.message) {
    return raw.message;
  }
  return 'Invalid format';
}

/** Flatten schema (including nested fieldset fields) into a flat array */
export function flattenSchema(schema: FormField[]): FormField[] {
  const result: FormField[] = [];
  for (const f of schema) {
    result.push(f);
    if (f.fieldType === 'FNFieldset') {
      result.push(...flattenSchema(f.fields));
    }
  }
  return result;
}

// ─── Condition expression evaluator ──────────────────────────────────────────

function evalRule(rule: ConditionRule, values: Record<string, unknown>): boolean {
  const actual = values[rule.dependsOn];
  const expected = rule.value;
  const op = rule.op ?? '==';

  switch (op) {
    case '==':
      return Array.isArray(expected) ? expected.includes(actual) : actual === expected;

    case '!=':
      return Array.isArray(expected) ? !expected.includes(actual) : actual !== expected;

    case 'in':
      return Array.isArray(expected) && expected.includes(actual);

    case 'notIn':
      return !(Array.isArray(expected) && expected.includes(actual));

    case 'empty':
      return isEmpty(actual);

    case 'notEmpty':
      return !isEmpty(actual);

    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;

    case 'gte':
      return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;

    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;

    case 'lte':
      return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;

    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.toLowerCase().includes(expected.toLowerCase());
      }
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;

    default:
      return false;
  }
}

/** Evaluate a ConditionExpr (single rule or AND/OR group) against current form values */
export function evalConditionExpr(expr: ConditionExpr, values: Record<string, unknown>): boolean {
  if ('logic' in expr) {
    const { logic, rules } = expr;
    return logic === 'AND'
      ? rules.every(r => evalRule(r, values))
      : rules.some(r => evalRule(r, values));
  }
  return evalRule(expr, values);
}

// ─── Legacy condition helpers (backward compat) ───────────────────────────────

function matchesLegacyValue(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return expected.includes(actual);
  return actual === expected;
}

// ─── Visibility ───────────────────────────────────────────────────────────────

function evalVisibility(cond: FieldCondition, values: Record<string, unknown>): boolean {
  // New-style expressions take precedence
  if (cond.hide && evalConditionExpr(cond.hide, values)) return false;
  if (cond.show) return evalConditionExpr(cond.show, values);

  // Legacy shorthand
  const depValue = cond.dependsOn ? values[cond.dependsOn] : undefined;
  if (cond.hideWhen !== undefined && matchesLegacyValue(depValue, cond.hideWhen)) return false;
  if (cond.showWhen !== undefined) return matchesLegacyValue(depValue, cond.showWhen);

  return true;
}

export function computeVisibilityMap(
  schema: FormField[],
  values: Record<string, unknown>,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const f of flattenSchema(schema)) {
    map[f.name] = f.condition ? evalVisibility(f.condition, values) : true;
  }
  return map;
}

// ─── Disabled ────────────────────────────────────────────────────────────────

function evalDisabled(field: ControlField, values: Record<string, unknown>): boolean {
  const base = field.disabled ?? false;
  const cond = field.condition;
  if (!cond) return base;

  // New-style
  if (cond.disable && evalConditionExpr(cond.disable, values)) return true;
  if (cond.enable) return !evalConditionExpr(cond.enable, values);

  // Legacy
  const depValue = cond.dependsOn ? values[cond.dependsOn] : undefined;
  if (cond.disableWhen !== undefined && matchesLegacyValue(depValue, cond.disableWhen)) return true;
  if (cond.enableWhen !== undefined) return !matchesLegacyValue(depValue, cond.enableWhen);

  return base;
}

export function computeDisabledMap(
  schema: FormField[],
  values: Record<string, unknown>,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const f of flattenSchema(schema)) {
    map[f.name] = isControlField(f) ? evalDisabled(f, values) : false;
  }
  return map;
}

// ─── Required (static + conditional) ─────────────────────────────────────────

export function computeRequiredMap(
  schema: FormField[],
  values: Record<string, unknown>,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const f of flattenSchema(schema)) {
    if (!isControlField(f)) continue;
    const base = f.required ?? false;
    const requiredWhen = f.condition?.requiredWhen;
    map[f.name] = base || (requiredWhen ? evalConditionExpr(requiredWhen, values) : false);
  }
  return map;
}

// ─── Dynamic options resolution ───────────────────────────────────────────────

function resolveOptions(rules: OptionsRule[] | undefined, staticOptions: FieldOption[], values: Record<string, unknown>): FieldOption[] {
  if (!rules || rules.length === 0) return staticOptions;
  for (const rule of rules) {
    if (evalConditionExpr(rule.when, values)) return rule.options;
  }
  return staticOptions;
}

export function computeResolvedOptions(
  schema: FormField[],
  values: Record<string, unknown>,
): Record<string, FieldOption[]> {
  const map: Record<string, FieldOption[]> = {};
  for (const f of flattenSchema(schema)) {
    if (f.fieldType === 'FNSelect' || f.fieldType === 'FNAutocomplete') {
      map[f.name] = resolveOptions(f.optionsMap, f.options, values);
    }
  }
  return map;
}

// ─── setValueWhen evaluation ──────────────────────────────────────────────────

/**
 * Scan all fields with `setValueWhen` rules and return a map of name → forced value.
 * The first matching rule per field wins.
 */
export function computeAutoValues(
  schema: FormField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  for (const f of flattenSchema(schema)) {
    if (!isControlField(f)) continue;
    const rules = f.condition?.setValueWhen;
    if (!rules) continue;
    for (const rule of rules) {
      if (evalConditionExpr(rule.when, values)) {
        overrides[f.name] = rule.value;
        break;
      }
    }
  }
  return overrides;
}

// ─── resetOnHide helper ───────────────────────────────────────────────────────

/**
 * Given old and new visibility maps, return names of fields that just became hidden
 * AND have `resetOnHide: true`. Their values should be cleared.
 */
export function getResetOnHideFields(
  schema: FormField[],
  prevVis: Record<string, boolean>,
  nextVis: Record<string, boolean>,
): string[] {
  const toReset: string[] = [];
  for (const f of flattenSchema(schema)) {
    if (
      prevVis[f.name] === true &&
      nextVis[f.name] === false &&
      f.condition?.resetOnHide === true
    ) {
      toReset.push(f.name);
    }
  }
  return toReset;
}

// ─── Single field validation ──────────────────────────────────────────────────

export function validateField(
  field: FormField,
  value: unknown,
  allValues: Record<string, unknown>,
  effectiveRequired?: boolean,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (!isControlField(field)) return errs;

  const { validations: v, errors: msgs = {}, label, name } = field;
  const required = effectiveRequired ?? field.required;

  if (required && isEmpty(value)) {
    errs.required = msgs.required ?? `${label || name} is required`;
    return errs;
  }

  if (isEmpty(value) || !v) return errs;

  const str = typeof value === 'string' ? value : String(value);
  const num = Number(value);

  if (v.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      errs.email = (typeof v.email === 'string' ? v.email : null) ?? msgs.email ?? 'Enter a valid email address';
    }
  }

  if (v.minLength !== undefined) {
    const min = typeof v.minLength === 'number' ? v.minLength : v.minLength.value;
    const msg = (typeof v.minLength === 'object' ? v.minLength.message : undefined) ?? msgs.minLength ?? `Minimum ${min} characters required`;
    if (str.length < min) errs.minLength = msg;
  }

  if (v.maxLength !== undefined) {
    const max = typeof v.maxLength === 'number' ? v.maxLength : v.maxLength.value;
    const msg = (typeof v.maxLength === 'object' ? v.maxLength.message : undefined) ?? msgs.maxLength ?? `Maximum ${max} characters allowed`;
    if (str.length > max) errs.maxLength = msg;
  }

  if (v.min !== undefined) {
    const minVal = typeof v.min === 'object' ? v.min.value : v.min;
    const msg = (typeof v.min === 'object' ? v.min.message : undefined) ?? msgs.min ?? `Minimum value is ${minVal}`;
    
    if (!isNaN(num) && typeof minVal === 'number') {
      if (num < (minVal as number)) errs.min = msg;
    } else if (typeof value === 'string' && typeof minVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && /^\d{4}-\d{2}-\d{2}$/.test(minVal)) {
      if (value < minVal) errs.min = msg;
    }
  }

  if (v.max !== undefined) {
    const maxVal = typeof v.max === 'object' ? v.max.value : v.max;
    const msg = (typeof v.max === 'object' ? v.max.message : undefined) ?? msgs.max ?? `Maximum value is ${maxVal}`;
    
    if (!isNaN(num) && typeof maxVal === 'number') {
      if (num > (maxVal as number)) errs.max = msg;
    } else if (typeof value === 'string' && typeof maxVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && /^\d{4}-\d{2}-\d{2}$/.test(maxVal)) {
      if (value > maxVal) errs.max = msg;
    }
  }

  if (v.pattern !== undefined) {
    const re = resolvePattern(v.pattern);
    const msg = resolvePatternMessage(v.pattern, msgs.pattern);
    if (!re.test(str)) errs.pattern = msg;
  }

  if (v.custom) {
    for (const rule of v.custom) {
      if (!rule.validate(value, allValues)) {
        errs[rule.key] = msgs[rule.key] ?? rule.message;
      }
    }
  }

  return errs;
}

// ─── Full form validation ─────────────────────────────────────────────────────

export function validateForm(
  schema: FormField[],
  values: Record<string, unknown>,
  visibilityMap: Record<string, boolean>,
  requiredMap?: Record<string, boolean>,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const field of flattenSchema(schema)) {
    if (visibilityMap[field.name] === false) continue;
    const effectiveRequired = requiredMap ? requiredMap[field.name] : undefined;
    const errs = validateField(field, values[field.name], values, effectiveRequired);
    if (Object.keys(errs).length > 0) result[field.name] = errs;
  }

  return result;
}

/** Return the first error message for a field, or undefined */
export function firstError(errors: Record<string, string> | undefined): string | undefined {
  if (!errors) return undefined;
  return Object.values(errors)[0];
}
