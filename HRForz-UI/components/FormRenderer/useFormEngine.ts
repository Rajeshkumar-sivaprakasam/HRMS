'use client';
import { useState, useMemo, useCallback } from 'react';
import type { FormField, FormEngine, FormRendererProps } from './types';
import {
  computeVisibilityMap,
  computeDisabledMap,
  computeRequiredMap,
  computeResolvedOptions,
  computeAutoValues,
  getResetOnHideFields,
  validateForm,
  firstError,
} from './validators';

export function useFormEngine(
  schema: FormField[],
  options: Pick<FormRendererProps, 'defaultValues' | 'values' | 'onChange' | 'onSubmit' | 'onReset'>,
): FormEngine {
  const { defaultValues = {}, values: controlledValues, onChange, onSubmit, onReset } = options;

  const isControlled = controlledValues !== undefined;

  const [internalValues, setInternalValues] = useState<Record<string, unknown>>(defaultValues);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const values = isControlled ? controlledValues! : internalValues;

  const visibilityMap  = useMemo(() => computeVisibilityMap(schema, values),  [schema, values]);
  const disabledMap    = useMemo(() => computeDisabledMap(schema, values),    [schema, values]);
  const requiredMap    = useMemo(() => computeRequiredMap(schema, values),    [schema, values]);
  const resolvedOptions = useMemo(() => computeResolvedOptions(schema, values), [schema, values]);

  const allErrors = useMemo(
    () => validateForm(schema, values, visibilityMap, requiredMap),
    [schema, values, visibilityMap, requiredMap],
  );

  const fieldErrors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [name, errs] of Object.entries(allErrors)) {
      const msg = firstError(errs);
      if (msg) map[name] = msg;
    }
    return map;
  }, [allErrors]);

  const isValid = Object.keys(allErrors).length === 0;

  const setValue = useCallback((name: string, value: unknown) => {
    // Build next values with the user's change
    let next: Record<string, unknown> = { ...values, [name]: value };

    // ── 1. resetOnHide ────────────────────────────────────────────────────────
    // Fields that just became hidden and have resetOnHide:true should be cleared.
    const prevVis = computeVisibilityMap(schema, values);
    const nextVis = computeVisibilityMap(schema, next);
    const toReset = getResetOnHideFields(schema, prevVis, nextVis);
    if (toReset.length > 0) {
      next = { ...next };
      for (const n of toReset) next[n] = undefined;
    }

    // ── 2. setValueWhen ───────────────────────────────────────────────────────
    // Auto-set fields whose conditions are met after the above changes.
    const autoValues = computeAutoValues(schema, next);
    if (Object.keys(autoValues).length > 0) {
      next = { ...next, ...autoValues };
    }

    if (!isControlled) setInternalValues(next);
    onChange?.(name, value, next);
  }, [values, isControlled, onChange, schema]);

  const touchField = useCallback((name: string) => {
    setTouched(prev => {
      if (prev.has(name)) return prev;
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const allNames = Object.keys(visibilityMap).filter(n => visibilityMap[n]);
    setTouched(new Set(allNames));
    if (isValid) onSubmit?.(values);
  }, [isValid, values, visibilityMap, onSubmit]);

  const reset = useCallback(() => {
    if (!isControlled) setInternalValues(defaultValues);
    setTouched(new Set());
    setSubmitAttempted(false);
    onReset?.();
  }, [isControlled, defaultValues, onReset]);

  return {
    values,
    fieldErrors,
    allErrors,
    touched,
    visibilityMap,
    disabledMap,
    requiredMap,
    resolvedOptions,
    isValid,
    submitAttempted,
    setValue,
    touchField,
    handleSubmit,
    reset,
  };
}
