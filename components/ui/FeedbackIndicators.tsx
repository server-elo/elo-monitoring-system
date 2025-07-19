'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppError } from '@/lib/errors/types';
import { EnhancedButton } from './EnhancedButton';

export interface FeedbackIndicatorProps {
  type: 'success' | 'error' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline' | 'ghost' | 'minimal';
  animate?: boolean;
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  xs: 'text-xs p-1',
  sm: 'text-sm p-2',
  md: 'text-base p-3',
  lg: 'text-lg p-4',
  xl: 'text-xl p-6'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

const typeConfig = {
  success: {
    icon: CheckCircle,
    colors: {
      solid: 'bg-green-600 text-white border-green-600',
      outline: 'bg-transparent text-green-600 border-green-600',
      ghost: 'bg-green-50 text-green-600 border-transparent',
      minimal: 'bg-transparent text-green-600 border-transparent'
    }
  },
  error: {
    icon: XCircle,
    colors: {
      solid: 'bg-red-600 text-white border-red-600',
      outline: 'bg-transparent text-red-600 border-red-600',
      ghost: 'bg-red-50 text-red-600 border-transparent',
      minimal: 'bg-transparent text-red-600 border-transparent'
    }
  },
  warning: {
    icon: AlertTriangle,
    colors: {
      solid: 'bg-yellow-600 text-white border-yellow-600',
      outline: 'bg-transparent text-yellow-600 border-yellow-600',
      ghost: 'bg-yellow-50 text-yellow-600 border-transparent',
      minimal: 'bg-transparent text-yellow-600 border-transparent'
    }
  },
  info: {
    icon: Info,
    colors: {
      solid: 'bg-blue-600 text-white border-blue-600',
      outline: 'bg-transparent text-blue-600 border-blue-600',
      ghost: 'bg-blue-50 text-blue-600 border-transparent',
      minimal: 'bg-transparent text-blue-600 border-transparent'
    }
  }
};

export function FeedbackIndicator({
  type,
  size = 'md',
  variant = 'solid',
  animate = true,
  showIcon = true,
  className,
  children
}: FeedbackIndicatorProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  const colorClass = config.colors[variant];

  const content = (
    <div className={cn(
      'flex items-center space-x-2 rounded-lg border transition-all duration-300',
      sizeClass,
      colorClass,
      className
    )}>
      {showIcon && (
        <Icon className={cn(iconSize, 'flex-shrink-0')} />
      )}
      {children && (
        <span className="font-medium">{children}</span>
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}

// Success indicator with celebration animation
export function SuccessIndicator({ 
  children = 'Success!', 
  showParticles = true,
  ...props 
}: Omit<FeedbackIndicatorProps, 'type'> & { 
  showParticles?: boolean;
}) {
  return (
    <div className="relative">
      <FeedbackIndicator type="success" {...props}>
        {children}
      </FeedbackIndicator>
      
      {/* Celebration particles */}
      <AnimatePresence>
        {showParticles && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 6) * 30,
                  y: Math.sin((i * Math.PI * 2) / 6) * 30,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full pointer-events-none"
                style={{ transform: 'translate(-50%, -50%)' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Error indicator with shake animation
export function ErrorIndicator({ 
  children = 'Error occurred', 
  shake = true,
  ...props 
}: Omit<FeedbackIndicatorProps, 'type'> & { 
  shake?: boolean;
}) {
  return (
    <motion.div
      animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      <FeedbackIndicator type="error" {...props}>
        {children}
      </FeedbackIndicator>
    </motion.div>
  );
}

// Inline feedback for form fields
export function InlineFeedback({
  type,
  message,
  show = true
}: {
  type: 'success' | 'error' | 'warning';
  message: string;
  show?: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <FeedbackIndicator
            type={type}
            size="sm"
            variant="minimal"
            className="mt-1"
          >
            {message}
          </FeedbackIndicator>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast-style notification
export function ToastNotification({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}: {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <FeedbackIndicator
            type={type}
            size="sm"
            variant="minimal"
            showIcon={true}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-white mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm text-gray-300">
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Progress indicator with feedback
export function ProgressFeedback({
  progress,
  status,
  message
}: {
  progress: number;
  status: 'loading' | 'success' | 'error';
  message?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          {message || 'Processing...'}
        </span>
        <span className="text-sm text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div
          className={cn(
            'h-2 rounded-full transition-colors duration-300',
            {
              'bg-blue-500': status === 'loading',
              'bg-green-500': status === 'success',
              'bg-red-500': status === 'error'
            }
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {status !== 'loading' && (
        <FeedbackIndicator
          type={status === 'success' ? 'success' : 'error'}
          size="sm"
          variant="minimal"
        >
          {status === 'success' ? 'Completed successfully' : 'Process failed'}
        </FeedbackIndicator>
      )}
    </div>
  );
}

// Enhanced error feedback with glassmorphism design
export function GlassErrorFeedback({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  className
}: {
  error: AppError;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}) {
  const severityColors = {
    critical: 'from-red-500/20 to-red-600/20 border-red-400/30',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-400/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative p-4 rounded-xl backdrop-blur-md border',
        'bg-gradient-to-br',
        severityColors[error.severity],
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 rounded-xl pointer-events-none" />

      <div className="relative z-10 flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {error.severity === 'critical' && <XCircle className="w-5 h-5 text-red-400" />}
          {error.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
          {error.severity === 'info' && <Info className="w-5 h-5 text-blue-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white mb-1">
            {error.category === 'api' ? 'Connection Error' :
             error.category === 'form' ? 'Validation Error' :
             error.category === 'auth' ? 'Authentication Error' :
             error.category === 'upload' ? 'Upload Error' :
             'Error'}
          </h4>

          <p className="text-sm text-gray-200 mb-3">
            {error.userMessage}
          </p>

          {(showRetry && error.retryable && onRetry) || onDismiss ? (
            <div className="flex flex-wrap gap-2">
              {showRetry && error.retryable && onRetry && (
                <EnhancedButton
                  onClick={onRetry}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  touchTarget
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </EnhancedButton>
              )}

              {onDismiss && (
                <EnhancedButton
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  touchTarget
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </EnhancedButton>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// Neumorphism error feedback
export function NeumorphismErrorFeedback({
  error,
  onRetry,
  onDismiss,
  colorScheme = 'light',
  className
}: {
  error: AppError;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  colorScheme?: 'light' | 'dark';
  className?: string;
}) {
  const isLight = colorScheme === 'light';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-4 rounded-xl border-none transition-all duration-300',
        isLight
          ? 'bg-gray-100 shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] text-gray-800'
          : 'bg-gray-800 shadow-[inset_8px_8px_16px_#1a1a1a,inset_-8px_-8px_16px_#2a2a2a] text-gray-200',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {error.severity === 'critical' && (
            <XCircle className={cn('w-5 h-5', isLight ? 'text-red-600' : 'text-red-400')} />
          )}
          {error.severity === 'warning' && (
            <AlertTriangle className={cn('w-5 h-5', isLight ? 'text-yellow-600' : 'text-yellow-400')} />
          )}
          {error.severity === 'info' && (
            <Info className={cn('w-5 h-5', isLight ? 'text-blue-600' : 'text-blue-400')} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={cn('font-medium mb-1', isLight ? 'text-gray-800' : 'text-gray-200')}>
            Error Occurred
          </h4>

          <p className={cn('text-sm mb-3', isLight ? 'text-gray-600' : 'text-gray-400')}>
            {error.userMessage}
          </p>

          {(error.retryable && onRetry) || onDismiss ? (
            <div className="flex flex-wrap gap-2">
              {error.retryable && onRetry && (
                <EnhancedButton
                  onClick={onRetry}
                  size="sm"
                  className={cn(
                    'border-none font-medium transition-all duration-300',
                    isLight
                      ? 'bg-gray-100 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] text-gray-700'
                      : 'bg-gray-800 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#2a2a2a] hover:shadow-[2px_2px_4px_#1a1a1a,-2px_-2px_4px_#2a2a2a] text-gray-300'
                  )}
                  touchTarget
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </EnhancedButton>
              )}

              {onDismiss && (
                <EnhancedButton
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    isLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-500 hover:text-gray-300'
                  )}
                  touchTarget
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </EnhancedButton>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
