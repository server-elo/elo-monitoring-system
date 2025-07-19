'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation, Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  height?: 'auto' | 'full' | 'half' | 'third' | number;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnSwipeDown?: boolean;
  className?: string;
  overlayClassName?: string;
  preventScroll?: boolean;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  onSnapPointChange?: (index: number) => void;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  height = 'auto',
  showHandle = true,
  closeOnOverlayClick = true,
  closeOnSwipeDown = true,
  className,
  overlayClassName,
  preventScroll = true,
  snapPoints = [],
  defaultSnapPoint = 0,
  onSnapPointChange
}: BottomSheetProps) {
  const [_currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const dragStartY = useRef(0);
  const sheetHeight = useRef(0);

  // Calculate sheet height based on prop
  const getSheetHeight = useCallback(() => {
    if (typeof height === 'number') return height;
    
    const windowHeight = window.innerHeight;
    switch (height) {
      case 'full':
        return windowHeight * 0.95;
      case 'half':
        return windowHeight * 0.5;
      case 'third':
        return windowHeight * 0.33;
      case 'auto':
      default:
        return 'auto';
    }
  }, [height]);

  // Handle snap points
  const getSnapPointY = useCallback((index: number) => {
    if (!snapPoints.length || index < 0 || index >= snapPoints.length) return 0;
    
    const windowHeight = window.innerHeight;
    return windowHeight * (1 - snapPoints[index]);
  }, [snapPoints]);

  // Animate to snap point
  const animateToSnapPoint = useCallback((index: number) => {
    const y = getSnapPointY(index);
    controls.start({ y, transition: { type: 'spring', damping: 30, stiffness: 300 } });
    setCurrentSnapPoint(index);
    onSnapPointChange?.(index);
  }, [controls, getSnapPointY, onSnapPointChange]);

  // Handle drag end
  const handleDragEnd = useCallback((_event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Close if dragged down sufficiently or with high velocity
    if ((closeOnSwipeDown && offset > 100 && velocity > 0) || velocity > 500) {
      onClose();
      return;
    }
    
    // Snap to closest point if snap points are defined
    if (snapPoints.length > 0) {
      const currentY = dragStartY.current + offset;
      const windowHeight = window.innerHeight;
      
      // Find closest snap point
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      snapPoints.forEach((point, index) => {
        const snapY = windowHeight * (1 - point);
        const distance = Math.abs(currentY - snapY);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      // Consider velocity for better UX
      if (velocity > 100 && closestIndex < snapPoints.length - 1) {
        closestIndex++;
      } else if (velocity < -100 && closestIndex > 0) {
        closestIndex--;
      }
      
      animateToSnapPoint(closestIndex);
    } else {
      // Return to original position
      controls.start({ y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } });
    }
  }, [closeOnSwipeDown, onClose, snapPoints, controls, animateToSnapPoint]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen && preventScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventScroll]);

  // Reset snap point when opening
  useEffect(() => {
    if (isOpen && snapPoints.length > 0) {
      animateToSnapPoint(defaultSnapPoint);
    }
  }, [isOpen, defaultSnapPoint, snapPoints, animateToSnapPoint]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sheetVariants: Variants = {
    hidden: { y: '100%' },
    visible: { 
      y: snapPoints.length > 0 ? getSnapPointY(defaultSnapPoint) : 0,
      transition: { type: 'spring', damping: 30, stiffness: 300 } 
    },
    exit: { 
      y: '100%',
      transition: { duration: 0.2 } 
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className={cn(
              "fixed inset-0 bg-black/50 backdrop-blur-sm z-40",
              overlayClassName
            )}
            aria-hidden="true"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
            aria-describedby={description ? "bottom-sheet-description" : undefined}
            variants={sheetVariants}
            initial="hidden"
            animate={controls}
            exit="exit"
            drag={closeOnSwipeDown || snapPoints.length > 0 ? "y" : false}
            dragElastic={0.2}
            dragConstraints={{ top: 0 }}
            onDragStart={() => {
              if (sheetRef.current) {
                const rect = sheetRef.current.getBoundingClientRect();
                dragStartY.current = rect.top;
                sheetHeight.current = rect.height;
              }
            }}
            onDragEnd={handleDragEnd}
            style={{ height: getSheetHeight() }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-gray-900 rounded-t-2xl shadow-xl",
              "flex flex-col",
              "max-h-[95vh]",
              className
            )}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
              </div>
            )}
            
            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title && (
                      <h2 
                        id="bottom-sheet-title" 
                        className="text-lg font-semibold text-white"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p 
                        id="bottom-sheet-description" 
                        className="mt-1 text-sm text-gray-400"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Content */}
            <div 
              ref={contentRef}
              className={cn(
                "flex-1 overflow-y-auto overscroll-contain px-6 pb-6",
                !title && !description && "pt-2"
              )}
            >
              {children}
            </div>
            
            {/* Safe area for iOS */}
            <div className="pb-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Example usage component for mobile menus
interface MobileMenuBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    icon?: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>;
  title?: string;
}

export function MobileMenuBottomSheet({
  isOpen,
  onClose,
  items,
  title
}: MobileMenuBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      height="auto"
    >
      <div className="space-y-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "text-left",
                item.disabled && "opacity-50 cursor-not-allowed",
                item.variant === 'danger' 
                  ? "text-red-400 hover:bg-red-900/20" 
                  : "text-gray-200 hover:bg-gray-800"
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}