import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/lib/hooks/useSettings';
;
;
import { cn } from '@/lib/utils';

// Skeleton Components
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'image';
  width?: string | number;
  height?: string | number;
  lines?: number;
  'aria-label'?: string;
  delay?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
  'aria-label': ariaLabel,
  delay = 0,
}) => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = React.useState(delay === 0);

  // Respect user's reduced motion preference
  const shouldAnimate = !settings?.accessibility?.reduceMotion;

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const baseClasses = cn(
    'bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50 backdrop-blur-sm rounded',
    shouldAnimate && 'animate-pulse'
  );
  
  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32',
    button: 'h-10',
    image: 'h-48',
  };

  const variantWidths = {
    text: 'w-full',
    title: 'w-3/4',
    avatar: 'w-10',
    card: 'w-full',
    button: 'w-24',
    image: 'w-full',
  };

  if (!isVisible) return null;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label={ariaLabel || "Loading content"}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: shouldAnimate ? 0.3 : 0, delay: index * 0.1 }}
            className={`${baseClasses} ${variantClasses[variant]} ${
              index === lines - 1 ? 'w-2/3' : variantWidths[variant]
            }`}
            style={{ width: width, height: height }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
      className={`${baseClasses} ${variantClasses[variant]} ${variantWidths[variant]} ${className}`}
      style={{ width: width, height: height }}
      role="status"
      aria-label={ariaLabel || "Loading content"}
      aria-live="polite"
    />
  );
};

// Module Content Skeleton
const ModuleContentSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <Skeleton variant="title" />
    <Skeleton variant="text" lines={3} />
    <Skeleton variant="card" />
    <Skeleton variant="text" lines={2} />
    <div className="flex gap-3">
      <Skeleton variant="button" />
      <Skeleton variant="button" />
    </div>
  </div>
);

// Sidebar Skeleton
const SidebarSkeleton: React.FC = () => (
  <div className="space-y-6 p-4">
    <Skeleton variant="title" />
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="60%" />
          <div className="ml-4 space-y-1">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="75%" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Chat Skeleton
const ChatSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs space-y-2 ${index % 2 === 0 ? 'bg-brand-primary-600/20' : 'bg-brand-bg-medium'} p-3 rounded-lg`}>
          <Skeleton variant="text" lines={2} />
        </div>
      </div>
    ))}
  </div>
);

// Loading Spinner Components
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
  className?: string;
  text?: string;
  subText?: string;
  progress?: number;
  showProgress?: boolean;
  'aria-label'?: string;
}

const LoadingSpinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  text: _text,
  subText: _subText,
  progress: _progress,
  showProgress: _showProgress = false,
  'aria-label': _ariaLabel,
}) => {
  const { settings } = useSettings();
  // Animation control is handled by motion components directly
  // const shouldAnimate = !settings?.accessibility?.reduceMotion;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`bg-brand-primary-500 rounded-full ${sizeClasses[size]}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={`bg-brand-primary-500 rounded-full ${sizeClasses[size]} ${className}`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-1 bg-brand-primary-500 rounded-full"
            style={{ height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px' }}
            animate={{
              scaleY: [1, 2, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  // Default spinner
  return (
    <motion.div
      className={`border-2 border-brand-bg-light border-t-brand-primary-500 rounded-full ${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

// Progressive Loading Component
interface ProgressiveLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  delay?: number;
}

const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  isLoading,
  children,
  skeleton,
  delay = 0,
}) => {
  const [showContent, setShowContent] = React.useState(!isLoading);

  React.useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, delay]);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading || !showContent ? (
        skeleton || <Skeleton variant="card" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  variant = 'default',
}) => {
  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-brand-bg-medium rounded-xl p-6 shadow-2xl border border-brand-bg-light/20 flex flex-col items-center gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <LoadingSpinner size="lg" variant={variant} />
        <p className="text-brand-text-primary font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
};

// Lazy Loading Component
interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      ) : (
        placeholder || <Skeleton variant="card" />
      )}
    </div>
  );
};

export {
  Skeleton,
  ModuleContentSkeleton,
  SidebarSkeleton,
  ChatSkeleton,
  LoadingSpinner,
  ProgressiveLoading,
  LoadingOverlay,
  LazyLoad,
};

export default LoadingSpinner;
