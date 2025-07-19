'use client';

;
import { motion } from 'framer-motion';
import { Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'spin' | 'wave' | 'bars' | 'ring';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white' | 'gray';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
  text?: string;
  textPosition?: 'bottom' | 'right' | 'left' | 'top';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-blue-500',
  secondary: 'text-purple-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  white: 'text-white',
  gray: 'text-gray-500'
};

const speedDurations = {
  slow: 2,
  normal: 1,
  fast: 0.5
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  color = 'primary',
  speed = 'normal',
  className,
  text,
  textPosition = 'bottom'
}: LoadingSpinnerProps) {
  const duration = speedDurations[speed];
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn('rounded-full bg-current', {
                  'w-1 h-1': size === 'xs',
                  'w-1.5 h-1.5': size === 'sm',
                  'w-2 h-2': size === 'md',
                  'w-3 h-3': size === 'lg',
                  'w-4 h-4': size === 'xl'
                }, colorClass)}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={cn('rounded-full bg-current', sizeClass, colorClass, className)}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );

      case 'bounce':
        return (
          <div className={cn('flex space-x-1', className)}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn('rounded-full bg-current', {
                  'w-1 h-1': size === 'xs',
                  'w-1.5 h-1.5': size === 'sm',
                  'w-2 h-2': size === 'md',
                  'w-3 h-3': size === 'lg',
                  'w-4 h-4': size === 'xl'
                }, colorClass)}
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <motion.div
            className={cn(
              'border-2 border-transparent rounded-full',
              sizeClass,
              className
            )}
            style={{
              borderTopColor: 'currentColor',
              borderRightColor: 'currentColor'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        );

      case 'spin':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'linear'
            }}
            className={cn(sizeClass, colorClass, className)}
          >
            <RotateCw className="w-full h-full" />
          </motion.div>
        );

      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'linear'
            }}
            className={cn(sizeClass, colorClass, className)}
          >
            <Loader2 className="w-full h-full" />
          </motion.div>
        );
    }
  };

  const spinner = renderSpinner();

  if (!text) {
    return spinner;
  }

  const textElement = (
    <span className={cn('text-sm font-medium', colorClass)}>
      {text}
    </span>
  );

  const containerClass = cn(
    'flex items-center',
    {
      'flex-col space-y-2': textPosition === 'bottom' || textPosition === 'top',
      'flex-row space-x-2': textPosition === 'right',
      'flex-row-reverse space-x-reverse space-x-2': textPosition === 'left'
    }
  );

  return (
    <div className={containerClass}>
      {textPosition === 'top' && textElement}
      {spinner}
      {(textPosition === 'bottom' || textPosition === 'right' || textPosition === 'left') && textElement}
    </div>
  );
}

// Preset loading components for common use cases
export function ButtonLoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'size' | 'variant'>) {
  return (
    <LoadingSpinner
      {...props}
      size="sm"
      variant="default"
      className={className}
    />
  );
}

export function PageLoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'size' | 'variant'>) {
  return (
    <LoadingSpinner
      {...props}
      size="lg"
      variant="ring"
      text="Loading..."
      textPosition="bottom"
      className={className}
    />
  );
}
