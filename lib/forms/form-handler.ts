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
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: (result?: any) => void;
  onError?: (error: Error) => void;
}

export function useForm<T extends Record<string, any>>(config: FormConfig<T>) {
  const [formState, setFormState] = useState<FormState>({
    fields: Object.keys(config.initialValues).reduce((acc, key) => {
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

  const validateField = useCallback((name: string, value: any) => {
    if (!config.validationSchema) return null;

    try {
      const fieldSchema = (config.validationSchema as any).shape?.[name];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [config.validationSchema]);

  const validateForm = useCallback((values: T) => {
    if (!config.validationSchema) return { isValid: true, errors: {} };

    try {
      config.validationSchema.parse(values);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }, [config.validationSchema]);

  const setValue = useCallback((name: string, value: any) => {
    setFormState(prev => {
      const error = validateField(name, value);
      const newFields = {
        ...prev.fields,
        [name]: {
          ...prev.fields[name],
          value,
          error: error || undefined,
          touched: true,
        },
      };

      const values = Object.keys(newFields).reduce((acc, key) => {
        (acc as any)[key] = newFields[key].value;
        return acc;
      }, {} as T);

      const validation = validateForm(values);

      return {
        ...prev,
        fields: newFields,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
  }, [validateField, validateForm]);

  const setFieldTouched = useCallback((name: string, touched = true) => {
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
      fields: Object.keys(config.initialValues).reduce((acc, key) => {
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

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    setFormState(prev => ({
      ...prev,
      fields: Object.keys(prev.fields).reduce((acc, key) => {
        acc[key] = { ...prev.fields[key], touched: true };
        return acc;
      }, {} as Record<string, FormField>),
    }));

    const values = Object.keys(formState.fields).reduce((acc, key) => {
      (acc as any)[key] = formState.fields[key].value;
      return acc;
    }, {} as T);

    const validation = validateForm(values);

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

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await config.onSubmit(values);
      
      toast({
        title: 'Success',
        description: 'Form submitted successfully!',
      });

      if (config.onSuccess) {
        config.onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      if (config.onError) {
        config.onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.fields, validateForm, config]);

  const getFieldProps = useCallback((name: string) => {
    const field = formState.fields[name];
    return {
      name,
      value: field?.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(name, e.target.value);
      },
      onBlur: () => setFieldTouched(name, true),
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
      onValueChange: (value: string) => setValue(name, value),
      error: field?.touched ? field?.error : undefined,
    };
  }, [formState.fields, setValue]);

  const getCheckboxProps = useCallback((name: string) => {
    const field = formState.fields[name];
    return {
      name,
      checked: Boolean(field?.value),
      onCheckedChange: (checked: boolean) => setValue(name, checked),
      error: field?.touched ? field?.error : undefined,
    };
  }, [formState.fields, setValue]);

  const values = Object.keys(formState.fields).reduce((acc, key) => {
    (acc as any)[key] = formState.fields[key].value;
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
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
  }),

  profile: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    bio: z.string().max(500, 'Bio is too long').optional(),
    location: z.string().max(100, 'Location is too long').optional(),
    github: z.string().max(50, 'GitHub username is too long').optional(),
    twitter: z.string().max(50, 'Twitter username is too long').optional(),
    linkedin: z.string().max(50, 'LinkedIn username is too long').optional(),
  }),

  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    achievementNotifications: z.boolean(),
  }),

  feedback: z.object({
    type: z.enum(['rating', 'survey', 'bug_report', 'feature_request', 'usability']),
    category: z.string().min(1, 'Category is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
    rating: z.number().min(1).max(5).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    email: z.string().email('Invalid email address').optional(),
    allowFollowUp: z.boolean().optional(),
  }),
};

// API submission helpers
export const submitForm = async (endpoint: string, data: any) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const updateForm = async (endpoint: string, data: any) => {
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};
