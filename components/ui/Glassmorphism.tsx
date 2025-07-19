import React from 'react';
import { motion } from 'framer-motion';

// Glass Container Component
interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  tint?: 'neutral' | 'primary' | 'accent' | 'warm' | 'cool';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  onClick?: () => void;
}

const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className = '',
  intensity = 'medium',
  tint = 'neutral',
  border = true,
  shadow = 'md',
  rounded = 'lg',
  animated = true,
  onClick,
}) => {
  // Backdrop blur intensities
  const blurIntensities = {
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-lg',
  };

  // Glass tints
  const tints = {
    neutral: 'bg-white/10 border-white/20',
    primary: 'bg-brand-primary-500/10 border-brand-primary-400/20',
    accent: 'bg-brand-accent-500/10 border-brand-accent-400/20',
    warm: 'bg-orange-500/10 border-orange-400/20',
    cool: 'bg-blue-500/10 border-blue-400/20',
  };

  // Shadow variants
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg shadow-black/10',
    lg: 'shadow-xl shadow-black/15',
    xl: 'shadow-2xl shadow-black/20',
  };

  // Border radius
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const glassClasses = `
    ${blurIntensities[intensity]}
    ${tints[tint]}
    ${border ? 'border' : ''}
    ${shadows[shadow]}
    ${roundedClasses[rounded]}
    relative overflow-hidden
    ${className}
  `.trim();

  const Component = animated ? motion.div : 'div';
  const motionProps = animated ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  } : {};

  return (
    <Component className={glassClasses} onClick={onClick} {...motionProps}>
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

// Glass Card Component
interface GlassCardProps extends GlassContainerProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  hover = true,
  onClick,
  className = '',
  ...glassProps
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover ? 'hover:bg-white/15 hover:border-white/30 transition-all duration-300' : '';

  return (
    <GlassContainer
      className={`${paddingClasses[padding]} ${hoverClasses} ${className}`}
      {...glassProps}
    >
      {header && (
        <div className="border-b border-white/10 pb-4 mb-4">
          {header}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-white/10 pt-4 mt-4">
          {footer}
        </div>
      )}
    </GlassContainer>
  );
};

// Glass Modal Component
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      
      {/* Modal */}
      <GlassContainer
        className={`w-full ${sizeClasses[size]} relative z-10`}
        intensity="heavy"
        tint="neutral"
        shadow="xl"
        rounded="xl"
      >
        <div className="p-6">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="text-white/90">
            {children}
          </div>
        </div>
      </GlassContainer>
    </motion.div>
  );
};

// Glass Navigation Component
interface GlassNavProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const GlassNav: React.FC<GlassNavProps> = ({
  children,
  position = 'top',
  className = '',
}) => {
  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'top-0 left-0 bottom-0',
    right: 'top-0 right-0 bottom-0',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <GlassContainer
        className={`${position === 'top' || position === 'bottom' ? 'w-full' : 'h-full'} ${className}`}
        intensity="medium"
        tint="neutral"
        border={false}
        shadow="lg"
        rounded="none"
      >
        {children}
      </GlassContainer>
    </div>
  );
};

// Glass Button Component
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-brand-primary-500/20 border-brand-primary-400/30 text-brand-primary-100 hover:bg-brand-primary-500/30',
    secondary: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    accent: 'bg-brand-accent-500/20 border-brand-accent-400/30 text-brand-accent-100 hover:bg-brand-accent-500/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const glowClass = glow ? 'hover:shadow-glow' : '';

  // Create motion-compatible props
  const motionProps = {
    className: `
      backdrop-blur-md border rounded-lg font-medium
      transition-all duration-300 relative overflow-hidden
      ${variants[variant]}
      ${sizes[size]}
      ${glowClass}
      ${className}
    `,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 },
    onClick: props.onClick,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    onKeyDown: props.onKeyDown,
    type: props.type,
    disabled: props.disabled,
    id: props.id,
    'data-testid': (props as any)['data-testid']
  };

  return (
    <motion.button {...motionProps}>
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </motion.button>
  );
};

// Glass Input Component
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          className={`
            w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20
            rounded-lg text-white placeholder-white/50
            focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50 focus:border-brand-primary-400/50
            transition-all duration-300
            ${error ? 'border-red-400/50 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
        
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 rounded-lg pointer-events-none" />
      </div>
      
      {error && (
        <p className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
};

export {
  GlassContainer,
  GlassCard,
  GlassModal,
  GlassNav,
  GlassButton,
  GlassInput,
};

export default GlassContainer;
