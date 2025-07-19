'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
}

export interface FormState {
  fields: Record<string, FormField>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormConfig<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit: (_values: T) => Promise<void>;
  onSuccess?: (_result?: any) => void;
  onError?: (_error: Error) => void;
}

export function useForm<T extends Record<string, any>>(_config: FormConfig<T>) {
  const [formState, setFormState] = useState<FormState>({
    fields: Object.keys(_config.initialValues).reduce( (acc, key) => {
      acc[key] = {
        name: key,
        value: config.initialValues[key],
        touched: false,
      };
      return acc;
    }, {} as Record<string, FormField>),
    isSubmitting: false,
    isValid: true,
    errors: {},
  });

  const validateField = useCallback( (name: string, value: any) => {
    if (!config.validationSchema) return null;

    try {
      const fieldSchema = (_config.validationSchema as any).shape?.[name];
      if (fieldSchema) {
        fieldSchema.parse(_value);
      }
      return null;
    } catch (_error) {
      if (_error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [config.validationSchema]);

  const validateForm = useCallback((values: T) => {
    if (!config.validationSchema) return { isValid: true, errors: {} };

    try {
      config.validationSchema.parse(_values);
      return { isValid: true, errors: {} };
    } catch (_error) {
      if (_error instanceof z.ZodError) {
        const errors = error.errors.reduce( (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }, [config.validationSchema]);

  const setValue = useCallback( (name: string, value: any) => {
    setFormState(prev => {
      const error = validateField( name, value);
      const newFields = {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          value,
          error: error || undefined,
          touched: true,
        },
      };

      const values = Object.keys(_newFields).reduce( (acc, key) => {
        (_acc as any)[key] = newFields[key].value;
        return acc;
      }, {} as T);

      const validation = validateForm(_values);

      return {
        ...prev,
        fields: newFields,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
  }, [validateField, validateForm]);

  const setFieldTouched = useCallback( (name: string, touched = true) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          touched,
        },
      },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      fields: Object.keys(_config.initialValues).reduce( (acc, key) => {
        acc[key] = {
          name: key,
          value: config.initialValues[key],
          touched: false,
        };
        return acc;
      }, {} as Record<string, FormField>),
      isSubmitting: false,
      isValid: true,
      errors: {},
    });
  }, [config.initialValues]);

  const handleSubmit = useCallback( async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault(_);
    }

    // Mark all fields as touched
    setFormState(prev => ({
      ...prev,
      fields: Object.keys(_prev.fields).reduce( (acc, key) => {
        acc[key] = { ...prev.fields[key], touched: true };
        return acc;
      }, {} as Record<string, FormField>),
    }));

    const values = Object.keys(_formState.fields).reduce( (acc, key) => {
      (_acc as any)[key] = formState.fields[key].value;
      return acc;
    }, {} as T);

    const validation = validateForm(_values);

    if (!validation.isValid) {
      setFormState(prev => ({
        ...prev,
        isValid: false,
        errors: validation.errors,
      }));
      
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setFormState( prev => ({ ...prev, isSubmitting: true }));

    try {
      await config.onSubmit(_values);
      
      toast({
        title: 'Success',
        description: 'Form submitted successfully!',
      });

      if (_config.onSuccess) {
        config.onSuccess(_);
      }
    } catch (_error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      if (_config.onError) {
        config.onError(_error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setFormState( prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.fields, validateForm, config]);

  const getFieldProps = useCallback((name: string) => {
    const field = formState.fields[name];
    return {
      name,
      value: field?.value || '',
      onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue( name, e.target.value);
      },
      onBlur: (_) => setFieldTouched( name, true),
      error: field?.touched ? field?.error : undefined,
      'aria-invalid': field?.touched && field?.error ? true : false,
      'aria-describedby': field?.error ? `${name}-error` : undefined,
    };
  }, [formState.fields, setValue, setFieldTouched]);

  const getSelectProps = useCallback((name: string) => {
    const field = formState.fields[name];
    return {
      name,
      value: field?.value || '',
      onValueChange: (_value: string) => setValue( name, value),
      error: field?.touched ? field?.error : undefined,
    };
  }, [formState.fields, setValue]);

  const getCheckboxProps = useCallback((name: string) => {
    const field = formState.fields[name];
    return {
      name,
      checked: Boolean(_field?.value),
      onCheckedChange: (_checked: boolean) => setValue( name, checked),
      error: field?.touched ? field?.error : undefined,
    };
  }, [formState.fields, setValue]);

  const values = Object.keys(_formState.fields).reduce( (acc, key) => {
    (_acc as any)[key] = formState.fields[key].value;
    return acc;
  }, {} as T);

  return {
    values,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    setValue,
    setFieldTouched,
    resetForm,
    handleSubmit,
    getFieldProps,
    getSelectProps,
    getCheckboxProps,
    fields: formState.fields,
  };
}

// Form validation schemas
export const formSchemas = {
  contact: z.object({
    name: z.string(_).min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string(_).email('Invalid email address'),
    subject: z.string(_).min(1, 'Subject is required').max(200, 'Subject is too long'),
    message: z.string(_).min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
  }),

  profile: z.object({
    name: z.string(_).min(1, 'Name is required').max(100, 'Name is too long'),
    bio: z.string(_).max(500, 'Bio is too long').optional(_),
    location: z.string(_).max(100, 'Location is too long').optional(_),
    github: z.string(_).max(50, 'GitHub username is too long').optional(_),
    twitter: z.string(_).max(50, 'Twitter username is too long').optional(_),
    linkedin: z.string(_).max(50, 'LinkedIn username is too long').optional(_),
  }),

  settings: z.object({
    theme: z.enum( ['light', 'dark', 'system']),
    language: z.string(_),
    emailNotifications: z.boolean(_),
    pushNotifications: z.boolean(_),
    achievementNotifications: z.boolean(_),
  }),

  feedback: z.object({
    type: z.enum( ['rating', 'survey', 'bug_report', 'feature_request', 'usability']),
    category: z.string(_).min(1, 'Category is required'),
    title: z.string(_).min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string(_).min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
    rating: z.number(_).min(1).max(5).optional(_),
    severity: z.enum( ['low', 'medium', 'high', 'critical']).optional(_),
    email: z.string(_).email('Invalid email address').optional(_),
    allowFollowUp: z.boolean(_).optional(_),
  }),
};

// API submission helpers
export const submitForm = async (endpoint: string, data: any) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(_data),
  });

  if (!response.ok) {
    const error = await response.json(_).catch(() => ({ message: 'Network error'  }));
    throw new Error(_error.message || `HTTP ${response.status}`);
  }

  return response.json(_);
};

export const updateForm = async (endpoint: string, data: any) => {
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(_data),
  });

  if (!response.ok) {
    const error = await response.json(_).catch(() => ({ message: 'Network error'  }));
    throw new Error(_error.message || `HTTP ${response.status}`);
  }

  return response.json(_);
};
