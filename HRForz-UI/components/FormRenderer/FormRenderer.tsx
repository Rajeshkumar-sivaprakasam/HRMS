'use client';
import React from 'react';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';
import { Select } from '../Select/Select';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { Checkbox, CheckboxGroup } from '../Checkbox/Checkbox';
import { Radio, RadioGroup } from '../Radio/Radio';
import { Toggle } from '../Toggle/Toggle';
import { Divider } from '../Divider/Divider';
import { ProfilePhotoUpload } from '../ProfilePhotoUpload/ProfilePhotoUpload';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Button } from '../Button/Button';
import { Text } from '../Typography/Typography';
import styles from './FormRenderer.module.scss';
import { useFormEngine } from './useFormEngine';
import type {
  FormField, FormRendererProps, FormEngine,
  InputField, TextareaField, SelectField, AutocompleteField,
  CheckboxField, RadioField, SegmentedControlField, ToggleField, DividerField, FieldsetField, ProfilePhotoField,
} from './types';

// ─── Column span helpers ──────────────────────────────────────────────────────

const DEFAULT_SPANS: Record<string, number | 'full'> = {
  FNTextarea: 2,
  FNFieldset: 'full',
  FNDivider: 'full',
};

function colClass(span: number | 'full' | undefined, fieldType: string): string {
  const resolved = span ?? DEFAULT_SPANS[fieldType] ?? 1;
  if (resolved === 'full') return styles.colFull;
  return styles[`col${resolved}`] ?? styles.col1;
}

// ─── Error display ────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className={styles.fieldError} role="alert">{message}</span>;
}

function shouldShowError(name: string, engine: FormEngine, showAllErrors?: boolean): boolean {
  return showAllErrors === true || engine.touched.has(name) || engine.submitAttempted;
}

// ─── Field renderers ──────────────────────────────────────────────────────────

function InputRenderer({ field, engine, showAllErrors }: { field: InputField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  
  // Extract native input validation attributes from schema
  const v = field.validations;
  const maxLength = typeof v?.maxLength === 'number' ? v.maxLength : v?.maxLength?.value;
  const minLength = typeof v?.minLength === 'number' ? v.minLength : v?.minLength?.value;
  const min = typeof v?.min === 'number' ? v.min : v?.min?.value;
  const max = typeof v?.max === 'number' || typeof v?.max === 'string' ? v.max : v?.max?.value;

  return (
    <Input
      type={field.type ?? 'text'}
      label={field.label}
      placeholder={field.placeholder}
      helperText={!error ? field.helperText : undefined}
      error={error}
      required={engine.requiredMap[field.name]}
      disabled={engine.disabledMap[field.name]}
      readOnly={field.readOnly}
      value={(engine.values[field.name] as string) ?? ''}
      onChange={e => engine.setValue(field.name, e.target.value)}
      onBlur={() => engine.touchField(field.name)}
      prefix={field.prefix}
      suffix={field.suffix}
      maxLength={maxLength}
      minLength={minLength}
      min={min}
      max={max}
    />
  );
}

function TextareaRenderer({ field, engine, showAllErrors }: { field: TextareaField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  return (
    <Textarea
      label={field.label}
      placeholder={field.placeholder}
      helperText={!error ? field.helperText : undefined}
      error={error}
      required={engine.requiredMap[field.name]}
      disabled={engine.disabledMap[field.name]}
      readOnly={field.readOnly}
      rows={field.rows ?? 3}
      autoResize={field.autoResize}
      showCharCount={field.showCharCount}
      maxLength={typeof field.validations?.maxLength === 'number' ? field.validations.maxLength : field.validations?.maxLength?.value}
      value={(engine.values[field.name] as string) ?? ''}
      onChange={e => engine.setValue(field.name, e.target.value)}
      onBlur={() => engine.touchField(field.name)}
    />
  );
}

function SelectRenderer({ field, engine, showAllErrors }: { field: SelectField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  const raw = engine.values[field.name];
  const value = field.multiple
    ? (Array.isArray(raw) ? raw : raw ? [raw as string] : [])
    : (raw as string | undefined) ?? '';
  // Use resolved options (may differ when optionsMap rules are active)
  const options = engine.resolvedOptions[field.name] ?? field.options;

  return (
    <div className={styles.fieldWrap}>
      <Select
        label={field.label}
        options={options}
        value={value}
        onChange={v => { engine.setValue(field.name, v); engine.touchField(field.name); }}
        placeholder={field.placeholder ?? `Select ${field.label ?? ''}...`}
        multiple={field.multiple}
        searchable={field.searchable}
        clearable={field.clearable}
        disabled={engine.disabledMap[field.name]}
        error={error}
        helperText={!error ? field.helperText : undefined}
        required={engine.requiredMap[field.name]}
      />
    </div>
  );
}

function AutocompleteRenderer({ field, engine, showAllErrors }: { field: AutocompleteField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  const raw = engine.values[field.name];
  const value = field.multiple
    ? (Array.isArray(raw) ? raw : raw ? [raw as string] : [])
    : (raw as string | undefined) ?? '';
  const options = engine.resolvedOptions[field.name] ?? field.options;

  return (
    <Autocomplete
      label={field.label}
      options={options}
      value={value}
      onChange={v => { engine.setValue(field.name, v); engine.touchField(field.name); }}
      placeholder={field.placeholder ?? `Type to search ${field.label ?? ''}...`}
      multiple={field.multiple}
      clearable={field.clearable}
      allowCustomValue={field.allowCustomValue}
      fetchUrl={field.fetchUrl}
      disabled={engine.disabledMap[field.name]}
      error={error}
      helperText={!error ? field.helperText : undefined}
      required={engine.requiredMap[field.name]}
    />
  );
}

function CheckboxRenderer({ field, engine, showAllErrors }: { field: CheckboxField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  const disabled = engine.disabledMap[field.name];

  if (!field.options) {
    return (
      <div className={styles.fieldWrap}>
        <Checkbox
          label={field.label}
          checked={Boolean(engine.values[field.name])}
          disabled={disabled}
          onChange={e => { engine.setValue(field.name, e.target.checked); engine.touchField(field.name); }}
        />
        {field.helperText && !error && <Text variant="caption" className={styles.helperText}>{field.helperText}</Text>}
        <FieldError message={error} />
      </div>
    );
  }

  const selectedValues = (engine.values[field.name] as string[] | undefined) ?? [];
  return (
    <div className={styles.fieldWrap}>
      <CheckboxGroup label={field.label} direction={field.direction ?? 'vertical'}>
        {field.options.map(opt => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            disabled={disabled || opt.disabled}
            checked={selectedValues.includes(opt.value)}
            onChange={e => {
              engine.touchField(field.name);
              const next = e.target.checked
                ? [...selectedValues, opt.value]
                : selectedValues.filter(v => v !== opt.value);
              engine.setValue(field.name, next);
            }}
          />
        ))}
      </CheckboxGroup>
      {field.helperText && !error && <Text variant="caption" className={styles.helperText}>{field.helperText}</Text>}
      <FieldError message={error} />
    </div>
  );
}

function RadioRenderer({ field, engine, showAllErrors }: { field: RadioField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  const disabled = engine.disabledMap[field.name];
  return (
    <div className={styles.fieldWrap}>
      <RadioGroup label={field.label} name={field.name} direction={field.direction ?? 'vertical'}>
        {field.options.map(opt => (
          <Radio
            key={opt.value}
            label={opt.label}
            value={opt.value}
            disabled={disabled || opt.disabled}
            checked={engine.values[field.name] === opt.value}
            onChange={() => { engine.setValue(field.name, opt.value); engine.touchField(field.name); }}
          />
        ))}
      </RadioGroup>
      {field.helperText && !error && <Text variant="caption" className={styles.helperText}>{field.helperText}</Text>}
      <FieldError message={error} />
    </div>
  );
}

function SegmentedControlRenderer({ field, engine, showAllErrors }: { field: SegmentedControlField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  return (
    <div className={styles.fieldWrap}>
      <SegmentedControl
        label={field.label}
        options={field.options}
        value={(engine.values[field.name] as string) ?? ''}
        onChange={val => { engine.setValue(field.name, val); engine.touchField(field.name); }}
        disabled={engine.disabledMap[field.name]}
      />
      {field.helperText && !error && <Text variant="caption" className={styles.helperText}>{field.helperText}</Text>}
      <FieldError message={error} />
    </div>
  );
}

function ToggleRenderer({ field, engine, showAllErrors }: { field: ToggleField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  return (
    <div className={styles.fieldWrap}>
      <Toggle
        label={field.label}
        size={field.size}
        disabled={engine.disabledMap[field.name]}
        checked={Boolean(engine.values[field.name])}
        onChange={e => { engine.setValue(field.name, e.target.checked); engine.touchField(field.name); }}
      />
      {field.helperText && !error && <Text variant="caption" className={styles.helperText}>{field.helperText}</Text>}
      <FieldError message={error} />
    </div>
  );
}

function DividerRenderer({ field }: { field: DividerField }) {
  if (field.variant === 'heading') {
    return <p className={styles.sectionHeading}>{field.label}</p>;
  }
  if (field.variant === 'subheading') {
    return <p className={styles.sectionSubheading}>{field.label}</p>;
  }
  return <Divider label={field.label} />;
}

function ProfilePhotoRenderer({ field, engine, showAllErrors }: { field: ProfilePhotoField; engine: FormEngine; showAllErrors?: boolean }) {
  const error = shouldShowError(field.name, engine, showAllErrors) ? engine.fieldErrors[field.name] : undefined;
  return (
    <ProfilePhotoUpload
      label={field.label}
      value={engine.values[field.name] as any}
      onChange={val => engine.setValue(field.name, val)}
      onBlur={() => engine.touchField(field.name)}
      error={error}
      helperText={field.helperText}
      disabled={engine.disabledMap[field.name]}
    />
  );
}

// ─── Single field dispatcher ──────────────────────────────────────────────────

function FieldRenderer({
  field, engine, columns, showAllErrors,
}: {
  field: FormField;
  engine: FormEngine;
  columns: number;
  showAllErrors?: boolean;
}) {
  if (engine.visibilityMap[field.name] === false) return null;

  const fieldClassName = 'className' in field ? (field as { className?: string }).className : undefined;
  const cls = [colClass(field.colSpan, field.fieldType), fieldClassName].filter(Boolean).join(' ');

  if (field.fieldType === 'FNFieldset') {
    return (
      <FieldsetRenderer
        field={field}
        engine={engine}
        columns={columns}
        showAllErrors={showAllErrors}
        className={cls}
      />
    );
  }

  return (
    <div className={cls} data-field={field.name}>
      {field.fieldType === 'FNInput'        && <InputRenderer        field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNTextarea'     && <TextareaRenderer     field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNSelect'       && <SelectRenderer       field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNAutocomplete' && <AutocompleteRenderer field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNCheckbox'     && <CheckboxRenderer     field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNRadio'        && <RadioRenderer        field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNSegmentedControl' && <SegmentedControlRenderer field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNToggle'       && <ToggleRenderer       field={field} engine={engine} showAllErrors={showAllErrors} />}
      {field.fieldType === 'FNDivider'      && <DividerRenderer      field={field as DividerField} />}
      {field.fieldType === 'FNProfilePhoto' && <ProfilePhotoRenderer field={field} engine={engine} showAllErrors={showAllErrors} />}
    </div>
  );
}

function FieldsetRenderer({
  field, engine, columns, showAllErrors, className,
}: {
  field: FieldsetField;
  engine: FormEngine;
  columns: number;
  showAllErrors?: boolean;
  className?: string;
}) {
  if (engine.visibilityMap[field.name] === false) return null;
  return (
    <div className={[styles.fieldset, className].filter(Boolean).join(' ')}>
      {field.title && <p className={styles.fieldsetTitle}>{field.title}</p>}
      <div className={styles.grid} style={{ '--form-cols': columns } as React.CSSProperties}>
        {field.fields.map(f => (
          <FieldRenderer key={f.name} field={f} engine={engine} columns={columns} showAllErrors={showAllErrors} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const FormRenderer: React.FC<FormRendererProps> = ({
  schema,
  defaultValues,
  values: controlledValues,
  onChange,
  onSubmit,
  onReset,
  columns = 2,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  showAllErrors = false,
  hideActions = false,
  className,
  style,
}) => {
  const engine = useFormEngine(schema, {
    defaultValues,
    values: controlledValues,
    onChange,
    onSubmit,
    onReset,
  });

  return (
    <form
      className={[styles.form, className].filter(Boolean).join(' ')}
      style={style}
      onSubmit={engine.handleSubmit}
      noValidate
      data-testid="form-renderer"
    >
      <div className={styles.grid} style={{ '--form-cols': columns } as React.CSSProperties}>
        {schema.map(field => (
          <FieldRenderer
            key={field.name}
            field={field}
            engine={engine}
            columns={columns}
            showAllErrors={showAllErrors}
          />
        ))}
      </div>

      {!hideActions && (
        <div className={styles.actions}>
          {showReset && (
            <Button type="button" variant="ghost" onClick={engine.reset}>
              {resetLabel}
            </Button>
          )}
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
};
