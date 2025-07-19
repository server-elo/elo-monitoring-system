'use client';

import React, { useId, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Accessible Form Field Component
interface AccessibleFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
  maxLength?: number;
  pattern?: string;
  'aria-describedby'?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  autoComplete,
  description,
  icon: Icon,
  className = '',
  inputClassName = '',
  showPasswordToggle = false,
  maxLength,
  pattern,
  'aria-describedby': ariaDescribedBy,
}) => {
  const fieldId = useId();
  const errorId = useId();
  const descriptionId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const describedByIds = [
    description ? descriptionId : null,
    error ? errorId : null,
    ariaDescribedBy,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-300"
      >
        {label}
        {required && (
          <span 
            className="text-red-400 ml-1" 
            aria-label="required"
            role="img"
          >
            *
          </span>
        )}
      </label>

      {/* Description */}
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-gray-400"
        >
          {description}
        </p>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <Icon 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            aria-hidden="true" 
          />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          id={fieldId}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          aria-describedby={describedByIds || undefined}
          aria-invalid={!!error}
          className={cn(
            'w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            Icon ? 'pl-10' : '',
            showPasswordToggle ? 'pr-12' : '',
            error ? 'border-red-400 focus:ring-red-500' : '',
            inputClassName
          )}
        />

        {/* Password Toggle */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={errorId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-red-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Accessible Form Component
interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
  description?: string;
  className?: string;
  noValidate?: boolean;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  title,
  description,
  className = '',
  noValidate = true,
}) => {
  const formId = useId();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate={noValidate}
      className={cn('space-y-6', className)}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {title && (
        <h2 id={titleId} className="text-2xl font-bold text-white">
          {title}
        </h2>
      )}
      
      {description && (
        <p id={descriptionId} className="text-gray-300">
          {description}
        </p>
      )}
      
      {children}
    </form>
  );
};

// Form Success Message Component
interface FormSuccessProps {
  message: string;
  className?: string;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({
  message,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'flex items-center gap-2 p-4 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400',
      className
    )}
    role="alert"
    aria-live="polite"
  >
    <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </motion.div>
);

// Form Error Summary Component
interface FormErrorSummaryProps {
  errors: Array<{ field: string; message: string }>;
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  className = '',
}) => {
  if (errors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 bg-red-600/20 border border-red-600/30 rounded-lg',
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-summary-title"
    >
      <h3 id="error-summary-title" className="text-red-400 font-medium mb-2">
        Please correct the following errors:
      </h3>
      <ul className="space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-red-300">
            <strong>{error.field}:</strong> {error.message}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// Accessible Submit Button
interface AccessibleSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const AccessibleSubmitButton: React.FC<AccessibleSubmitButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  loadingText = 'Loading...',
  className = '',
  variant = 'primary',
}) => {
  const baseClasses = 'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      aria-describedby={loading ? 'submit-status' : undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <span className="sr-only" id="submit-status">
            {loadingText}
          </span>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AccessibleField;
