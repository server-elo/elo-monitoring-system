'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { motion } from 'framer-motion';

// Skip to Content Link
interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-brand-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
    >
      {children}
    </a>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  restoreFocus?: boolean;
}

const FocusTrap: React.FC<FocusTrapProps> = ({ 
  children, 
  active, 
  restoreFocus = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={active ? '' : 'pointer-events-none'}>
      {children}
    </div>
  );
};

// Keyboard Navigation Helper
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      {children}
    </div>
  );
};

// Screen Reader Only Text
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Live Region for Announcements
interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  id?: string;
  className?: string;
}

const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  id,
  className = 'sr-only'
}) => (
  <div
    id={id}
    aria-live={politeness}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className={className}
    role={politeness === 'assertive' ? 'alert' : 'status'}
  >
    {message}
  </div>
);

// Reduced Motion Wrapper
interface ReducedMotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ReducedMotion: React.FC<ReducedMotionProps> = ({ children, fallback }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// High Contrast Mode Detection
const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Focus Visible Utility
const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
};

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  const isFocusVisible = useFocusVisible();

  // Create motion-compatible props by filtering out conflicting HTML events
  const motionProps = {
    className: `
      relative inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 focus:outline-none
      ${isFocusVisible ? 'focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2 focus:ring-offset-brand-bg-dark' : ''}
      ${variant === 'primary' ? 'bg-brand-primary-600 hover:bg-brand-primary-700 text-white' : ''}
      ${variant === 'secondary' ? 'bg-brand-bg-medium hover:bg-brand-bg-light text-brand-text-primary border border-brand-bg-light' : ''}
      ${variant === 'ghost' ? 'bg-transparent hover:bg-brand-bg-medium text-brand-text-primary' : ''}
      ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''}
      ${size === 'md' ? 'px-4 py-2 text-sm' : ''}
      ${size === 'lg' ? 'px-6 py-3 text-base' : ''}
      ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
    `,
    disabled: disabled || loading,
    'aria-label': loading ? loadingText : ariaLabel,
    'aria-busy': loading,
    whileHover: !disabled && !loading ? { scale: 1.02 } : {},
    whileTap: !disabled && !loading ? { scale: 0.98 } : {},
    transition: { duration: 0.1 },
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
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <span className={loading ? 'sr-only' : ''}>{children}</span>
      {loading && <span aria-hidden="true">{loadingText}</span>}
    </motion.button>
  );
};

// Accessible Form Field
interface AccessibleFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  id,
  error,
  hint,
  required = false,
  children,
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-brand-text-primary"
      >
        {label}
        {required && (
          <span className="text-brand-error-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-brand-text-muted">
          {hint}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          ...((children as React.ReactElement).props || {}),
          id: id,
          'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          required: required,
        } as any)}
      </div>
      
      {error && (
        <motion.p
          id={errorId}
          className="text-sm text-brand-error-500 flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Enhanced ARIA Components
interface AriaExpandableProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}

const AriaExpandable: React.FC<AriaExpandableProps> = ({
  children,
  isExpanded,
  onToggle,
  label,
  className = ''
}) => {
  const buttonId = useId();
  const contentId = useId();

  return (
    <div className={className}>
      <button
        id={buttonId}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={onToggle}
        className="w-full text-left"
      >
        {label}
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};

// ARIA Tabs Component
interface AriaTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const AriaTabs: React.FC<AriaTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  orientation = 'horizontal',
  className = ''
}) => {
  const tabListId = useId();

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation={orientation}
        id={tabListId}
        className="flex"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 ${
              activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="mt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

// ARIA Progress Component
interface AriaProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
  showPercentage?: boolean;
  className?: string;
}

const AriaProgress: React.FC<AriaProgressProps> = ({
  value,
  max = 100,
  label,
  description,
  showPercentage = true,
  className = ''
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = useId();
  const descriptionId = useId();

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={progressId} className="text-sm font-medium">
          {label}
        </label>
        {showPercentage && (
          <span className="text-sm text-gray-500">{percentage}%</span>
        )}
      </div>
      <div
        id={progressId}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

export {
  SkipLink,
  FocusTrap,
  KeyboardNavigation,
  ScreenReaderOnly,
  LiveRegion,
  ReducedMotion,
  useHighContrast,
  useFocusVisible,
  AccessibleButton,
  AccessibleField,
  AriaExpandable,
  AriaTabs,
  AriaProgress,
};

export default SkipLink;
