import React from 'react';
import { Input } from '@/components/Input/Input';
import { Autocomplete } from '@/components/Autocomplete/Autocomplete';
import { Textarea } from '@/components/Textarea/Textarea';
import type { DynamicPageField } from '@/components/DynamicPage/types';
import styles from './FnDynamicFields.module.scss';

function toInputString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

export function FnDynamicField({
  field,
  value,
  error,
  onChange,
}: Readonly<{
  field: DynamicPageField;
  value: unknown;
  error?: string;
  onChange: (name: string, val: unknown) => void;
}>) {
  const disabled = field.disabled || field.readOnly;
  const strValue = toInputString(value);

  if (field.fieldType === 'autocomplete') {
    const autocompleteValue = Array.isArray(value) ? (value as string[]) : strValue;
    return (
      <Autocomplete
        label={field.label}
        options={field.options}
        value={autocompleteValue}
        onChange={(val) => onChange(field.name, val)}
        onInputChange={field.onInputChange}
        disabled={disabled}
        error={error}
        required={field.required}
        placeholder={field.placeholder}
        helperText={field.helperText}
        className={field.className}
        style={field.style}
        multiple={field.multiple}
        clearable={field.clearable}
        allowCustomValue={field.allowCustomValue}
        fetchUrl={field.fetchUrl}
        fetchDebounce={field.fetchDebounce}
        loading={field.loading}
        noOptionsText={field.noOptionsText}
        filterOption={field.filterOption}
        fieldLabel={field.fieldLabel}
        fieldValue={field.fieldValue}
        codeWithDescription={field.codeWithDescription}
      />
    );
  }

  if (field.fieldType === 'textarea') {
    return (
      <Textarea
        label={field.label}
        value={strValue}
        onChange={(e) => onChange(field.name, e.target.value)}
        disabled={disabled}
        error={error}
        required={field.required}
        placeholder={field.placeholder}
        helperText={field.helperText}
        className={field.className}
        style={field.style}
        maxLength={field.maxLength}
        showCharCount={field.showCharCount}
        autoResize={field.autoResize}
        rows={field.rows}
      />
    );
  }

  if (field.fieldType === 'checkbox' || field.fieldType === 'toggle') {
    return (
      <label
        className={[styles.checkboxField, field.className].filter(Boolean).join(' ')}
        style={field.style}
      >
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.name, e.target.checked)}
          disabled={disabled}
        />
        <span className={styles.checkboxLabel}>
          {field.label}
          {field.required && <span className={styles.required}> *</span>}
        </span>
        {error && <span className={styles.fieldError}>{error}</span>}
      </label>
    );
  }

  if (field.fieldType === 'input') {
    return (
      <Input
        label={field.label}
        type={field.type ?? 'text'}
        value={strValue}
        onChange={(e) => onChange(field.name, e.target.value)}
        disabled={disabled}
        error={error}
        required={field.required}
        placeholder={field.placeholder}
        helperText={field.helperText}
        className={field.className}
        style={field.style}
        size={field.size}
        prefix={field.prefix}
        suffix={field.suffix}
        clearable={field.clearable}
        fullWidth={field.fullWidth ?? true}
        onClear={() => onChange(field.name, '')}
      />
    );
  }

  return (
    <Input
      label={field.label}
      type="date"
      value={strValue}
      onChange={(e) => onChange(field.name, e.target.value)}
      disabled={disabled}
      error={error}
      required={field.required}
      placeholder={field.placeholder}
      helperText={field.helperText}
      className={field.className}
      style={field.style}
      clearable={field.clearable}
      onClear={() => onChange(field.name, '')}
      fullWidth
    />
  );
}

export function FnDynamicFields({
  fields,
  formValues,
  formErrors,
  onChange,
}: Readonly<{
  fields: DynamicPageField[];
  formValues: Record<string, unknown>;
  formErrors: Record<string, string>;
  onChange: (name: string, val: unknown) => void;
}>) {
  const shouldShowField = (field: DynamicPageField): boolean => {
    if (field.hidden || (field as any).type === 'hidden') return false;
    if (!field.visibilityCondition) return true;

    const { dependsOn, showWhen, hideWhen } = field.visibilityCondition;
    const dependentValue = formValues[dependsOn];

    let shouldBeVisible = true;

    if (showWhen !== undefined) {
      if (Array.isArray(showWhen)) {
        shouldBeVisible = showWhen.includes(dependentValue);
      } else {
        shouldBeVisible = dependentValue === showWhen;
      }
    }

    if (hideWhen !== undefined) {
      const shouldHide = Array.isArray(hideWhen)
        ? hideWhen.includes(dependentValue)
        : dependentValue === hideWhen;

      if (shouldHide) {
        shouldBeVisible = false;
      }
    }

    return shouldBeVisible;
  };

  return (
    <>
      {fields.map((field) => {
        if (!shouldShowField(field)) return null;

        return (
          <FnDynamicField
            key={field.name}
            field={field}
            value={formValues[field.name]}
            error={formErrors[field.name]}
            onChange={onChange}
          />
        );
      })}
    </>
  );
}
