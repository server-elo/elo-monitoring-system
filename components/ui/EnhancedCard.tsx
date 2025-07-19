import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'neumorphism' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'default',
  hover = true,
  glow = false,
  className,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20',
    neumorphism: 'bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#2a2a2a]',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
  };

  const hoverEffects = hover ? {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 }
  } : {};

  const glowClass = glow ? 'shadow-lg shadow-purple-500/25' : '';

  // Create motion-compatible props
  const motionProps = {
    className: cn(
      'rounded-lg p-6 transition-all duration-300',
      variants[variant],
      glowClass,
      className
    ),
    ...hoverEffects,
    onClick: props.onClick,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    onKeyDown: props.onKeyDown,
    id: props.id,
    'data-testid': (props as any)['data-testid']
  };

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
};

export default EnhancedCard;
