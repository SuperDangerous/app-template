import { useState, useEffect, useCallback } from 'react';

export interface UseFormStateOptions {
  initialValues: any;
  defaultValues?: any;
  onSave: (values: any) => Promise<void>;
  timeout?: number;
}

export interface FormState {
  values: any;
  setValues: (values: any | ((prev: any) => any)) => void;
  isDirty: boolean;
  isSaving: boolean;
  canSave: boolean;
  save: () => Promise<void>;
  reset: () => void;
  resetToDefaults: () => void;
}

export function useFormState({
  initialValues,
  defaultValues = {},
  onSave,
  timeout = 15000
}: UseFormStateOptions): FormState {
  const [values, setValues] = useState(initialValues);
  const [originalValues, setOriginalValues] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const dirty = JSON.stringify(values) !== JSON.stringify(originalValues);
    setIsDirty(dirty);
  }, [values, originalValues]);

  const save = useCallback(async () => {
    if (!isDirty || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(values);
      setOriginalValues(values);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [values, isDirty, isSaving, onSave]);

  const reset = useCallback(() => {
    setValues(originalValues);
  }, [originalValues]);

  const resetToDefaults = useCallback(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  return {
    values,
    setValues,
    isDirty,
    isSaving,
    canSave: isDirty && !isSaving,
    save,
    reset,
    resetToDefaults
  };
}