'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'custom';
  message: string;
  position: { x: number; y: number };
  duration?: number;
  icon?: React.ReactNode;
  color?: string;
}

interface VisualFeedbackContextType {
  showFeedback: (
    element: HTMLElement | null,
    type: FeedbackItem['type'],
    message: string,
    options?: {
      duration?: number;
      icon?: React.ReactNode;
      color?: string;
      offset?: { x: number; y: number };
    }
  ) => void;
  showRipple: (element: HTMLElement | null, color?: string) => void;
  showFloatingText: (
    element: HTMLElement | null,
    text: string,
    options?: {
      color?: string;
      size?: 'sm' | 'md' | 'lg';
      direction?: 'up' | 'down' | 'left' | 'right';
    }
  ) => void;
  showPulse: (element: HTMLElement | null, color?: string, intensity?: number) => void;
}

const VisualFeedbackContext = createContext<VisualFeedbackContextType | undefined>(undefined);

export function VisualFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [ripples, setRipples] = useState<Array<{
    id: string;
    x: number;
    y: number;
    color: string;
  }>>([]);
  const [floatingTexts, setFloatingTexts] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    size: string;
    direction: string;
  }>>([]);
  const [pulses, setPulses] = useState<Array<{
    id: string;
    x: number;
    y: number;
    color: string;
    intensity: number;
  }>>([]);

  const showFeedback = useCallback((
    element: HTMLElement | null,
    type: FeedbackItem['type'],
    message: string,
    options: {
      duration?: number;
      icon?: React.ReactNode;
      color?: string;
      offset?: { x: number; y: number };
    } = {}
  ) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const feedbackItem: FeedbackItem = {
      id,
      type,
      message,
      position: {
        x: rect.left + rect.width / 2 + (options.offset?.x || 0),
        y: rect.top + (options.offset?.y || -10)
      },
      duration: options.duration || 2000,
      icon: options.icon,
      color: options.color
    };

    setFeedbackItems(prev => [...prev, feedbackItem]);

    // Auto-remove after duration
    setTimeout(() => {
      setFeedbackItems(prev => prev.filter(item => item.id !== id));
    }, feedbackItem.duration);
  }, []);

  const showRipple = useCallback((element: HTMLElement | null, color = 'rgba(59, 130, 246, 0.3)') => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const ripple = {
      id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color
    };

    setRipples(prev => [...prev, ripple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  const showFloatingText = useCallback((
    element: HTMLElement | null,
    text: string,
    options: {
      color?: string;
      size?: 'sm' | 'md' | 'lg';
      direction?: 'up' | 'down' | 'left' | 'right';
    } = {}
  ) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const floatingText = {
      id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      text,
      color: options.color || '#ffffff',
      size: options.size || 'md',
      direction: options.direction || 'up'
    };

    setFloatingTexts(prev => [...prev, floatingText]);

    // Remove after animation
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 2000);
  }, []);

  const showPulse = useCallback((
    element: HTMLElement | null,
    color = 'rgba(59, 130, 246, 0.5)',
    intensity = 1
  ) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const pulse = {
      id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color,
      intensity
    };

    setPulses(prev => [...prev, pulse]);

    // Remove after animation
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, []);

  const getIcon = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <X className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'loading':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <VisualFeedbackContext.Provider
      value={{
        showFeedback,
        showRipple,
        showFloatingText,
        showPulse
      }}
    >
      {children}
      
      {/* Feedback tooltips */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {feedbackItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute"
              style={{
                left: item.position.x,
                top: item.position.y,
                transform: 'translateX(-50%)'
              }}
            >
              <div
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm',
                  item.color ? '' : getTypeColor(item.type)
                )}
                style={item.color ? { backgroundColor: item.color } : {}}
              >
                {item.icon || getIcon(item.type)}
                <span className="text-sm font-medium">{item.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ripple effects */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-4 h-4 rounded-full"
              style={{
                left: ripple.x - 8,
                top: ripple.y - 8,
                backgroundColor: ripple.color
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating text */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {floatingTexts.map((text) => {
            const getAnimation = () => {
              switch (text.direction) {
                case 'up':
                  return { y: [0, -50], opacity: [1, 0] };
                case 'down':
                  return { y: [0, 50], opacity: [1, 0] };
                case 'left':
                  return { x: [0, -50], opacity: [1, 0] };
                case 'right':
                  return { x: [0, 50], opacity: [1, 0] };
                default:
                  return { y: [0, -50], opacity: [1, 0] };
              }
            };

            const getSizeClass = () => {
              switch (text.size) {
                case 'sm':
                  return 'text-sm';
                case 'lg':
                  return 'text-lg';
                default:
                  return 'text-base';
              }
            };

            return (
              <motion.div
                key={text.id}
                initial={{ opacity: 1, scale: 0.8 }}
                animate={{
                  ...getAnimation(),
                  scale: [0.8, 1.2, 1]
                }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className={cn(
                  'absolute font-bold pointer-events-none',
                  getSizeClass()
                )}
                style={{
                  left: text.x,
                  top: text.y,
                  color: text.color,
                  transform: 'translateX(-50%)',
                  textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {text.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pulse effects */}
      <div className="fixed inset-0 pointer-events-none z-30">
        <AnimatePresence>
          {pulses.map((pulse) => (
            <motion.div
              key={pulse.id}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{
                scale: [0, 2 * pulse.intensity, 3 * pulse.intensity],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute w-8 h-8 rounded-full"
              style={{
                left: pulse.x - 16,
                top: pulse.y - 16,
                backgroundColor: pulse.color
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </VisualFeedbackContext.Provider>
  );
}

export function useVisualFeedback() {
  const context = useContext(VisualFeedbackContext);
  if (!context) {
    throw new Error('useVisualFeedback must be used within a VisualFeedbackProvider');
  }
  return context;
}

// Enhanced form input with visual feedback
export function FeedbackInput({
  className,
  onSuccess,
  onError,
  validateOnBlur = true,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  validateOnBlur?: boolean;
}) {
  const { showFeedback, showRipple } = useVisualFeedback();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    showRipple(inputRef.current, 'rgba(59, 130, 246, 0.2)');
  };

  const handleBlur = () => {
    if (validateOnBlur && inputRef.current) {
      const value = inputRef.current.value;
      if (value && props.required) {
        showFeedback(inputRef.current, 'success', 'Valid input');
        onSuccess?.();
      } else if (props.required && !value) {
        showFeedback(inputRef.current, 'error', 'This field is required');
        onError?.('This field is required');
      }
    }
  };

  return (
    <input
      ref={inputRef}
      className={cn(
        'transition-all duration-200 focus:ring-2 focus:ring-blue-500',
        className
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}

// Enhanced button with visual feedback
export function FeedbackButton({
  children,
  onClick,
  className,
  feedbackType = 'success',
  feedbackMessage = 'Action completed',
  showRippleOnClick = true,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  feedbackType?: 'success' | 'error' | 'warning' | 'info';
  feedbackMessage?: string;
  showRippleOnClick?: boolean;
}) {
  const { showFeedback, showRipple } = useVisualFeedback();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showRippleOnClick) {
      showRipple(buttonRef.current);
    }
    
    if (onClick) {
      onClick(e);
      // Show feedback after a short delay
      setTimeout(() => {
        showFeedback(buttonRef.current, feedbackType, feedbackMessage);
      }, 100);
    }
  };

  return (
    <button
      ref={buttonRef}
      className={cn('transition-all duration-200', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
