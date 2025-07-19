'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { buttonVariants } from '@/lib/animations/micro-interactions';
import { cn } from '@/lib/utils';
import { useAsyncButton, AsyncButtonOptions } from '@/lib/hooks/useAsyncButton';
import Tooltip from '@/components/ui/Tooltip';

export interface EnhancedButtonProps extends ButtonProps {
  // Async handling
  asyncAction?: () => Promise<void>;
  asyncOptions?: AsyncButtonOptions;

  // Visual feedback states
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showFeedback?: boolean;

  // Accessibility & UX
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
  description?: string;

  // Visual enhancements
  pulseOnHover?: boolean;
  glowEffect?: boolean;
  soundEffect?: boolean;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;

  // Touch-friendly sizing
  touchTarget?: boolean; // Ensures 44px minimum height

  children: React.ReactNode;
}

export function EnhancedButton({
  // Async handling
  asyncAction,
  asyncOptions = {},

  // Visual feedback states
  loading = false,
  success = false,
  error = false,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error',
  showFeedback = true,

  // Accessibility & UX
  tooltip,
  tooltipPosition = 'top',
  ariaLabel,
  description,

  // Visual enhancements
  pulseOnHover = false,
  glowEffect = false,
  soundEffect = false,
  hapticFeedback = true,
  rippleEffect = true,

  // Touch-friendly sizing
  touchTarget = false,

  children,
  className,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps) {
  // Async button state management
  const asyncButton = useAsyncButton(asyncOptions);

  // Local state for visual feedback
  const [isPressed, setIsPressed] = useState(false);
  const [_showSuccessAnimation, _setShowSuccessAnimation] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Determine current state (prioritize async state over props)
  const currentLoading = asyncButton.state.isLoading || loading;
  const currentSuccess = asyncButton.state.isSuccess || success;
  const currentError = asyncButton.state.isError || error;
  const currentDisabled = asyncButton.state.isDisabled || disabled || currentLoading;

  // Get current text based on state
  const getCurrentText = () => {
    if (currentLoading) return loadingText;
    if (currentSuccess && showFeedback) return successText;
    if (currentError && showFeedback) return errorText || asyncButton.state.error || 'Error';
    return children;
  };

  // Get current icon based on state
  const getCurrentIcon = () => {
    if (currentLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (currentSuccess && showFeedback) return <Check className="w-4 h-4" />;
    if (currentError && showFeedback) return <AlertCircle className="w-4 h-4" />;
    return null;
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (currentDisabled) return;

    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Sound effect
    if (soundEffect) {
      playClickSound();
    }

    // Visual feedback
    if (rippleEffect) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
    }

    // Handle async action
    if (asyncAction) {
      await asyncButton.execute(asyncAction);
    }

    // Handle regular onClick
    if (onClick) {
      await onClick(e);
    }
  };

  // Keyboard event handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  // Cleanup async button on unmount
  useEffect(() => {
    return () => {
      asyncButton.cleanup();
    };
  }, [asyncButton]);

  const playClickSound = () => {
    // Create a subtle click sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Fallback: silent operation if Web Audio API is not available
    }
  };

  const getButtonContent = () => {
    const icon = getCurrentIcon();
    const text = getCurrentText();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center space-x-2"
        key={`${currentLoading}-${currentSuccess}-${currentError}`} // Force re-render on state change
      >
        {icon && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            {icon}
          </motion.span>
        )}

        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: icon ? 0.1 : 0 }}
          className="font-medium"
        >
          {text}
        </motion.span>
      </motion.div>
    );
  };

  const buttonVariant = currentLoading ? 'loading' : isPressed ? 'tap' : 'idle';

  const buttonContent = (
    <motion.div className="relative inline-block">
      <motion.div
        variants={buttonVariants}
        initial="idle"
        animate={buttonVariant}
        whileHover={!currentDisabled ? 'hover' : 'idle'}
        whileTap={!currentDisabled ? 'tap' : 'idle'}
        className={cn(
          'relative',
          glowEffect && !currentDisabled && 'filter drop-shadow-lg',
          className
        )}
      >
        <Button
          {...props}
          ref={buttonRef}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={currentDisabled}
          aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
          aria-describedby={description ? `${props.id}-desc` : undefined}
          className={cn(
            'relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
            // Touch target sizing
            touchTarget && 'min-h-[44px] min-w-[44px]',
            // State-based styling
            pulseOnHover && !currentDisabled && 'hover:animate-pulse',
            currentSuccess && showFeedback && 'bg-green-600 hover:bg-green-700 text-white',
            currentError && showFeedback && 'bg-red-600 hover:bg-red-700 text-white',
            currentLoading && 'cursor-not-allowed opacity-75',
            currentDisabled && !currentLoading && 'opacity-50 cursor-not-allowed',
            // Hover effects
            !currentDisabled && 'hover:scale-[1.02] active:scale-[0.98]',
            // Focus styles
            'focus:ring-blue-500/50',
            className
          )}
        >
          {/* Background ripple effect */}
          <AnimatePresence>
            {isPressed && rippleEffect && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 bg-white rounded-full"
                style={{ transformOrigin: 'center' }}
              />
            )}
          </AnimatePresence>

          {/* Button content */}
          <span className="relative z-10">
            {getButtonContent()}
          </span>

          {/* Glow effect */}
          {glowEffect && !currentDisabled && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg opacity-20 blur-sm"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </Button>
      </motion.div>

      {/* Error message */}
      {currentError && asyncButton.state.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-600 text-white text-sm rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{asyncButton.state.error}</span>
          </div>
        </motion.div>
      )}

      {/* Description */}
      {description && (
        <div id={`${props.id}-desc`} className="sr-only">
          {description}
        </div>
      )}

      {/* Success animation overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            >
              <Check className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating particles for special effects */}
      <AnimatePresence>
        {success && showSuccessAnimation && (
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
    </motion.div>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip content={tooltip} side={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
}

// Preset button variants for common use cases
export function PrimaryButton(props: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      className={cn(
        'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold',
        props.className
      )}
      glowEffect
      pulseOnHover
      touchTarget
      rippleEffect
      showFeedback
    />
  );
}

export function SecondaryButton(props: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      variant="outline"
      className={cn(
        'border-white/20 hover:border-white/40 text-white hover:bg-white/10',
        props.className
      )}
      touchTarget
      rippleEffect
      showFeedback
    />
  );
}

export function SuccessButton(props: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      className={cn(
        'bg-green-600 hover:bg-green-700 text-white',
        props.className
      )}
      success
      showFeedback
    />
  );
}

export function DangerButton(props: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      className={cn(
        'bg-red-600 hover:bg-red-700 text-white',
        props.className
      )}
      hapticFeedback
    />
  );
}

export function FloatingActionButton(props: EnhancedButtonProps) {
  return (
    <EnhancedButton
      {...props}
      className={cn(
        'fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg z-50',
        props.className
      )}
      glowEffect
      soundEffect
      hapticFeedback
      touchTarget
      rippleEffect
      showFeedback
    />
  );
}

// Specialized async button components
export function AsyncSubmitButton(props: Omit<EnhancedButtonProps, 'asyncAction' | 'children'> & {
  onSubmit: () => Promise<void>;
  submitText?: string;
}) {
  const { onSubmit, submitText = 'Submit', ...buttonProps } = props;

  return (
    <PrimaryButton
      {...buttonProps}
      asyncAction={onSubmit}
      loadingText="Submitting..."
      successText="Submitted!"
      asyncOptions={{
        debounceMs: 500,
        successDuration: 2000,
        errorDuration: 4000,
        preventDoubleClick: true,
        ...props.asyncOptions
      }}
    >
      {submitText}
    </PrimaryButton>
  );
}

export function AsyncSaveButton(props: Omit<EnhancedButtonProps, 'asyncAction' | 'children'> & {
  onSave: () => Promise<void>;
}) {
  const { onSave, ...buttonProps } = props;

  return (
    <EnhancedButton
      {...buttonProps}
      asyncAction={onSave}
      loadingText="Saving..."
      successText="Saved!"
      className={cn(
        'bg-green-600 hover:bg-green-700 text-white',
        props.className
      )}
      asyncOptions={{
        debounceMs: 300,
        successDuration: 1500,
        errorDuration: 3000,
        preventDoubleClick: true,
        ...props.asyncOptions
      }}
      touchTarget
      rippleEffect
      showFeedback
    >
      Save Changes
    </EnhancedButton>
  );
}

export function AsyncDeleteButton(props: Omit<EnhancedButtonProps, 'asyncAction' | 'children'> & {
  onDelete: () => Promise<void>;
  confirmText?: string;
}) {
  const { onDelete, confirmText = 'Delete', ...buttonProps } = props;

  return (
    <DangerButton
      {...buttonProps}
      asyncAction={onDelete}
      loadingText="Deleting..."
      successText="Deleted!"
      asyncOptions={{
        debounceMs: 500,
        successDuration: 1500,
        errorDuration: 4000,
        preventDoubleClick: true,
        ...props.asyncOptions
      }}
      touchTarget
      rippleEffect
      showFeedback
    >
      {confirmText}
    </DangerButton>
  );
}
