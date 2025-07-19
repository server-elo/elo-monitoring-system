'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw, Search, Wifi, WifiOff, Shield, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppError } from '@/lib/errors/types';
import { EnhancedButton } from './EnhancedButton';
import { Card } from './card';

export interface ErrorMessageProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void | Promise<void>;
  onAction?: (actionIndex: number) => void | Promise<void>;
  className?: string;
  showIcon?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800/30',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800/30',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800/30',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400'
  }
};

const categoryIcons = {
  api: AlertCircle,
  form: AlertTriangle,
  navigation: Search,
  auth: Shield,
  upload: Upload,
  network: Wifi,
  validation: AlertTriangle,
  system: AlertCircle
};

export function ErrorMessage({
  error,
  onDismiss,
  onRetry,
  onAction,
  className,
  showIcon = true,
  showActions = true,
  compact = false
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const config = severityConfig[error.severity];
  // Category icon would be used for additional visual context
  // const CategoryIcon = categoryIcons[error.category];
  const SeverityIcon = config.icon;

  // Auto-hide functionality
  useEffect(() => {
    if (error.autoHide && error.hideAfter) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, error.hideAfter);

      return () => clearTimeout(timer);
    }
  }, [error.autoHide, error.hideAfter]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAction = async (actionIndex: number) => {
    if (!onAction) return;
    
    try {
      await onAction(actionIndex);
    } catch (actionError) {
      console.error('Action failed:', actionError);
    }
  };

  if (!isVisible) return null;

  const content = (
    <div
      className={cn(
        'relative border rounded-lg transition-all duration-300',
        config.bgColor,
        config.borderColor,
        compact ? 'p-3' : 'p-4',
        className
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={cn(
            'absolute top-2 right-2 p-1 rounded-full transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            config.textColor
          )}
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start space-x-3">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {error.category === 'network' && error.metadata?.isOffline ? (
              <WifiOff className={cn('w-5 h-5', config.iconColor)} />
            ) : (
              <SeverityIcon className={cn('w-5 h-5', config.iconColor)} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Error message */}
          <div className={cn('font-medium', config.textColor, compact ? 'text-sm' : 'text-base')}>
            {error.userMessage}
          </div>

          {/* Technical details (development mode) */}
          {process.env.NODE_ENV === 'development' && error.technicalMessage && (
            <details className="mt-2">
              <summary className={cn('text-xs cursor-pointer', config.textColor, 'opacity-70')}>
                Technical Details
              </summary>
              <pre className={cn('text-xs mt-1 p-2 bg-black/5 dark:bg-white/5 rounded', config.textColor)}>
                {error.technicalMessage}
              </pre>
            </details>
          )}

          {/* Error metadata */}
          {!compact && error.metadata && Object.keys(error.metadata).length > 0 && (
            <div className="mt-2 text-xs opacity-70">
              <div className={config.textColor}>
                Error ID: {error.id} • {error.timestamp.toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (error.actions?.length || error.retryable) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Retry button */}
              {error.retryable && onRetry && (
                <EnhancedButton
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className={cn(
                    'border-current text-current hover:bg-current/10',
                    config.textColor
                  )}
                  loading={isRetrying}
                  loadingText="Retrying..."
                  disabled={isRetrying}
                  touchTarget
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </EnhancedButton>
              )}

              {/* Custom actions */}
              {error.actions?.map((action, index) => (
                <EnhancedButton
                  key={index}
                  onClick={() => handleAction(index)}
                  size="sm"
                  variant={action.variant === 'primary' ? 'default' : 'outline'}
                  className={cn(
                    action.variant === 'primary' 
                      ? 'bg-current text-white hover:bg-current/90' 
                      : 'border-current text-current hover:bg-current/10',
                    config.textColor
                  )}
                  loading={action.loading}
                  touchTarget
                >
                  {action.label}
                </EnhancedButton>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap with motion for animations
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast notification wrapper
export function ErrorToast({
  error,
  onDismiss,
  onRetry,
  onAction,
  position = 'top-right'
}: ErrorMessageProps & {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}) {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  return (
    <div className={cn(positionClasses[position], 'max-w-md')}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <ErrorMessage
          error={error}
          onDismiss={onDismiss}
          onRetry={onRetry}
          onAction={onAction}
          className="border-0 bg-transparent"
        />
      </Card>
    </div>
  );
}

// Inline form error
export function InlineFormError({
  error,
  className
}: {
  error: AppError;
  className?: string;
}) {
  if (error.category !== 'form') return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('overflow-hidden', className)}
    >
      <ErrorMessage
        error={error}
        compact
        showActions={false}
        className="mt-1 text-sm"
      />
    </motion.div>
  );
}

// Banner error for network/system issues
export function ErrorBanner({
  error,
  onDismiss,
  onRetry,
  onAction
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <ErrorMessage
        error={error}
        onDismiss={onDismiss}
        onRetry={onRetry}
        onAction={onAction}
        className="rounded-none border-x-0 border-t-0"
      />
    </motion.div>
  );
}

// Page-level error display
export function ErrorPage({
  error,
  onRetry,
  onAction,
  showBackButton = true
}: ErrorMessageProps & {
  showBackButton?: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full">
        <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {error.category === 'navigation' && error.statusCode === 404 ? 'Page Not Found' :
               error.category === 'navigation' && error.statusCode === 403 ? 'Access Forbidden' :
               error.category === 'navigation' && error.statusCode === 500 ? 'Server Error' :
               'Something Went Wrong'}
            </h1>
          </div>

          <ErrorMessage
            error={error}
            onRetry={onRetry}
            onAction={onAction}
            className="border-0 bg-transparent text-left"
          />

          {showBackButton && (
            <div className="mt-6">
              <EnhancedButton
                onClick={() => window.history.back()}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                touchTarget
              >
                Go Back
              </EnhancedButton>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
