import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Neomorphic Container Component
interface NeumorphicContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'raised' | 'inset' | 'flat';
  intensity?: 'subtle' | 'medium' | 'strong';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'light' | 'medium' | 'dark';
}

const NeumorphicContainer: React.FC<NeumorphicContainerProps> = ({
  children,
  className = '',
  variant = 'raised',
  intensity = 'medium',
  rounded = 'lg',
  padding = 'md',
  background = 'medium',
}) => {
  // Background colors
  const backgrounds = {
    light: 'bg-gray-100',
    medium: 'bg-gray-200',
    dark: 'bg-gray-300',
  };

  // Shadow intensities and variants
  const getShadowClasses = () => {
    const intensityMap = {
      subtle: { light: '4px', dark: '8px', blur: '8px' },
      medium: { light: '6px', dark: '12px', blur: '12px' },
      strong: { light: '8px', dark: '16px', blur: '16px' },
    };

    const { light, dark, blur } = intensityMap[intensity];

    switch (variant) {
      case 'raised':
        return `shadow-[${light}_${light}_${blur}_rgba(255,255,255,0.8),-${dark}_-${dark}_${blur}_rgba(0,0,0,0.15)]`;
      case 'inset':
        return `shadow-[inset_${light}_${light}_${blur}_rgba(0,0,0,0.15),inset_-${dark}_-${dark}_${blur}_rgba(255,255,255,0.8)]`;
      case 'flat':
        return `shadow-[${light}_${light}_${blur}_rgba(255,255,255,0.6),-${dark}_-${dark}_${blur}_rgba(0,0,0,0.1)]`;
      default:
        return '';
    }
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Border radius
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`
        ${backgrounds[background]}
        ${getShadowClasses()}
        ${roundedClasses[rounded]}
        ${paddingClasses[padding]}
        transition-all duration-300
        ${className}
      `}
      style={{
        boxShadow: variant === 'raised' 
          ? `${intensity === 'subtle' ? '4px 4px 8px' : intensity === 'medium' ? '6px 6px 12px' : '8px 8px 16px'} rgba(0,0,0,0.15), ${intensity === 'subtle' ? '-4px -4px 8px' : intensity === 'medium' ? '-6px -6px 12px' : '-8px -8px 16px'} rgba(255,255,255,0.8)`
          : variant === 'inset'
          ? `inset ${intensity === 'subtle' ? '4px 4px 8px' : intensity === 'medium' ? '6px 6px 12px' : '8px 8px 16px'} rgba(0,0,0,0.15), inset ${intensity === 'subtle' ? '-4px -4px 8px' : intensity === 'medium' ? '-6px -6px 12px' : '-8px -8px 16px'} rgba(255,255,255,0.8)`
          : `${intensity === 'subtle' ? '2px 2px 6px' : intensity === 'medium' ? '4px 4px 8px' : '6px 6px 12px'} rgba(0,0,0,0.1), ${intensity === 'subtle' ? '-2px -2px 6px' : intensity === 'medium' ? '-4px -4px 8px' : '-6px -6px 12px'} rgba(255,255,255,0.6)`
      }}
    >
      {children}
    </div>
  );
};

// Neomorphic Button Component
interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rectangle' | 'circle' | 'pill';
  pressed?: boolean;
}

const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rectangle',
  pressed = false,
  className = '',
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(pressed);

  // Variant colors
  const variants = {
    primary: 'bg-brand-primary-200 text-brand-primary-800',
    secondary: 'bg-gray-200 text-gray-800',
    accent: 'bg-brand-accent-200 text-brand-accent-800',
  };

  // Size classes
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Shape classes
  const shapes = {
    rectangle: 'rounded-lg',
    circle: 'rounded-full aspect-square',
    pill: 'rounded-full',
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
  };

  // Create motion-compatible props
  const motionProps = {
    className: `
      ${variants[variant]}
      ${sizes[size]}
      ${shapes[shape]}
      font-medium transition-all duration-150 relative overflow-hidden
      focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50
      ${className}
    `,
    style: {
      boxShadow: isPressed
        ? 'inset 4px 4px 8px rgba(0,0,0,0.15), inset -4px -4px 8px rgba(255,255,255,0.8)'
        : '6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.8)',
    },
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 },
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
      {children}
    </motion.button>
  );
};

// Neomorphic Card Component
interface NeumorphicCardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  header,
  footer,
  className = '',
  hover = false,
  clickable = false,
  onClick,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => clickable && setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <motion.div
      className={`
        bg-gray-200 rounded-xl transition-all duration-300 cursor-${clickable ? 'pointer' : 'default'}
        ${hover ? 'hover:bg-gray-150' : ''}
        ${className}
      `}
      style={{
        boxShadow: isPressed
          ? 'inset 6px 6px 12px rgba(0,0,0,0.15), inset -6px -6px 12px rgba(255,255,255,0.8)'
          : '8px 8px 16px rgba(0,0,0,0.15), -8px -8px 16px rgba(255,255,255,0.8)',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        {header && (
          <div className="mb-4">
            {header}
          </div>
        )}
        
        <div className="flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="mt-4">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Neomorphic Input Component
interface NeumorphicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const NeumorphicInput: React.FC<NeumorphicInputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full bg-gray-200 border-none rounded-lg text-gray-800 placeholder-gray-500
            transition-all duration-300 focus:outline-none
            ${icon ? 'pl-10 pr-4 py-3' : 'px-4 py-3'}
            ${error ? 'text-red-600' : ''}
            ${className}
          `}
          style={{
            boxShadow: isFocused
              ? 'inset 4px 4px 8px rgba(0,0,0,0.15), inset -4px -4px 8px rgba(255,255,255,0.8)'
              : '2px 2px 6px rgba(0,0,0,0.1), -2px -2px 6px rgba(255,255,255,0.6)',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

// Neomorphic Toggle Switch
interface NeumorphicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const NeumorphicToggle: React.FC<NeumorphicToggleProps> = ({
  checked,
  onChange,
  label,
  size = 'md',
}) => {
  const sizes = {
    sm: { container: 'w-10 h-6', thumb: 'w-4 h-4' },
    md: { container: 'w-12 h-7', thumb: 'w-5 h-5' },
    lg: { container: 'w-14 h-8', thumb: 'w-6 h-6' },
  };

  return (
    <div className="flex items-center gap-3">
      <button
        className={`
          ${sizes[size].container} bg-gray-200 rounded-full relative transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50
        `}
        style={{
          boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.15), inset -4px -4px 8px rgba(255,255,255,0.8)',
        }}
        onClick={() => onChange(!checked)}
      >
        <motion.div
          className={`
            ${sizes[size].thumb} bg-gray-200 rounded-full absolute top-1/2 transform -translate-y-1/2
            ${checked ? 'bg-brand-primary-400' : ''}
          `}
          style={{
            boxShadow: '3px 3px 6px rgba(0,0,0,0.15), -3px -3px 6px rgba(255,255,255,0.8)',
          }}
          animate={{
            x: checked ? `calc(100% + 4px)` : '4px',
          }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </button>
      
      {label && (
        <span className="text-gray-700 font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

// Neomorphic Progress Bar
interface NeumorphicProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'success';
}

const NeumorphicProgress: React.FC<NeumorphicProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    primary: 'bg-brand-primary-400',
    accent: 'bg-brand-accent-400',
    success: 'bg-green-400',
  };

  return (
    <div
      className={`w-full bg-gray-200 rounded-full ${sizes[size]} relative overflow-hidden`}
      style={{
        boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.15), inset -3px -3px 6px rgba(255,255,255,0.8)',
      }}
    >
      <motion.div
        className={`h-full ${colors[color]} rounded-full`}
        style={{
          boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -1px -1px 2px rgba(255,255,255,0.6)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
};

export {
  NeumorphicContainer,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicInput,
  NeumorphicToggle,
  NeumorphicProgress,
};

export default NeumorphicContainer;
