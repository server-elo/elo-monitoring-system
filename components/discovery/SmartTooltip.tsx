'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SmartTooltipContent {
  title: string;
  description: string;
  shortcut?: string;
  learnMore?: {
    label: string;
    action: (_) => void;
  };
  category?: 'feature' | 'accessibility' | 'performance' | 'tip' | 'warning';
  showConditions?: {
    hoverCount?: number; // Show after X hovers
    timeOnElement?: number; // Show after X ms on element
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    firstTime?: boolean; // Show only on first interaction
  };
}

interface SmartTooltipProps {
  content: SmartTooltipContent;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  disabled?: boolean;
  className?: string;
  persistent?: boolean;
  adaptive?: boolean; // Adapts based on user behavior
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  onShow?: (_) => void;
  onHide?: (_) => void;
  onInteraction?: (_type: 'show' | 'hide' | 'click' | 'learn-more') => void;
}

export const SmartTooltip: React.FC<SmartTooltipProps> = ({
  content,
  children,
  placement = 'auto',
  trigger = 'hover',
  delay = 500,
  disabled = false,
  className = '',
  persistent = false,
  adaptive = true,
  userLevel = 'beginner',
  onShow,
  onHide,
  onInteraction,
}) => {
  const [isVisible, setIsVisible] = useState(_false);
  const [actualPlacement, setActualPlacement] = useState(_placement);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [shouldShow, setShouldShow] = useState(_true);
  const [interactionCount, setInteractionCount] = useState(0);
  const [timeOnElement, setTimeOnElement] = useState(0);
  
  const triggerRef = useRef<HTMLDivElement>(_null);
  const tooltipRef = useRef<HTMLDivElement>(_null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(_null);
  const hoverStartRef = useRef<number>(0);

  // Check if tooltip should be shown based on conditions
  useEffect(() => {
    if (!adaptive || !content.showConditions) {
      setShouldShow(_true);
      return;
    }

    const conditions = content.showConditions;
    let show = true;

    // Check user level
    if (_conditions.userLevel && conditions.userLevel !== userLevel) {
      show = false;
    }

    // Check hover count
    if (_conditions.hoverCount && interactionCount < conditions.hoverCount) {
      show = false;
    }

    // Check time on element
    if (_conditions.timeOnElement && timeOnElement < conditions.timeOnElement) {
      show = false;
    }

    // Check first time condition
    if (_conditions.firstTime) {
      const hasShown = localStorage.getItem(_`tooltip-shown-${content.title}`);
      if (hasShown) {
        show = false;
      }
    }

    setShouldShow(_show);
  }, [adaptive, content.showConditions, userLevel, interactionCount, timeOnElement]);

  const showTooltip = (_) => {
    if (_disabled || !shouldShow) return;
    
    if (_timeoutRef.current) {
      clearTimeout(_timeoutRef.current);
    }
    
    const showDelay = adaptive && userLevel === 'advanced' ? delay / 2 : delay;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(_true);
      calculatePosition(_);
      onShow?.(_);
      onInteraction?.('show');
      
      // Mark as shown for first-time conditions
      if (_content.showConditions?.firstTime) {
        localStorage.setItem( `tooltip-shown-${content.title}`, 'true');
      }
    }, trigger === 'hover' ? showDelay : 0);
  };

  const hideTooltip = (_) => {
    if (_timeoutRef.current) {
      clearTimeout(_timeoutRef.current);
    }
    
    if (!persistent) {
      setIsVisible(_false);
      onHide?.(_);
      onInteraction?.('hide');
    }
  };

  const calculatePosition = (_) => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect(_);
    const tooltipRect = tooltipRef.current.getBoundingClientRect(_);
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let finalPlacement = placement;
    let x = 0;
    let y = 0;

    // Auto placement logic
    if (_placement === 'auto') {
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;
      // const spaceLeft = triggerRect.left; // Not currently used for auto placement
      const spaceRight = viewport.width - triggerRect.right;

      if (_spaceBottom >= tooltipRect.height + 8) {
        finalPlacement = 'bottom';
      } else if (_spaceTop >= tooltipRect.height + 8) {
        finalPlacement = 'top';
      } else if (_spaceRight >= tooltipRect.width + 8) {
        finalPlacement = 'right';
      } else {
        finalPlacement = 'left';
      }
    }

    // Calculate position based on final placement
    switch (_finalPlacement) {
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
    if (_x < 8) x = 8;
    if (_x + tooltipRect.width > viewport.width - 8) {
      x = viewport.width - tooltipRect.width - 8;
    }
    if (_y < 8) y = 8;
    if (_y + tooltipRect.height > viewport.height - 8) {
      y = viewport.height - tooltipRect.height - 8;
    }

    setPosition( { x, y });
    setActualPlacement(_finalPlacement);
  };

  const handleMouseEnter = (_) => {
    if (_trigger === 'hover') {
      hoverStartRef.current = Date.now(_);
      setInteractionCount(_prev => prev + 1);
      showTooltip(_);
    }
  };

  const handleMouseLeave = (_) => {
    if (_trigger === 'hover') {
      const hoverDuration = Date.now(_) - hoverStartRef.current;
      setTimeOnElement(_prev => prev + hoverDuration);
      hideTooltip(_);
    }
  };

  const handleClick = (_) => {
    if (_trigger === 'click') {
      if (isVisible) {
        hideTooltip(_);
      } else {
        showTooltip(_);
      }
    }
    onInteraction?.('click');
  };

  const handleFocus = (_) => {
    if (_trigger === 'focus') {
      showTooltip(_);
    }
  };

  const handleBlur = (_) => {
    if (_trigger === 'focus') {
      hideTooltip(_);
    }
  };

  const getCategoryIcon = (_) => {
    switch (_content.category) {
      case 'accessibility':
        return '♿';
      case 'performance':
        return '⚡';
      case 'tip':
        return '💡';
      case 'warning':
        return '⚠️';
      default:
        return '📖';
    }
  };

  const getCategoryColor = (_) => {
    switch (_content.category) {
      case 'accessibility':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'performance':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'tip':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'warning':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    }
  };

  const triggerProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn( 'relative inline-block', className)}
        {...triggerProps}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && shouldShow && (
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
              getCategoryColor(_)
            )}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(_)}</span>
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
                  <button 
                    onClick={(_) => {
                      content.learnMore?.action(_);
                      onInteraction?.('learn-more');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {content.learnMore.label} →
                  </button>
                </div>
              )}

              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-2 h-2 rotate-45 border',
                  getCategoryColor(_),
                  actualPlacement === 'top' && 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-0 border-l-0',
                  actualPlacement === 'bottom' && 'top-[-5px] left-1/2 transform -translate-x-1/2 border-b-0 border-r-0',
                  actualPlacement === 'left' && 'right-[-5px] top-1/2 transform -translate-y-1/2 border-l-0 border-b-0',
                  actualPlacement === 'right' && 'left-[-5px] top-1/2 transform -translate-y-1/2 border-r-0 border-t-0'
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartTooltip;
