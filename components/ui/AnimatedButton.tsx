import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  ripple = true,
  glow = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border-transparent',
    destructive: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    glass: 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/20'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const glowClass = glow ? {
    primary: 'shadow-lg shadow-blue-500/25',
    secondary: 'shadow-lg shadow-gray-500/25',
    ghost: '',
    destructive: 'shadow-lg shadow-red-500/25',
    glass: 'shadow-lg shadow-white/25'
  }[variant] : '';

  const isDisabled = disabled || loading;

  // Create motion-compatible props
  const motionProps = {
    className: cn(
      'relative overflow-hidden rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      glowClass,
      className
    ),
    whileHover: !isDisabled ? { scale: 1.02 } : {},
    whileTap: !isDisabled ? { scale: 0.98 } : {},
    disabled: isDisabled,
    onClick: props.onClick,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    onKeyDown: props.onKeyDown,
    type: props.type,
    id: props.id,
    'data-testid': (props as any)['data-testid']
  };

  return (
    <motion.button {...motionProps}>
      {ripple && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-lg"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      <div className="relative flex items-center justify-center space-x-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        <span>{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>
    </motion.button>
  );
};

export default AnimatedButton;
