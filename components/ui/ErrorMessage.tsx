'use client';

import { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  children?: ReactNode;
  message?: string;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const ErrorMessage = ({
  children,
  message,
  className = '',
  variant = 'error',
  dismissible = false,
  onDismiss,
}: ErrorMessageProps): ReactElement => {
  const variantClasses = {
    error: 'bg-red-900/20 border-red-500/50 text-red-300',
    warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300',
    info: 'bg-blue-900/20 border-blue-500/50 text-blue-300',
  };

  const iconClasses = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  const content = children || message;
  
  if (!content) return <></>;

  return (
    <div className={cn(
      'flex items-start space-x-3 p-4 rounded-lg border',
      variantClasses[variant],
      className
    )}>
      <AlertCircle className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconClasses[variant])} />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          {content}
        </div>
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors',
            iconClasses[variant]
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;