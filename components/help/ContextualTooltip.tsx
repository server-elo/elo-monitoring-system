'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TooltipContent {
  title: string;
  description: string;
  shortcut?: string;
  learnMore?: string;
  category?: 'feature' | 'accessibility' | 'performance' | 'tip';
}

interface ContextualTooltipProps {
  content: TooltipContent;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  disabled?: boolean;
  className?: string;
  persistent?: boolean;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  content,
  children,
  placement = 'top',
  trigger = 'hover',
  delay = 500,
  disabled = false,
  className = '',
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, trigger === 'hover' ? delay : 0);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!persistent) {
      setIsVisible(false);
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Adjust for viewport boundaries
    if (x < 8) x = 8;
    if (x + tooltipRect.width > viewport.width - 8) {
      x = viewport.width - tooltipRect.width - 8;
    }
    if (y < 8) y = 8;
    if (y + tooltipRect.height > viewport.height - 8) {
      y = viewport.height - tooltipRect.height - 8;
    }

    setPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    const handleScroll = () => {
      if (isVisible && !persistent) {
        hideTooltip();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, persistent]);

  const getCategoryIcon = () => {
    switch (content.category) {
      case 'accessibility':
        return '♿';
      case 'performance':
        return '⚡';
      case 'tip':
        return '💡';
      default:
        return '📖';
    }
  };

  const getCategoryColor = () => {
    switch (content.category) {
      case 'accessibility':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'performance':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'tip':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    }
  };

  const handleTriggerEvents = () => {
    const events: any = {};

    if (trigger === 'hover') {
      events.onMouseEnter = showTooltip;
      events.onMouseLeave = hideTooltip;
    } else if (trigger === 'click') {
      events.onClick = () => {
        if (isVisible) {
          hideTooltip();
        } else {
          showTooltip();
        }
      };
    } else if (trigger === 'focus') {
      events.onFocus = showTooltip;
      events.onBlur = hideTooltip;
    }

    return events;
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('relative inline-block', className)}
        {...handleTriggerEvents()}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 max-w-sm"
            style={{
              left: position.x,
              top: position.y,
            }}
            role="tooltip"
            aria-live="polite"
          >
            <div className={cn(
              'glass border rounded-lg p-4 shadow-xl',
              getCategoryColor()
            )}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon()}</span>
                  <h3 className="font-semibold text-white text-sm">
                    {content.title}
                  </h3>
                </div>
                {persistent && (
                  <button
                    onClick={hideTooltip}
                    className="text-gray-400 hover:text-white transition-colors ml-2"
                    aria-label="Close tooltip"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                {content.description}
              </p>

              {/* Shortcut */}
              {content.shortcut && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs text-gray-400">Shortcut:</span>
                  <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono">
                    {content.shortcut}
                  </kbd>
                </div>
              )}

              {/* Learn More */}
              {content.learnMore && (
                <div className="pt-2 border-t border-white/10">
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    {content.learnMore} →
                  </button>
                </div>
              )}

              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-2 h-2 rotate-45 border',
                  getCategoryColor(),
                  placement === 'top' && 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-0 border-l-0',
                  placement === 'bottom' && 'top-[-5px] left-1/2 transform -translate-x-1/2 border-b-0 border-r-0',
                  placement === 'left' && 'right-[-5px] top-1/2 transform -translate-y-1/2 border-l-0 border-b-0',
                  placement === 'right' && 'left-[-5px] top-1/2 transform -translate-y-1/2 border-r-0 border-t-0'
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Predefined tooltip contents for common features
export const TOOLTIP_CONTENTS = {
  codeEditor: {
    title: 'Monaco Code Editor',
    description: 'Professional code editor with Solidity syntax highlighting, auto-completion, and real-time error detection.',
    shortcut: 'Ctrl+S to save',
    learnMore: 'Learn about editor features',
    category: 'feature' as const,
  },
  aiTutor: {
    title: 'AI Tutor Assistant',
    description: 'Get personalized help and explanations powered by Google Gemini AI. Ask questions about your code or Solidity concepts.',
    shortcut: 'Ctrl+Shift+A',
    learnMore: 'Explore AI features',
    category: 'feature' as const,
  },
  accessibility: {
    title: 'Accessibility Features',
    description: 'This platform supports screen readers, keyboard navigation, and follows WCAG 2.1 AA guidelines for inclusive learning.',
    shortcut: 'Alt+H for help',
    learnMore: 'View accessibility guide',
    category: 'accessibility' as const,
  },
  performance: {
    title: 'Performance Optimized',
    description: 'This feature uses lazy loading and caching for optimal performance. Content loads as needed to maintain fast interactions.',
    learnMore: 'Performance tips',
    category: 'performance' as const,
  },
  keyboardNav: {
    title: 'Keyboard Navigation',
    description: 'Navigate using Tab, Enter, and arrow keys. Press Escape to close dialogs and ? for help.',
    shortcut: 'Tab to navigate',
    learnMore: 'Keyboard shortcuts guide',
    category: 'accessibility' as const,
  },
  gamification: {
    title: 'Gamification System',
    description: 'Earn XP, unlock achievements, and track your progress as you learn Solidity programming.',
    learnMore: 'View achievements',
    category: 'feature' as const,
  },
};

export default ContextualTooltip;
